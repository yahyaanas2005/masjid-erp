import { supabase } from '../config/supabase';

export interface CreateNoticeDTO {
    tenant_id: string;
    title: string;
    content: string;
    priority: 'NORMAL' | 'HIGH';
    created_by: string;
}

export const createNotice = async (data: CreateNoticeDTO) => {
    const { data: notice, error } = await supabase
        .from('announcements')
        .insert([data])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return notice;
};

export const getNotices = async (tenantId: string) => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};
