import { supabase } from '../config/supabase';

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
    const { data: result, error } = await supabase
        .from('prayer_times')
        .upsert(data, { onConflict: 'tenant_id, date' })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return result;
};

export const getPrayerTimes = async (tenantId: string, date: string) => {
    const { data, error } = await supabase
        .from('prayer_times')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('date', date)
        .single();

    // If not found, return null or default
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
};
