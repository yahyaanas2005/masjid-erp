import { query } from '../config/db';

export interface CreateNoticeDTO {
    tenant_id: string;
    title: string;
    content: string;
    priority: 'NORMAL' | 'HIGH';
    created_by: string;
}

export const createNotice = async (data: CreateNoticeDTO) => {
    const sql = `
        INSERT INTO announcements (tenant_id, title, content, priority, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [data.tenant_id, data.title, data.content, data.priority, data.created_by];

    const { rows } = await query(sql, values);
    return rows[0];
};

export const getNotices = async (tenantId: string) => {
    const sql = `SELECT * FROM announcements WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const { rows } = await query(sql, [tenantId]);
    return rows;
};
