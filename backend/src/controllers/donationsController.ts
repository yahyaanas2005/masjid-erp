import { Request, Response } from 'express';
import { query } from '../config/db';

export const getDonations = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM donations ORDER BY date DESC LIMIT 50');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createDonation = async (req: Request, res: Response) => {
    try {
        const { donor_name, amount, type, date } = req.body;
        // Mock tenant_id for now or grab from user
        const result = await query(
            'INSERT INTO donations (donor_name, amount, type, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [donor_name, amount, type, date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
