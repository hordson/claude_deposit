# Dance Studio App

A full-stack dance studio management app with:
- **Student portal** — browse classes, book, manage bookings, view waitlist status
- **Admin dashboard** — manage students, classes, view all bookings & rosters
- **Mobile app** — React Native / Expo (iOS App Store ready)

---

## Project Structure

```
dance-studio/
├── server/     ← Node.js backend API (runs on port 4000)
├── web/        ← React web app (admin + student, runs on port 5173)
└── mobile/     ← React Native / Expo mobile app
```

---

## How to Run (Step by Step)

### Step 1 — Install dependencies

```bash
cd server && npm install
cd ../web && npm install
cd ../mobile && npm install
```

### Step 2 — Create your admin account

Open `server/seed-admin.js`, change the email and password, then run:
```bash
cd server
node seed-admin.js
```

### Step 3 — Start the backend

```bash
cd server
npm start
# → Dance Studio API running on http://localhost:4000
```

### Step 4 — Start the web app

In a new terminal:
```bash
cd web
npm run dev
# → Open http://localhost:5173
```

### Step 5 — Run the mobile app

```bash
cd mobile
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## Publishing the Mobile App to the App Store

1. Create an Apple Developer account at developer.apple.com ($99/year)
2. `npm install -g eas-cli`
3. `cd mobile && eas build --platform ios`
4. `eas submit --platform ios`

---

## Tech Stack

| Part | Technology |
|---|---|
| Backend | Node.js + Express + SQLite (built-in Node 22+) |
| Web | React + Vite + Tailwind CSS |
| Mobile | React Native + Expo |
| Auth | JWT tokens + bcrypt password hashing |
