const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/mine', requireAuth, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.id, b.status, b.waitlist_position, b.booked_at,
      c.id as class_id, c.title, c.instructor, c.day_of_week, c.start_time, c.duration_mins, c.location
    FROM bookings b JOIN classes c ON c.id = b.class_id
    WHERE b.user_id = ? ORDER BY c.day_of_week, c.start_time
  `).all(req.user.id);
  res.json(bookings);
});

router.post('/', requireAuth, (req, res) => {
  const { class_id } = req.body;
  if (!class_id) return res.status(400).json({ error: 'class_id required' });
  const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND active = 1').get(class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const existing = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND class_id = ?').get(req.user.id, class_id);
  if (existing) return res.status(409).json({ error: 'Already booked', status: existing.status });

  const confirmedCount = db.prepare("SELECT COUNT(*) as n FROM bookings WHERE class_id = ? AND status = 'confirmed'").get(class_id).n;
  if (confirmedCount < cls.capacity) {
    db.prepare("INSERT INTO bookings (user_id, class_id, status) VALUES (?, ?, 'confirmed')").run(req.user.id, class_id);
    const booking = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND class_id = ?').get(req.user.id, class_id);
    return res.status(201).json({ ...booking, message: 'Booked successfully' });
  }

  const maxPos = db.prepare("SELECT MAX(waitlist_position) as m FROM bookings WHERE class_id = ? AND status = 'waitlist'").get(class_id).m || 0;
  db.prepare("INSERT INTO bookings (user_id, class_id, status, waitlist_position) VALUES (?, ?, 'waitlist', ?)").run(req.user.id, class_id, maxPos + 1);
  const booking = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND class_id = ?').get(req.user.id, class_id);
  res.status(201).json({ ...booking, message: `Added to waitlist at position ${maxPos + 1}` });
});

router.delete('/:id', requireAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(booking.id);
  if (booking.status === 'confirmed') promoteWaitlist(booking.class_id);
  res.json({ message: 'Booking cancelled' });
});

router.get('/', requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.id, b.status, b.waitlist_position, b.booked_at,
      u.id as user_id, u.email, sp.first_name, sp.last_name,
      c.id as class_id, c.title, c.day_of_week, c.start_time, c.instructor
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN student_profiles sp ON sp.user_id = u.id
    JOIN classes c ON c.id = b.class_id
    ORDER BY c.day_of_week, c.start_time, sp.last_name
  `).all();
  res.json(bookings);
});

router.delete('/admin/:id', requireAdmin, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(booking.id);
  if (booking.status === 'confirmed') promoteWaitlist(booking.class_id);
  res.json({ message: 'Booking cancelled' });
});

function promoteWaitlist(classId) {
  const next = db.prepare("SELECT * FROM bookings WHERE class_id = ? AND status = 'waitlist' ORDER BY waitlist_position ASC LIMIT 1").get(classId);
  if (next) {
    db.prepare("UPDATE bookings SET status = 'confirmed', waitlist_position = NULL WHERE id = ?").run(next.id);
    db.prepare("UPDATE bookings SET waitlist_position = waitlist_position - 1 WHERE class_id = ? AND status = 'waitlist'").run(classId);
  }
}

module.exports = router;
