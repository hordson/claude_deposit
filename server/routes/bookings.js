const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Student: get my bookings (upcoming)
router.get('/mine', requireAuth, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.id, b.status, b.waitlist_position, b.booked_at,
      s.id as session_id, s.date, s.start_time,
      c.id as class_id, c.title, c.instructor, c.duration_mins, c.location
    FROM bookings b
    JOIN class_sessions s ON s.id = b.session_id
    JOIN classes c ON c.id = s.class_id
    WHERE b.user_id = ? AND s.date >= date('now') AND s.cancelled = 0
    ORDER BY s.date, s.start_time
  `).all(req.user.id);
  res.json(bookings);
});

// Student: book a session
router.post('/', requireAuth, (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  const session = db.prepare(`
    SELECT s.*, COALESCE(s.capacity_override, c.capacity) as effective_capacity
    FROM class_sessions s JOIN classes c ON c.id = s.class_id
    WHERE s.id = ? AND s.cancelled = 0 AND c.active = 1
  `).get(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found or cancelled' });

  const existing = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND session_id = ?').get(req.user.id, session_id);
  if (existing) return res.status(409).json({ error: 'Already booked', status: existing.status });

  const confirmedCount = db.prepare("SELECT COUNT(*) as n FROM bookings WHERE session_id = ? AND status = 'confirmed'").get(session_id).n;

  if (confirmedCount < session.effective_capacity) {
    db.prepare("INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, 'confirmed')").run(req.user.id, session_id);
    return res.status(201).json({ message: 'Booked successfully', status: 'confirmed' });
  }

  // Class full — add to waitlist
  const maxPos = db.prepare("SELECT MAX(waitlist_position) as m FROM bookings WHERE session_id = ? AND status = 'waitlist'").get(session_id).m || 0;
  db.prepare("INSERT INTO bookings (user_id, session_id, status, waitlist_position) VALUES (?, ?, 'waitlist', ?)").run(req.user.id, session_id, maxPos + 1);
  res.status(201).json({ message: `Added to waitlist at position ${maxPos + 1}`, status: 'waitlist', position: maxPos + 1 });
});

// Student: cancel booking
router.delete('/:id', requireAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(booking.id);
  if (booking.status === 'confirmed') promoteWaitlist(booking.session_id);
  res.json({ message: 'Booking cancelled' });
});

// Admin: view all bookings
router.get('/', requireAdmin, (req, res) => {
  const { from, to } = req.query;
  let query = `
    SELECT b.id, b.status, b.waitlist_position, b.booked_at,
      u.id as user_id, u.email, sp.first_name, sp.last_name,
      s.id as session_id, s.date, s.start_time,
      c.id as class_id, c.title, c.instructor
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN student_profiles sp ON sp.user_id = u.id
    JOIN class_sessions s ON s.id = b.session_id
    JOIN classes c ON c.id = s.class_id
    WHERE 1=1
  `;
  const params = [];
  if (from) { query += ' AND s.date >= ?'; params.push(from); }
  if (to)   { query += ' AND s.date <= ?'; params.push(to); }
  query += ' ORDER BY s.date, s.start_time, sp.last_name';
  res.json(db.prepare(query).all(...params));
});

// Admin: cancel any booking
router.delete('/admin/:id', requireAdmin, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(booking.id);
  if (booking.status === 'confirmed') promoteWaitlist(booking.session_id);
  res.json({ message: 'Booking cancelled' });
});

function promoteWaitlist(sessionId) {
  const next = db.prepare("SELECT * FROM bookings WHERE session_id = ? AND status = 'waitlist' ORDER BY waitlist_position ASC LIMIT 1").get(sessionId);
  if (next) {
    db.prepare("UPDATE bookings SET status = 'confirmed', waitlist_position = NULL WHERE id = ?").run(next.id);
    db.prepare("UPDATE bookings SET waitlist_position = waitlist_position - 1 WHERE session_id = ? AND status = 'waitlist'").run(sessionId);
  }
}

module.exports = router;
