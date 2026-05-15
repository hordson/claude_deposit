/**
 * Seeds class definitions and their upcoming sessions
 * from your Yourshow Google Calendar data.
 * Run: node seed-classes.js
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'studio.db'));
db.exec('PRAGMA foreign_keys = ON');
require('./db');

// ── Class definitions ──────────────────────────────────────────────────────
const classDefs = [
  { title: 'Jazz Funk',        instructor: 'Tuan',   duration_mins: 75, capacity: 20 },
  { title: 'Choreo',           instructor: 'Sarah',  duration_mins: 75, capacity: 20 },
  { title: 'High Heel',        instructor: 'Sarah',  duration_mins: 75, capacity: 20 },
  { title: 'Teen',             instructor: '印印',   duration_mins: 90, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Sansan', duration_mins: 75, capacity: 20 },
  { title: 'Kpop Boyband',     instructor: 'Jovan',  duration_mins: 75, capacity: 20 },
  { title: 'Choreo',           instructor: 'Jovan',  duration_mins: 75, capacity: 20 },
  { title: 'Kpop / Jazz Funk', instructor: 'Jacki',  duration_mins: 75, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Jacki',  duration_mins: 75, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Jacki',  duration_mins: 75, capacity: 20 },
  { title: 'Hip-Hop',          instructor: 'Kevin',  duration_mins: 75, capacity: 20 },
  { title: 'Training',         instructor: 'Melle',  duration_mins: 75, capacity: 20 },
  { title: 'Kpop',             instructor: 'Isabel', duration_mins: 75, capacity: 20 },
  { title: 'Kids',             instructor: 'Blair',  duration_mins: 75, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Sarah',  duration_mins: 75, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Sarah',  duration_mins: 75, capacity: 20 },
  { title: 'K-Pop',            instructor: 'Blair',  duration_mins: 75, capacity: 20 },
  { title: 'Jazz Funk',        instructor: 'Jacki',  duration_mins: 75, capacity: 20 },
];

// Insert class definitions and collect their IDs
const insertDef = db.prepare('INSERT INTO classes (title, instructor, duration_mins, capacity) VALUES (?, ?, ?, ?)');
const ids = {};
for (const c of classDefs) {
  const key = `${c.title}||${c.instructor}`;
  if (!ids[key]) {
    insertDef.run(c.title, c.instructor, c.duration_mins, c.capacity);
    const row = db.prepare('SELECT id FROM classes ORDER BY id DESC LIMIT 1').all()[0];
    ids[key] = row.id;
  }
}

function id(title, instructor) { return ids[`${title}||${instructor}`]; }

// ── Sessions from your Google Calendar ────────────────────────────────────
// Pattern: each class repeats on the same day each week.
// Dates pulled from your Yourshow calendar (recurring events through to end of June 2026).

// Helper: given a start date (YYYY-MM-DD) and number of weekly repeats, generate dates
function weekly(startYMD, count = 8) {
  const dates = [];
  const [y, m, d] = startYMD.split('-').map(Number);
  let cur = new Date(y, m - 1, d);
  for (let i = 0; i < count; i++) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

const sessions = [
  // Thursday classes — starting May 15
  { class_id: id('Jazz Funk','Tuan'),    dates: weekly('2026-05-15'), start_time: '17:40' },
  { class_id: id('Choreo','Sarah'),      dates: weekly('2026-05-15'), start_time: '19:00' },
  { class_id: id('High Heel','Sarah'),   dates: weekly('2026-05-15'), start_time: '20:30' },
  // Friday classes — starting May 16
  { class_id: id('Teen','印印'),         dates: weekly('2026-05-16'), start_time: '13:00' },
  // Saturday classes — starting May 17
  { class_id: id('Jazz Funk','Sansan'),  dates: weekly('2026-05-17'), start_time: '16:00' },
  { class_id: id('Kpop Boyband','Jovan'),dates: weekly('2026-05-17'), start_time: '17:30' },
  { class_id: id('Choreo','Jovan'),      dates: weekly('2026-05-17'), start_time: '19:00' },
  // Sunday classes — starting May 18
  { class_id: id('Kpop / Jazz Funk','Jacki'), dates: weekly('2026-05-18'), start_time: '17:40' },
  { class_id: id('Jazz Funk','Jacki'),   dates: weekly('2026-05-18'), start_time: '19:00' },
  { class_id: id('Jazz Funk','Jacki'),   dates: weekly('2026-05-18'), start_time: '20:20' },
  // Monday classes — starting May 19
  { class_id: id('Hip-Hop','Kevin'),     dates: weekly('2026-05-19'), start_time: '17:40' },
  { class_id: id('Training','Melle'),    dates: weekly('2026-05-19'), start_time: '19:00' },
  { class_id: id('Kpop','Isabel'),       dates: weekly('2026-05-19'), start_time: '20:00' },
  // Tuesday classes — starting May 20
  { class_id: id('Kids','Blair'),        dates: weekly('2026-05-20'), start_time: '16:30' },
  { class_id: id('Jazz Funk','Sarah'),   dates: weekly('2026-05-20'), start_time: '19:10' },
  { class_id: id('Jazz Funk','Sarah'),   dates: weekly('2026-05-20'), start_time: '20:30' },
  // Wednesday classes — starting May 21
  { class_id: id('K-Pop','Blair'),       dates: weekly('2026-05-21'), start_time: '19:10' },
  { class_id: id('Jazz Funk','Jacki'),   dates: weekly('2026-05-21'), start_time: '20:30' },
];

const insertSession = db.prepare('INSERT INTO class_sessions (class_id, date, start_time) VALUES (?, ?, ?)');
let sessionCount = 0;
for (const s of sessions) {
  if (!s.class_id) { console.warn('Missing class ID for session', s); continue; }
  for (const date of s.dates) {
    insertSession.run(s.class_id, date, s.start_time);
    sessionCount++;
  }
}

console.log(`✅ ${Object.keys(ids).length} class types created`);
console.log(`✅ ${sessionCount} sessions scheduled (8 weeks each)`);
console.log('\nYou can now log in at http://localhost:5173 and see your full calendar!');
