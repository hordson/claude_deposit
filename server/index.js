const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db'); // initialize DB

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve web frontend in production
app.use(express.static(path.join(__dirname, '../web/dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../web/dist/index.html')));

app.listen(PORT, () => console.log(`Dance Studio API running on http://localhost:${PORT}`));
