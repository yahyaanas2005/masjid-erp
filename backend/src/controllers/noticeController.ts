import { Request, Response } from 'express';
import * as noticeService from '../services/noticeService';

export const create = async (req: Request, res: Response) => {
    try {
        const { tenant_id, title, content, priority, created_by } = req.body;

        const notice = await noticeService.createNotice({
            tenant_id, title, content, priority, created_by
        });

        res.status(201).json({ message: 'Notice created', data: notice });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const list = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

        const notices = await noticeService.getNotices(String(tenantId));
        res.json({ data: notices });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
