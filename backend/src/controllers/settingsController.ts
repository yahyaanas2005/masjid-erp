import { Request, Response } from 'express';
import { query } from '../config/db';

export const updateProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { masjid_name, address, website, full_name } = req.body;

        const result = await query(
            `UPDATE profiles 
             SET masjid_name = COALESCE($1, masjid_name),
                 address = COALESCE($2, address),
                 website = COALESCE($3, website),
                 full_name = COALESCE($4, full_name)
             WHERE id = $5 RETURNING *`,
            [masjid_name, address, website, full_name, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
