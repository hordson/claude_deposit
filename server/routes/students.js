const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, (req, res) => {
  const students = db.prepare(`
    SELECT u.id, u.email, u.created_at,
      sp.first_name, sp.last_name, sp.phone, sp.date_of_birth,
      sp.emergency_contact_name, sp.emergency_contact_phone, sp.notes, sp.active, sp.joined_at,
      COUNT(b.id) as total_bookings
    FROM users u
    JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN bookings b ON b.user_id = u.id AND b.status = 'confirmed'
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY sp.last_name, sp.first_name
  `).all();
  res.json(students);
});

router.get('/me/profile', requireAuth, (req, res) => {
  const profile = db.prepare(`
    SELECT u.email, sp.first_name, sp.last_name, sp.phone, sp.date_of_birth,
      sp.emergency_contact_name, sp.emergency_contact_phone, sp.joined_at
    FROM users u JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id);
  res.json(profile);
});

router.put('/me/profile', requireAuth, (req, res) => {
  const { phone, emergency_contact_name, emergency_contact_phone } = req.body;
  db.prepare(`UPDATE student_profiles SET
    phone = COALESCE(?, phone),
    emergency_contact_name = COALESCE(?, emergency_contact_name),
    emergency_contact_phone = COALESCE(?, emergency_contact_phone)
    WHERE user_id = ?`)
    .run(phone, emergency_contact_name, emergency_contact_phone, req.user.id);
  res.json({ message: 'Profile updated' });
});

router.get('/:id', requireAdmin, (req, res) => {
  const student = db.prepare(`
    SELECT u.id, u.email, u.created_at,
      sp.first_name, sp.last_name, sp.phone, sp.date_of_birth,
      sp.emergency_contact_name, sp.emergency_contact_phone, sp.notes, sp.active, sp.joined_at
    FROM users u
    JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.id = ? AND u.role = 'student'
  `).get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const bookings = db.prepare(`
    SELECT b.id, b.status, b.booked_at, c.title, c.day_of_week, c.start_time, c.instructor
    FROM bookings b JOIN classes c ON c.id = b.class_id
    WHERE b.user_id = ? ORDER BY b.booked_at DESC
  `).all(req.params.id);
  res.json({ ...student, bookings });
});

router.post('/', requireAdmin, (req, res) => {
  const { email, password, first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes } = req.body;
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email.toLowerCase(), hash, 'student');
    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase());
    db.prepare(`INSERT INTO student_profiles (user_id, first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(user.id, first_name, last_name, phone || null, date_of_birth || null, emergency_contact_name || null, emergency_contact_phone || null, notes || null);
    res.status(201).json({ id: user.id, email: user.email, first_name, last_name });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, active } = req.body;
  const result = db.prepare(`
    UPDATE student_profiles SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      date_of_birth = COALESCE(?, date_of_birth),
      emergency_contact_name = COALESCE(?, emergency_contact_name),
      emergency_contact_phone = COALESCE(?, emergency_contact_phone),
      notes = COALESCE(?, notes),
      active = COALESCE(?, active)
    WHERE user_id = ?
  `).run(first_name, last_name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, active, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Updated' });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.params.id, 'student');
  if (!result.changes) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
