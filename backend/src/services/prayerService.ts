import { query } from '../config/db';

export interface PrayerTimeDTO {
    tenant_id: string;
    date: string; // YYYY-MM-DD
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jumuah?: string;
}

export const updatePrayerTimes = async (data: PrayerTimeDTO) => {
    // Upsert logic for Postgres
    const sql = `
        INSERT INTO prayer_times (tenant_id, date, fajr, dhuhr, asr, maghrib, isha, jumuah)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, date) 
        DO UPDATE SET 
            fajr = EXCLUDED.fajr,
            dhuhr = EXCLUDED.dhuhr,
            asr = EXCLUDED.asr,
            maghrib = EXCLUDED.maghrib,
            isha = EXCLUDED.isha,
            jumuah = EXCLUDED.jumuah
        RETURNING *;
    `;
    const values = [
        data.tenant_id, data.date, data.fajr, data.dhuhr,
        data.asr, data.maghrib, data.isha, data.jumuah || null
    ];

    const { rows } = await query(sql, values);
    return rows[0];
};

export const getPrayerTimes = async (tenantId: string, date: string) => {
    const sql = `SELECT * FROM prayer_times WHERE tenant_id = $1 AND date = $2`;
    const { rows } = await query(sql, [tenantId, date]);
    return rows[0] || null;
};
