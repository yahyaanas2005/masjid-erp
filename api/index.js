const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const JWT_SECRET = process.env.JWT_SECRET || 'masjid_erp_secret_2025';

// ROLES & PERMISSIONS
const ROLES = {
    CHAIRMAN: 'Chairman',
    GENERAL_SECRETARY: 'General Secretary',
    TREASURER: 'Treasurer',
    ADMIN: 'Admin',
    COMMITTEE_MEMBER: 'Committee Member',
    NAMAZI: 'Namazi'
};

const PERMISSIONS = {
    [ROLES.CHAIRMAN]: ['all'],
    [ROLES.GENERAL_SECRETARY]: ['manage_notices', 'manage_members', 'view_donations', 'manage_prayers'],
    [ROLES.TREASURER]: ['manage_donations', 'view_notices', 'view_members'],
    [ROLES.ADMIN]: ['manage_notices', 'manage_prayers', 'manage_donations', 'view_members'],
    [ROLES.COMMITTEE_MEMBER]: ['view_notices', 'view_prayers', 'view_donations'],
    [ROLES.NAMAZI]: ['view_notices', 'view_prayers']
};

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

const verifyToken = (authHeader) => {
    if (!authHeader) return null;
    try { return jwt.verify(authHeader.split(' ')[1], JWT_SECRET); }
    catch { return null; }
};

const requireAuth = (req) => {
    const user = verifyToken(req.headers.authorization);
    if (!user) throw new Error('Unauthorized');
    return user;
};

const hasPermission = (role, permission) => {
    const perms = PERMISSIONS[role] || [];
    return perms.includes('all') || perms.includes(permission);
};

