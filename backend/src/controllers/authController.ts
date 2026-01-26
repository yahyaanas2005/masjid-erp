import { Request, Response } from 'express';
import { query } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, full_name, masjid_name } = req.body;

        // Check if user exists
        const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert User
        const userRes = await query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
            [email, hash]
        );
        const user = userRes.rows[0];

        // Create Profile
        await query(
            'INSERT INTO profiles (id, full_name, masjid_name) VALUES ($1, $2, $3)',
            [user.id, full_name || 'Admin', masjid_name || 'My Masjid']
        );

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user, message: 'Registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find User
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = result.rows[0];

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const result = await query(`
            SELECT u.id, u.email, u.role, p.full_name, p.masjid_name, p.address, p.website 
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.id 
            WHERE u.id = $1
        `, [userId]);

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
