const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  const classes = db.prepare(`
    SELECT c.*,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as booked_count,
      COUNT(CASE WHEN b.status = 'waitlist' THEN 1 END) as waitlist_count
    FROM classes c
    LEFT JOIN bookings b ON b.class_id = c.id
    WHERE c.active = 1
    GROUP BY c.id
    ORDER BY c.day_of_week, c.start_time
  `).all();
  res.json(classes);
});

router.get('/:id', requireAuth, (req, res) => {
  const cls = db.prepare(`
    SELECT c.*,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as booked_count,
      COUNT(CASE WHEN b.status = 'waitlist' THEN 1 END) as waitlist_count
    FROM classes c LEFT JOIN bookings b ON b.class_id = c.id
    WHERE c.id = ? GROUP BY c.id
  `).get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  res.json(cls);
});

router.post('/', requireAdmin, (req, res) => {
  const { title, description, instructor, day_of_week, start_time, duration_mins, capacity, location } = req.body;
  if (!title || instructor == null || day_of_week == null || !start_time) {
    return res.status(400).json({ error: 'Title, instructor, day_of_week, and start_time are required' });
  }
  db.prepare(`INSERT INTO classes (title, description, instructor, day_of_week, start_time, duration_mins, capacity, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(title, description || null, instructor, day_of_week, start_time, duration_mins || 60, capacity || 15, location || null);
  const cls = db.prepare('SELECT * FROM classes ORDER BY id DESC LIMIT 1').get();
  res.status(201).json(cls);
});

router.put('/:id', requireAdmin, (req, res) => {
  const { title, description, instructor, day_of_week, start_time, duration_mins, capacity, location, active } = req.body;
  const result = db.prepare(`
    UPDATE classes SET
      title = COALESCE(?, title), description = COALESCE(?, description),
      instructor = COALESCE(?, instructor), day_of_week = COALESCE(?, day_of_week),
      start_time = COALESCE(?, start_time), duration_mins = COALESCE(?, duration_mins),
      capacity = COALESCE(?, capacity), location = COALESCE(?, location),
      active = COALESCE(?, active)
    WHERE id = ?
  `).run(title, description, instructor, day_of_week, start_time, duration_mins, capacity, location, active, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Updated' });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const result = db.prepare('UPDATE classes SET active = 0 WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Class deactivated' });
});

router.get('/:id/roster', requireAdmin, (req, res) => {
  const confirmed = db.prepare(`
    SELECT u.id, u.email, sp.first_name, sp.last_name, sp.phone, b.booked_at, b.status
    FROM bookings b JOIN users u ON u.id = b.user_id JOIN student_profiles sp ON sp.user_id = u.id
    WHERE b.class_id = ? AND b.status = 'confirmed' ORDER BY sp.last_name
  `).all(req.params.id);
  const waitlist = db.prepare(`
    SELECT u.id, u.email, sp.first_name, sp.last_name, b.booked_at, b.waitlist_position
    FROM bookings b JOIN users u ON u.id = b.user_id JOIN student_profiles sp ON sp.user_id = u.id
    WHERE b.class_id = ? AND b.status = 'waitlist' ORDER BY b.waitlist_position
  `).all(req.params.id);
  res.json({ confirmed, waitlist });
});

module.exports = router;
