import { query } from '../config/db';

export interface CreateJanazahDTO {
    tenant_id: string;
    deceased_name: string;
    prayer_time: string;
    location: string;
    created_by: string;
}

export const createJanazahAlert = async (data: CreateJanazahDTO) => {
    const sql = `
    INSERT INTO janazah_alerts (tenant_id, deceased_name, prayer_time, location, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
    const values = [
        data.tenant_id,
        data.deceased_name,
        data.prayer_time,
        data.location,
        data.created_by
    ];

    const { rows } = await query(sql, values);
    return rows[0];
};

export const getJanazahAlerts = async (tenantId: string) => {
    const sql = `SELECT * FROM janazah_alerts WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const { rows } = await query(sql, [tenantId]);
    return rows;
};
