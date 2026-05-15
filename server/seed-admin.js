/**
 * Run this once to create your admin account:
 *   node seed-admin.js
 *
 * Change the email/password below before running.
 */
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const ADMIN_EMAIL = 'blaire@yourshowdistrict.art';   // ← change this
const ADMIN_PASSWORD = 'Yourshow2023';         // ← change this

const db = new DatabaseSync(path.join(__dirname, 'studio.db'));
db.exec('PRAGMA foreign_keys = ON');

// Make sure tables exist
require('./db');

const existing = db.prepare('SELECT id FROM users WHERE email = ?').all(ADMIN_EMAIL)[0];
if (existing) {
  console.log('Admin already exists:', ADMIN_EMAIL);
  process.exit(0);
}

const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')").run(ADMIN_EMAIL, hash);
const user = db.prepare('SELECT id FROM users WHERE email = ?').all(ADMIN_EMAIL)[0];
db.prepare("INSERT INTO student_profiles (user_id, first_name, last_name) VALUES (?, 'Studio', 'Admin')").run(user.id);

console.log('✅ Admin account created!');
console.log('   Email:', ADMIN_EMAIL);
console.log('   Password:', ADMIN_PASSWORD);
console.log('\nLog in at http://localhost:5173/login');
