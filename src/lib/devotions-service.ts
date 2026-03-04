import { supabase } from './supabase';

export type Devotion = {
    id: number;
    date: string;
    week: number;
    theme: string;
    title: string;
    scripture: string;
    declaration: string;
    week_theme: string;
};

export async function getDevotionForDate(dateStr: string): Promise<Devotion | null> {
    const { data, error } = await supabase
        .from('devotions')
        .select('*')
        .eq('date', dateStr)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows found
            return null;
        }
        console.error("Error fetching devotion from Supabase:", error);
        throw error;
    }

    return data;
}

export async function getAllDevotions(): Promise<Devotion[]> {
    const { data, error } = await supabase
        .from('devotions')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching all devotions from Supabase:", error);
        throw error;
    }

    return data || [];
}

export function getWeekForDate(dateStr: string): number {
    const d = new Date(dateStr);
    const day = d.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
}
