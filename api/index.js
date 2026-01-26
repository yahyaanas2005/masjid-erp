const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        return res.end();
    }

    const { url, method, body } = req;
    const path = url.split('?')[0].replace('/api', '');
    const query = new URLSearchParams(url.split('?')[1] || '');

    try {
        // ==================== HEALTH CHECK ====================
        if (path === '/health' || path === '/') {
            res.writeHead(200, headers);
            return res.end(JSON.stringify({
                status: 'ok',
                service: 'Masjid ERP API',
                version: '1.0.0',
                endpoints: ['/auth', '/donations', '/prayers', '/notices', '/janazah', '/members', '/profile', '/public']
            }));
        }

        // ==================== AUTH ====================
        if (path === '/v1/auth/register' && method === 'POST') {
            const { email, password, full_name, masjid_name, role } = body;

            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                res.writeHead(400, headers);
                return res.end(JSON.stringify({ message: 'User already exists' }));
            }

            const hash = await bcrypt.hash(password, 10);
            const userRole = role || 'Admin'; // Owner, Admin, Member
            const userRes = await pool.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
                [email, hash, userRole]
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

        if (path === '/v1/auth/me' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, p.full_name, p.masjid_name, p.address, p.website, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = $1
      `, [user.id]);
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // ==================== PROFILE / SETTINGS ====================
        if (path === '/v1/profile' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [user.id]);
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows[0] || {}));
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
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // ==================== DONATIONS ====================
        if (path === '/v1/donations' && method === 'GET') {
            const result = await pool.query('SELECT * FROM donations ORDER BY date DESC LIMIT 100');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/donations' && method === 'POST') {
            const user = requireAuth(req);
            const { donor_name, amount, type, date, notes } = body;
            const result = await pool.query(
                'INSERT INTO donations (donor_name, amount, type, date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [donor_name || 'Anonymous', amount, type || 'Sadaqah', date || new Date(), 'Completed']
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        if (path.startsWith('/v1/donations/') && method === 'DELETE') {
            const user = requireAuth(req);
            const id = path.split('/').pop();
            await pool.query('DELETE FROM donations WHERE id = $1', [id]);
            res.writeHead(200, headers);
            return res.end(JSON.stringify({ message: 'Deleted' }));
        }

        // ==================== PRAYER TIMES ====================
        if (path === '/v1/prayers' && method === 'GET') {
            const result = await pool.query('SELECT * FROM prayer_times ORDER BY date DESC LIMIT 14');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/prayers' && method === 'POST') {
            const user = requireAuth(req);
            const { date, fajr, dhuhr, asr, maghrib, isha, jumuah, fajr_iqamah, dhuhr_iqamah, asr_iqamah, maghrib_iqamah, isha_iqamah } = body;

            // Upsert prayer times
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

        // ==================== NOTICES / ANNOUNCEMENTS ====================
        if (path === '/v1/notices' && method === 'GET') {
            const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/notices' && method === 'POST') {
            const user = requireAuth(req);
            const { title, content, priority } = body;
            const result = await pool.query(
                'INSERT INTO announcements (title, content, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, content, priority || 'NORMAL', user.id]
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        if (path.startsWith('/v1/notices/') && method === 'DELETE') {
            const user = requireAuth(req);
            const id = path.split('/').pop();
            await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
            res.writeHead(200, headers);
            return res.end(JSON.stringify({ message: 'Deleted' }));
        }

        // ==================== JANAZAH ALERTS ====================
        if (path === '/v1/janazah' && method === 'GET') {
            const result = await pool.query('SELECT * FROM janazah_alerts ORDER BY prayer_time DESC LIMIT 20');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/janazah' && method === 'POST') {
            const user = requireAuth(req);
            const { deceased_name, prayer_time, location, notes } = body;
            const result = await pool.query(
                'INSERT INTO janazah_alerts (deceased_name, prayer_time, location, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [deceased_name, prayer_time, location, user.id]
            );
            res.writeHead(201, headers);
            return res.end(JSON.stringify(result.rows[0]));
        }

        // ==================== MEMBERS ====================
        if (path === '/v1/members' && method === 'GET') {
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id
        ORDER BY u.created_at DESC LIMIT 100
      `);
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path.startsWith('/v1/members/') && path.endsWith('/role') && method === 'PUT') {
            const user = requireAuth(req);
            if (user.role !== 'Owner' && user.role !== 'Admin') {
                res.writeHead(403, headers);
                return res.end(JSON.stringify({ message: 'Forbidden: Admin only' }));
            }
            const memberId = path.split('/')[3];
            const { role } = body;
            await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, memberId]);
            res.writeHead(200, headers);
            return res.end(JSON.stringify({ message: 'Role updated' }));
        }

        // ==================== PUBLIC API (For Mobile Apps) ====================
        if (path === '/v1/public/prayers' && method === 'GET') {
            const result = await pool.query('SELECT date, fajr, dhuhr, asr, maghrib, isha, jumuah FROM prayer_times ORDER BY date DESC LIMIT 7');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/public/notices' && method === 'GET') {
            const result = await pool.query('SELECT id, title, content, priority, created_at FROM announcements WHERE priority != $1 ORDER BY created_at DESC LIMIT 10', ['INTERNAL']);
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/public/janazah' && method === 'GET') {
            const result = await pool.query('SELECT deceased_name, prayer_time, location FROM janazah_alerts WHERE prayer_time > NOW() ORDER BY prayer_time ASC LIMIT 5');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows));
        }

        if (path === '/v1/public/masjid' && method === 'GET') {
            // Return first masjid profile as public info
            const result = await pool.query('SELECT masjid_name, address, website, phone FROM profiles LIMIT 1');
            res.writeHead(200, headers);
            return res.end(JSON.stringify(result.rows[0] || { masjid_name: 'Masjid ERP', address: 'Not configured' }));
        }

        // ==================== STATS (Dashboard) ====================
        if (path === '/v1/stats' && method === 'GET') {
            const user = requireAuth(req);

            const donations = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE date > NOW() - INTERVAL \'30 days\'');
            const notices = await pool.query('SELECT COUNT(*) as count FROM announcements');
            const members = await pool.query('SELECT COUNT(*) as count FROM users');
            const janazah = await pool.query('SELECT COUNT(*) as count FROM janazah_alerts WHERE prayer_time > NOW()');

            res.writeHead(200, headers);
            return res.end(JSON.stringify({
                donations_month: donations.rows[0].total,
                active_notices: notices.rows[0].count,
                total_members: members.rows[0].count,
                upcoming_janazah: janazah.rows[0].count
            }));
        }

        // 404
        res.writeHead(404, headers);
        return res.end(JSON.stringify({ message: 'Route not found', path }));

    } catch (error) {
        console.error('API Error:', error);
        const status = error.message === 'Unauthorized' ? 401 : 500;
        res.writeHead(status, headers);
        return res.end(JSON.stringify({ message: error.message }));
    }
};
