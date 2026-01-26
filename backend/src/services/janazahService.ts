import { supabase } from '../config/supabase';

export interface CreateJanazahDTO {
    tenant_id: string;
    deceased_name: string;
    prayer_time: string;
    location: string;
    created_by: string;
}

export const createJanazahAlert = async (data: CreateJanazahDTO) => {
    const { data: alert, error } = await supabase
        .from('janazah_alerts')
        .insert([data])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return alert;
};

export const getJanazahAlerts = async (tenantId: string) => {
    const { data, error } = await supabase
        .from('janazah_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};
