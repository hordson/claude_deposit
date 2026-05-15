const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Class definitions ──────────────────────────────────────────────────────

// List all class definitions (admin)
router.get('/definitions', requireAdmin, (req, res) => {
  const classes = db.prepare('SELECT * FROM classes WHERE active = 1 ORDER BY title').all();
  res.json(classes);
});

// Create a class definition (admin)
router.post('/definitions', requireAdmin, (req, res) => {
  const { title, description, instructor, duration_mins, capacity, location } = req.body;
  if (!title || !instructor) return res.status(400).json({ error: 'Title and instructor are required' });
  db.prepare('INSERT INTO classes (title, description, instructor, duration_mins, capacity, location) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, description || null, instructor, duration_mins || 75, capacity || 20, location || null);
  const cls = db.prepare('SELECT * FROM classes ORDER BY id DESC LIMIT 1').get();
  res.status(201).json(cls);
});

// Update a class definition (admin)
router.put('/definitions/:id', requireAdmin, (req, res) => {
  const { title, description, instructor, duration_mins, capacity, location } = req.body;
  const result = db.prepare(`UPDATE classes SET
    title = COALESCE(?, title), description = COALESCE(?, description),
    instructor = COALESCE(?, instructor), duration_mins = COALESCE(?, duration_mins),
    capacity = COALESCE(?, capacity), location = COALESCE(?, location)
    WHERE id = ?`).run(title, description, instructor, duration_mins, capacity, location, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Updated' });
});

// Delete a class definition (admin)
router.delete('/definitions/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE classes SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deactivated' });
});

// ── Sessions (specific dated instances) ────────────────────────────────────

// Get sessions in a date range (used by student calendar + admin)
router.get('/sessions', requireAuth, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to date params required' });

  const sessions = db.prepare(`
    SELECT
      s.id, s.date, s.start_time, s.cancelled,
      COALESCE(s.capacity_override, c.capacity) as capacity,
      c.id as class_id, c.title, c.instructor, c.duration_mins, c.location, c.description,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as booked_count,
      COUNT(CASE WHEN b.status = 'waitlist' THEN 1 END) as waitlist_count
    FROM class_sessions s
    JOIN classes c ON c.id = s.class_id
    LEFT JOIN bookings b ON b.session_id = s.id
    WHERE s.date >= ? AND s.date <= ? AND c.active = 1 AND s.cancelled = 0
    GROUP BY s.id
    ORDER BY s.date, s.start_time
  `).all(from, to);
  res.json(sessions);
});

// Create one or more sessions (admin)
router.post('/sessions', requireAdmin, (req, res) => {
  const { class_id, dates, start_time, capacity_override } = req.body;
  // dates is an array of YYYY-MM-DD strings
  if (!class_id || !dates?.length || !start_time) {
    return res.status(400).json({ error: 'class_id, dates[], and start_time are required' });
  }
  const insert = db.prepare('INSERT INTO class_sessions (class_id, date, start_time, capacity_override) VALUES (?, ?, ?, ?)');
  const created = [];
  for (const date of dates) {
    insert.run(class_id, date, start_time, capacity_override || null);
    created.push(date);
  }
  res.status(201).json({ created });
});

// Update a session (admin)
router.put('/sessions/:id', requireAdmin, (req, res) => {
  const { date, start_time, capacity_override, cancelled } = req.body;
  const result = db.prepare(`UPDATE class_sessions SET
    date = COALESCE(?, date), start_time = COALESCE(?, start_time),
    capacity_override = COALESCE(?, capacity_override),
    cancelled = COALESCE(?, cancelled)
    WHERE id = ?`).run(date, start_time, capacity_override, cancelled, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Session not found' });
  res.json({ message: 'Updated' });
});

// Cancel a session (admin)
router.delete('/sessions/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE class_sessions SET cancelled = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Session cancelled' });
});

// Get roster for a session (admin)
router.get('/sessions/:id/roster', requireAdmin, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, c.title, c.instructor FROM class_sessions s JOIN classes c ON c.id = s.class_id WHERE s.id = ?
  `).get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const confirmed = db.prepare(`
    SELECT u.id, u.email, sp.first_name, sp.last_name, sp.phone, b.booked_at
    FROM bookings b JOIN users u ON u.id = b.user_id JOIN student_profiles sp ON sp.user_id = u.id
    WHERE b.session_id = ? AND b.status = 'confirmed' ORDER BY sp.last_name
  `).all(req.params.id);

  const waitlist = db.prepare(`
    SELECT u.id, u.email, sp.first_name, sp.last_name, b.booked_at, b.waitlist_position
    FROM bookings b JOIN users u ON u.id = b.user_id JOIN student_profiles sp ON sp.user_id = u.id
    WHERE b.session_id = ? AND b.status = 'waitlist' ORDER BY b.waitlist_position
  `).all(req.params.id);

  res.json({ session, confirmed, waitlist });
});

module.exports = router;
