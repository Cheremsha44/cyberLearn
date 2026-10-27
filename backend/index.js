const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./src/config/db');
const { ensureFreezeSchema, ensureAuthSchema } = require('./src/config/ensureSchema');

// ===== ROUTES =====
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const adminRoutes = require('./src/routes/admin');
const exercisesRoutes = require('./src/routes/exercises');
const labRoutes = require('./src/routes/lab');
const vulnerabilitiesRoutes = require('./src/routes/vulnerabilities');
const progressRoutes = require('./src/routes/progress');
const uploadRoutes = require('./src/routes/upload');
const exerciseProgressRoutes = require('./src/routes/exerciseProgressRoutes');
const activityRoutes = require('./src/routes/activity');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== STATIC =====
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/vulnerabilities', vulnerabilitiesRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/lab', labRoutes);

app.use('/api/progress', progressRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', exerciseProgressRoutes);
app.use('/api/activity', activityRoutes);

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'OK', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: 'not connected' });
  }
});

// ===== START SERVER =====
async function startServer() {
  try {
    await ensureFreezeSchema();
    await ensureAuthSchema();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server schema:', err);
    process.exit(1);
  }
}

startServer();
