const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database connection with error handling
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err.message));

const JWT_SECRET = process.env.JWT_SECRET || 'masjid_erp_secret_2025';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

const verifyToken = (authHeader) => {
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

const requireAuth = (req) => {
    const user = verifyToken(req.headers.authorization);
    if (!user) throw new Error('Unauthorized');
    return user;
};

const sendResponse = (res, status, data) => {
    res.writeHead(status, headers);
    res.end(JSON.stringify(data));
};

const sendError = (res, status, message) => {
    res.writeHead(status, headers);
    res.end(JSON.stringify({ message, error: true }));
};

module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return sendResponse(res, 200, { ok: true });
    }

    const { url, method, body } = req;
    const path = url.split('?')[0].replace('/api', '');
    const query = new URLSearchParams(url.split('?')[1] || '');

    try {
        // ==================== HEALTH CHECK ====================
        if (path === '/health' || path === '/') {
            return sendResponse(res, 200, {
                status: 'ok',
                service: 'Masjid ERP API',
                version: '2.0.0',
                timestamp: new Date().toISOString()
            });
        }

        // ==================== DEBUG: Check Database ====================
        if (path === '/v1/debug/tables') {
            const result = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
            return sendResponse(res, 200, { tables: result.rows.map(r => r.table_name) });
        }

        // ==================== AUTH: REGISTER ====================
        if (path === '/v1/auth/register' && method === 'POST') {
            const { email, password, full_name, masjid_name, role } = body;

            if (!email || !password) {
                return sendError(res, 400, 'Email and password are required');
            }

            // Check if user exists
            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return sendError(res, 400, 'User already exists');
            }

            // Hash password
            const hash = await bcrypt.hash(password, 10);
            const userRole = role || 'Admin';

            // Insert user
            const userRes = await pool.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
                [email, hash, userRole]
            );
            const user = userRes.rows[0];

            // Insert profile
            await pool.query(
                'INSERT INTO profiles (id, full_name, masjid_name) VALUES ($1, $2, $3)',
                [user.id, full_name || 'Admin User', masjid_name || 'My Masjid']
            );

            // Generate token
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

            return sendResponse(res, 201, {
                token,
                user: { id: user.id, email: user.email, role: user.role },
                message: 'Registration successful!'
            });
        }

        // ==================== AUTH: LOGIN ====================
        if (path === '/v1/auth/login' && method === 'POST') {
            const { email, password } = body;

            if (!email || !password) {
                return sendError(res, 400, 'Email and password are required');
            }

            // Find user
            const result = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return sendError(res, 400, 'Invalid credentials');
            }

            const user = result.rows[0];

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return sendError(res, 400, 'Invalid credentials');
            }

            // Generate token
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

            return sendResponse(res, 200, {
                token,
                user: { id: user.id, email: user.email, role: user.role }
            });
        }

        // ==================== AUTH: ME ====================
        if (path === '/v1/auth/me' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, p.full_name, p.masjid_name, p.address, p.website, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = $1
      `, [user.id]);
            return sendResponse(res, 200, result.rows[0] || {});
        }

        // ==================== PROFILE ====================
        if (path === '/v1/profile' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [user.id]);
            return sendResponse(res, 200, result.rows[0] || {});
        }

        if (path === '/v1/profile' && method === 'PUT') {
            const user = requireAuth(req);
            const { masjid_name, address, website, full_name, phone } = body;
            const result = await pool.query(
                `UPDATE profiles SET 
          masjid_name = COALESCE($1, masjid_name),
          address = COALESCE($2, address),
          website = COALESCE($3, website),
          full_name = COALESCE($4, full_name),
          phone = COALESCE($5, phone)
         WHERE id = $6 RETURNING *`,
                [masjid_name, address, website, full_name, phone, user.id]
            );
            return sendResponse(res, 200, result.rows[0] || {});
        }

        // ==================== DONATIONS ====================
        if (path === '/v1/donations' && method === 'GET') {
            const result = await pool.query('SELECT * FROM donations ORDER BY date DESC LIMIT 100');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/donations' && method === 'POST') {
            requireAuth(req);
            const { donor_name, amount, type, date } = body;
            if (!amount) return sendError(res, 400, 'Amount is required');

            const result = await pool.query(
                'INSERT INTO donations (donor_name, amount, type, date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [donor_name || 'Anonymous', amount, type || 'Sadaqah', date || new Date().toISOString().split('T')[0], 'Completed']
            );
            return sendResponse(res, 201, result.rows[0]);
        }

        if (path.startsWith('/v1/donations/') && method === 'DELETE') {
            requireAuth(req);
            const id = path.split('/').pop();
            await pool.query('DELETE FROM donations WHERE id = $1', [id]);
            return sendResponse(res, 200, { message: 'Deleted' });
        }

        // ==================== PRAYER TIMES ====================
        if (path === '/v1/prayers' && method === 'GET') {
            const result = await pool.query('SELECT * FROM prayer_times ORDER BY date DESC LIMIT 14');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/prayers' && method === 'POST') {
            requireAuth(req);
            const { date, fajr, dhuhr, asr, maghrib, isha, jumuah } = body;
            if (!date) return sendError(res, 400, 'Date is required');

            const result = await pool.query(
                `INSERT INTO prayer_times (date, fajr, dhuhr, asr, maghrib, isha, jumuah)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, date) DO UPDATE SET
           fajr = EXCLUDED.fajr, dhuhr = EXCLUDED.dhuhr, asr = EXCLUDED.asr,
           maghrib = EXCLUDED.maghrib, isha = EXCLUDED.isha, jumuah = EXCLUDED.jumuah
         RETURNING *`,
                [date, fajr, dhuhr, asr, maghrib, isha, jumuah]
            );
            return sendResponse(res, 201, result.rows[0]);
        }

        // ==================== NOTICES ====================
        if (path === '/v1/notices' && method === 'GET') {
            const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/notices' && method === 'POST') {
            const user = requireAuth(req);
            const { title, content, priority } = body;
            if (!title) return sendError(res, 400, 'Title is required');

            const result = await pool.query(
                'INSERT INTO announcements (title, content, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, content, priority || 'NORMAL', user.id]
            );
            return sendResponse(res, 201, result.rows[0]);
        }

        if (path.startsWith('/v1/notices/') && method === 'DELETE') {
            requireAuth(req);
            const id = path.split('/').pop();
            await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
            return sendResponse(res, 200, { message: 'Deleted' });
        }

        // ==================== JANAZAH ====================
        if (path === '/v1/janazah' && method === 'GET') {
            const result = await pool.query('SELECT * FROM janazah_alerts ORDER BY prayer_time DESC LIMIT 20');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/janazah' && method === 'POST') {
            const user = requireAuth(req);
            const { deceased_name, prayer_time, location } = body;
            if (!deceased_name) return sendError(res, 400, 'Deceased name is required');

            const result = await pool.query(
                'INSERT INTO janazah_alerts (deceased_name, prayer_time, location, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [deceased_name, prayer_time, location, user.id]
            );
            return sendResponse(res, 201, result.rows[0]);
        }

        // ==================== MEMBERS ====================
        if (path === '/v1/members' && method === 'GET') {
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id
        ORDER BY u.created_at DESC LIMIT 100
      `);
            return sendResponse(res, 200, result.rows);
        }

        // ==================== STATS ====================
        if (path === '/v1/stats' && method === 'GET') {
            requireAuth(req);

            const donations = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE date > CURRENT_DATE - INTERVAL \'30 days\'');
            const notices = await pool.query('SELECT COUNT(*) as count FROM announcements');
            const members = await pool.query('SELECT COUNT(*) as count FROM users');
            const janazah = await pool.query('SELECT COUNT(*) as count FROM janazah_alerts WHERE prayer_time > NOW()');

            return sendResponse(res, 200, {
                donations_month: parseFloat(donations.rows[0].total) || 0,
                active_notices: parseInt(notices.rows[0].count) || 0,
                total_members: parseInt(members.rows[0].count) || 0,
                upcoming_janazah: parseInt(janazah.rows[0].count) || 0
            });
        }

        // ==================== PUBLIC API ====================
        if (path === '/v1/public/prayers' && method === 'GET') {
            const result = await pool.query('SELECT date, fajr, dhuhr, asr, maghrib, isha, jumuah FROM prayer_times ORDER BY date DESC LIMIT 7');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/public/notices' && method === 'GET') {
            const result = await pool.query('SELECT id, title, content, priority, created_at FROM announcements ORDER BY created_at DESC LIMIT 10');
            return sendResponse(res, 200, result.rows);
        }

        if (path === '/v1/public/masjid' && method === 'GET') {
            const result = await pool.query('SELECT masjid_name, address, website, phone FROM profiles LIMIT 1');
            return sendResponse(res, 200, result.rows[0] || { masjid_name: 'Masjid ERP', address: 'Not configured' });
        }

        // ==================== 404 ====================
        return sendError(res, 404, `Route not found: ${path}`);

    } catch (error) {
        console.error('API Error:', error);
        const status = error.message === 'Unauthorized' ? 401 : 500;
        return sendError(res, status, error.message);
    }
};
