const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'masjid_erp_secret_2025';

// CORS Headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Auth middleware helper
const verifyToken = (authHeader) => {
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        return res.end();
    }

    const { url, method, body } = req;
    const path = url.replace('/api', '');

    try {
        // Health check
        if (path === '/health' || path === '/') {
            res.writeHead(200, headers);
            return res.end(JSON.stringify({ status: 'ok', service: 'Masjid ERP API' }));
        }

        // AUTH: Register
        if (path === '/v1/auth/register' && method === 'POST') {
            const { email, password, full_name, masjid_name } = body;

            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                res.writeHead(400, headers);
                return res.end(JSON.stringify({ message: 'User already exists' }));
            }

            const hash = await bcrypt.hash(password, 10);
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

            res.writeHead(201, headers);
            return res.end(JSON.stringify({ token, user, message: 'Registered!' }));
        }

        // AUTH: Login
        if (path === '/v1/auth/login' && method === 'POST') {
            const { email, password } = body;

            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                res.writeHead(400, headers);
                return res.end(JSON.stringify({ message: 'Invalid credentials' }));
            }

            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                res.writeHead(400, headers);
                return res.end(JSON.stringify({ message: 'Invalid credentials' }));
            }

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

            res.writeHead(200, headers);
            return res.end(JSON.stringify({ token, user: { id: user.id, email: user.email, role: user.role } }));
        }

        // DONATIONS: List
        if (path === '/v1/donations' && method === 'GET') {
            const result = await pool.query('SELECT * FROM donations ORDER BY date DESC LIMIT 50');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        // DONATIONS: Create
        if (path === '/v1/donations' && method === 'POST') {
            const { donor_name, amount, type, date } = body;
            const result = await pool.query(
                'INSERT INTO donations (donor_name, amount, type, date) VALUES ($1, $2, $3, $4) RETURNING *',
                [donor_name, amount, type, date || new Date()]
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // PRAYERS: List
        if (path === '/v1/prayers' && method === 'GET') {
            const result = await pool.query('SELECT * FROM prayer_times ORDER BY date DESC LIMIT 7');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        // PRAYERS: Create/Update
        if (path === '/v1/prayers' && method === 'POST') {
            const { date, fajr, dhuhr, asr, maghrib, isha, jumuah } = body;
            const result = await pool.query(
                `INSERT INTO prayer_times (date, fajr, dhuhr, asr, maghrib, isha, jumuah)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, date) DO UPDATE SET
           fajr = EXCLUDED.fajr, dhuhr = EXCLUDED.dhuhr, asr = EXCLUDED.asr,
           maghrib = EXCLUDED.maghrib, isha = EXCLUDED.isha, jumuah = EXCLUDED.jumuah
         RETURNING *`,
                [date, fajr, dhuhr, asr, maghrib, isha, jumuah]
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // NOTICES: List
        if (path === '/v1/notices' && method === 'GET') {
            const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        // NOTICES: Create
        if (path === '/v1/notices' && method === 'POST') {
            const user = verifyToken(req.headers.authorization);
            const { title, content, priority } = body;
            const result = await pool.query(
                'INSERT INTO announcements (title, content, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, content, priority || 'NORMAL', user?.id]
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // 404 for unmatched routes
        res.writeHead(404, headers);
        return res.end(JSON.stringify({ message: 'Route not found', path }));

    } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, headers);
        return res.end(JSON.stringify({ message: 'Server error: ' + error.message }));
    }
};
