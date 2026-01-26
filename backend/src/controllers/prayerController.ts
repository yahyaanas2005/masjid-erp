import { Request, Response } from 'express';
import * as prayerService from '../services/prayerService';

export const updateTimes = async (req: Request, res: Response) => {
    try {
        const { tenant_id, date, fajr, dhuhr, asr, maghrib, isha } = req.body;

        if (!tenant_id || !date) {
            return res.status(400).json({ error: 'Tenant ID and Date are required' });
        }

        const result = await prayerService.updatePrayerTimes({
            tenant_id, date, fajr, dhuhr, asr, maghrib, isha
        });

        res.json({ message: 'Prayer times updated', data: result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTimes = async (req: Request, res: Response) => {
    try {
        const { tenantId, date } = req.query;
        if (!tenantId || !date) {
            return res.status(400).json({ error: 'Tenant ID and Date required' });
        }

        const times = await prayerService.getPrayerTimes(String(tenantId), String(date));
        res.json({ data: times });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
