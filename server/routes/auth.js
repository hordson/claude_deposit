const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email.toLowerCase(), hash, 'student');
    const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(email.toLowerCase());
    db.prepare(`INSERT INTO student_profiles (user_id, first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(user.id, first_name, last_name, phone || null, date_of_birth || null, emergency_contact_name || null, emergency_contact_phone || null);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, first_name, last_name } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const profile = db.prepare('SELECT first_name, last_name FROM student_profiles WHERE user_id = ?').get(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, ...profile } });
});

module.exports = router;
