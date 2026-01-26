const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'masjid_erp_secret_2025';

// Auth Middleware
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token failed' });
    }
};

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Masjid ERP API', timestamp: new Date() });
});

// Auth Routes
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, password, full_name, masjid_name } = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const userRes = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
            [email, hash]
        );
        const user = userRes.rows[0];

        await pool.query(
            'INSERT INTO profiles (id, full_name, masjid_name) VALUES ($1, $2, $3)',
            [user.id, full_name || 'Admin', masjid_name || 'My Masjid']
        );

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user, message: 'Registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

app.get('/api/v1/auth/me', protect, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT u.id, u.email, u.role, p.full_name, p.masjid_name, p.address, p.website 
      FROM users u 
      LEFT JOIN profiles p ON u.id = p.id 
      WHERE u.id = $1
    `, [req.user.id]);

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Donations Routes
app.get('/api/v1/donations', protect, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM donations ORDER BY date DESC LIMIT 50');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/v1/donations', protect, async (req, res) => {
    try {
        const { donor_name, amount, type, date } = req.body;
        const result = await pool.query(
            'INSERT INTO donations (donor_name, amount, type, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [donor_name, amount, type, date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Settings Routes
app.put('/api/v1/settings/profile', protect, async (req, res) => {
    try {
        const { masjid_name, address, website, full_name } = req.body;
        const result = await pool.query(
            `UPDATE profiles 
       SET masjid_name = COALESCE($1, masjid_name),
           address = COALESCE($2, address),
           website = COALESCE($3, website),
           full_name = COALESCE($4, full_name)
       WHERE id = $5 RETURNING *`,
            [masjid_name, address, website, full_name, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Prayer Times Routes
app.get('/api/v1/prayers', async (req, res) => {
    try {
        const { date } = req.query;
        const result = await pool.query(
            'SELECT * FROM prayer_times WHERE date = $1 ORDER BY date DESC LIMIT 7',
            [date || new Date().toISOString().split('T')[0]]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/v1/prayers', protect, async (req, res) => {
    try {
        const { date, fajr, dhuhr, asr, maghrib, isha, jumuah } = req.body;
        const result = await pool.query(
            `INSERT INTO prayer_times (date, fajr, dhuhr, asr, maghrib, isha, jumuah)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, date) DO UPDATE SET
         fajr = EXCLUDED.fajr, dhuhr = EXCLUDED.dhuhr, asr = EXCLUDED.asr,
         maghrib = EXCLUDED.maghrib, isha = EXCLUDED.isha, jumuah = EXCLUDED.jumuah
       RETURNING *`,
            [date, fajr, dhuhr, asr, maghrib, isha, jumuah]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Notices/Announcements Routes
app.get('/api/v1/notices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/v1/notices', protect, async (req, res) => {
    try {
        const { title, content, priority } = req.body;
        const result = await pool.query(
            'INSERT INTO announcements (title, content, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, priority || 'NORMAL', req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/v1/notices/:id', protect, async (req, res) => {
    try {
        await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Export for Vercel
module.exports = app;