const send = (res, status, data) => { res.writeHead(status, headers); res.end(JSON.stringify(data)); };
const err = (res, status, msg) => { res.writeHead(status, headers); res.end(JSON.stringify({ message: msg, error: true })); };

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

    const { url, method, body } = req;
    const path = url.split('?')[0].replace('/api', '');

    try {
        // HEALTH
        if (path === '/health' || path === '/') {
            return send(res, 200, { status: 'ok', roles: Object.values(ROLES), version: '3.0.0' });
        }

        // ROLES LIST
        if (path === '/v1/roles' && method === 'GET') {
            return send(res, 200, { roles: Object.values(ROLES), permissions: PERMISSIONS });
        }

        // AUTH: REGISTER
        if (path === '/v1/auth/register' && method === 'POST') {
            const { email, password, full_name, masjid_name, role } = body;
            if (!email || !password) return err(res, 400, 'Email and password required');

            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) return err(res, 400, 'User exists');

            const hash = await bcrypt.hash(password, 10);
            const userRole = role || ROLES.NAMAZI; // Default: Namazi

            const userRes = await pool.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
                [email, hash, userRole]
            );
            const user = userRes.rows[0];

            await pool.query(
                'INSERT INTO profiles (id, full_name, masjid_name) VALUES ($1, $2, $3)',
                [user.id, full_name || 'User', masjid_name || 'My Masjid']
            );

            const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
            return send(res, 201, { token, user, permissions: PERMISSIONS[user.role] });
        }

        // AUTH: LOGIN
        if (path === '/v1/auth/login' && method === 'POST') {
            const { email, password } = body;
            if (!email || !password) return err(res, 400, 'Email and password required');

            const result = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) return err(res, 400, 'Invalid credentials');

            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return err(res, 400, 'Invalid credentials');

            const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
            return send(res, 200, { token, user: { id: user.id, email: user.email, role: user.role }, permissions: PERMISSIONS[user.role] });
        }

        // AUTH: ME
        if (path === '/v1/auth/me' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.masjid_name, p.address, p.website, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = $1
      `, [user.id]);
            const data = result.rows[0] || {};
            return send(res, 200, { ...data, permissions: PERMISSIONS[data.role] || [] });
        }

        // MEMBERS (Committee roles only)
        if (path === '/v1/members' && method === 'GET') {
            const user = requireAuth(req);
            if (!hasPermission(user.role, 'view_members') && !hasPermission(user.role, 'manage_members')) {
                return err(res, 403, 'No permission to view members');
            }
            const result = await pool.query(`
        SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.phone
        FROM users u LEFT JOIN profiles p ON u.id = p.id ORDER BY u.created_at DESC
      `);
            return send(res, 200, result.rows);
        }

        // UPDATE MEMBER ROLE (Chairman/Secretary only)
        if (path.match(/\/v1\/members\/[^/]+\/role/) && method === 'PUT') {
            const user = requireAuth(req);
            if (user.role !== ROLES.CHAIRMAN && user.role !== ROLES.GENERAL_SECRETARY) {
                return err(res, 403, 'Only Chairman or Secretary can change roles');
            }
            const memberId = path.split('/')[3];
            const { role } = body;
            if (!Object.values(ROLES).includes(role)) return err(res, 400, 'Invalid role');

            await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, memberId]);
            return send(res, 200, { message: 'Role updated' });
        }

        // PROFILE
        if (path === '/v1/profile' && method === 'GET') {
            const user = requireAuth(req);
            const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [user.id]);
            return send(res, 200, result.rows[0] || {});
        }

        if (path === '/v1/profile' && method === 'PUT') {
            const user = requireAuth(req);
            const { masjid_name, address, website, full_name, phone } = body;
            const result = await pool.query(
                `UPDATE profiles SET masjid_name=COALESCE($1,masjid_name), address=COALESCE($2,address), 
         website=COALESCE($3,website), full_name=COALESCE($4,full_name), phone=COALESCE($5,phone) 
         WHERE id=$6 RETURNING *`,
                [masjid_name, address, website, full_name, phone, user.id]
            );
            return send(res, 200, result.rows[0] || {});
        }

        // DONATIONS (Permission-based)
        if (path === '/v1/donations' && method === 'GET') {
            const user = requireAuth(req);
            if (!hasPermission(user.role, 'view_donations') && !hasPermission(user.role, 'manage_donations')) {
                return err(res, 403, 'No permission');
            }
            const result = await pool.query('SELECT * FROM donations ORDER BY date DESC LIMIT 100');
            return send(res, 200, result.rows);
        }

        if (path === '/v1/donations' && method === 'POST') {
            const user = requireAuth(req);
            if (!hasPermission(user.role, 'manage_donations')) return err(res, 403, 'No permission');
            const { donor_name, amount, type, date } = body;
            const result = await pool.query(
                'INSERT INTO donations (donor_name, amount, type, date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [donor_name || 'Anonymous', amount, type || 'Sadaqah', date || new Date().toISOString().split('T')[0], 'Completed']
            );
            return send(res, 201, result.rows[0]);
        }

        // PRAYERS
        if (path === '/v1/prayers' && method === 'GET') {
            const result = await pool.query('SELECT * FROM prayer_times ORDER BY date DESC LIMIT 14');
            return send(res, 200, result.rows);
        }

        if (path === '/v1/prayers' && method === 'POST') {
            const user = requireAuth(req);
            if (!hasPermission(user.role, 'manage_prayers')) return err(res, 403, 'No permission');
            const { date, fajr, dhuhr, asr, maghrib, isha, jumuah } = body;
            const result = await pool.query(
                `INSERT INTO prayer_times (date, fajr, dhuhr, asr, maghrib, isha, jumuah)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tenant_id, date) DO UPDATE SET
         fajr=EXCLUDED.fajr, dhuhr=EXCLUDED.dhuhr, asr=EXCLUDED.asr, maghrib=EXCLUDED.maghrib, isha=EXCLUDED.isha, jumuah=EXCLUDED.jumuah
         RETURNING *`, [date, fajr, dhuhr, asr, maghrib, isha, jumuah]
            );
            return send(res, 201, result.rows[0]);
        }

        // NOTICES
        if (path === '/v1/notices' && method === 'GET') {
            const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
            return send(res, 200, result.rows);
        }

        if (path === '/v1/notices' && method === 'POST') {
            const user = requireAuth(req);
            if (!hasPermission(user.role, 'manage_notices')) return err(res, 403, 'No permission to post');
            const { title, content, priority } = body;
            const result = await pool.query(
                'INSERT INTO announcements (title, content, priority, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, content, priority || 'NORMAL', user.id]
            );
            return send(res, 201, result.rows[0]);
        }

        // STATS
        if (path === '/v1/stats' && method === 'GET') {
            const user = requireAuth(req);
            const donations = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE date > CURRENT_DATE - INTERVAL \'30 days\'');
            const notices = await pool.query('SELECT COUNT(*) as count FROM announcements');
            const members = await pool.query('SELECT COUNT(*) as count FROM users');
            const janazah = await pool.query('SELECT COUNT(*) as count FROM janazah_alerts WHERE prayer_time > NOW()');

            return send(res, 200, {
                donations_month: parseFloat(donations.rows[0].total) || 0,
                active_notices: parseInt(notices.rows[0].count) || 0,
                total_members: parseInt(members.rows[0].count) || 0,
                upcoming_janazah: parseInt(janazah.rows[0].count) || 0,
                user_role: user.role,
                permissions: PERMISSIONS[user.role] || []
            });
        }

        // PUBLIC API
        if (path === '/v1/public/prayers') { const r = await pool.query('SELECT * FROM prayer_times ORDER BY date DESC LIMIT 7'); return send(res, 200, r.rows); }
        if (path === '/v1/public/notices') { const r = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10'); return send(res, 200, r.rows); }

        return err(res, 404, `Route not found: ${path}`);
    } catch (error) {
        console.error('API Error:', error);
        return err(res, error.message === 'Unauthorized' ? 401 : 500, error.message);
    }
};
