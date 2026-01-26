import { Request, Response } from 'express';
import * as janazahService from '../services/janazahService';

export const createAlert = async (req: Request, res: Response) => {
    try {
        const { tenant_id, deceased_name, prayer_time, location, created_by } = req.body;

        // Basic validation
        if (!tenant_id || !deceased_name || !prayer_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const alert = await janazahService.createJanazahAlert({
            tenant_id,
            deceased_name,
            prayer_time,
            location,
            created_by
        });

        res.status(201).json({ message: 'Janazah alert created', data: alert });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAlerts = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

        const alerts = await janazahService.getJanazahAlerts(String(tenantId));
        res.json({ data: alerts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
