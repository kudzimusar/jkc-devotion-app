import { supabase } from './supabase';
import localDevotions from '@/data/devotions.json';

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
    try {
        const { data, error } = await supabase
            .from('devotions')
            .select('*')
            .eq('date', dateStr)
            .single();

        if (!error && data) {
            return data;
        }
    } catch (e) {
        console.warn("Supabase fetch failed, falling back to local data:", e);
    }

    // Fallback to local JSON
    const devotionsArray = Array.isArray(localDevotions) 
        ? localDevotions 
        : (localDevotions as any).default || [];
        
    const local = (devotionsArray as Devotion[]).find(d => d.date === dateStr);
    
    if (!local) {
        console.warn(`Devotion not found for date: ${dateStr} in either Supabase or local data.`);
    }
    
    return local || null;
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
