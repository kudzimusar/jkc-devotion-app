"use client";

import { supabase } from './supabase';
import { formatInTimeZone } from 'date-fns-tz';

// SOAP Journaling System for JKC Devotion App using Supabase

export interface SoapEntry {
    day_number: number;
    scripture: string;
    observation: string;
    application: string;
    prayer: string;
    updated_at: string | null;
}

export const SoapJournal = {
    // Get all SOAP entries for current user
    async getAllEntries(): Promise<SoapEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('soap_entries')
            .select('*')
            .order('day_number', { ascending: true });

        if (error) {
            console.error('Error fetching SOAP entries:', error);
            return [];
        }

        return data || [];
    },

    // Get SOAP entry for a specific day
    async getEntry(dayNumber: number): Promise<SoapEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return this.getDefaultEntry(dayNumber);

        const { data, error } = await supabase
            .from('soap_entries')
            .select('*')
            .eq('day_number', dayNumber)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching SOAP entry:', error);
        }

        return data || this.getDefaultEntry(dayNumber);
    },

    // Save SOAP entry for a specific day
    async saveEntry(dayNumber: number, entry: Partial<SoapEntry>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Authentication required');

        const entryToSave = {
            user_id: user.id,
            day_number: dayNumber,
            ...entry,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('soap_entries')
            .upsert(entryToSave, {
                onConflict: 'user_id,day_number'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete SOAP entry
    async deleteEntry(dayNumber: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('soap_entries')
            .delete()
            .eq('day_number', dayNumber);

        if (error) throw error;
    },

    // Calculate stats: completion total and current streak
    async getStats(): Promise<{ completed: number; total: number; streak: number; lastCompletedJST: string | null; completedDays: number[] }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { completed: 0, total: 90, streak: 0, lastCompletedJST: null, completedDays: [] };

        const { data, error } = await supabase
            .from('soap_entries')
            .select('day_number, updated_at')
            .order('day_number', { ascending: false });

        if (error || !data) return { completed: 0, total: 90, streak: 0, lastCompletedJST: null, completedDays: [] };

        const completed = data.length;
        const completedDays = data.map(d => d.day_number);
        let streak = 0;
        let lastCompletedJST = null;

        if (data.length > 0) {
            // Get current JST date in YYYY-MM-DD
            const currentJstDate = formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

            // Check if the most recent entry was completed today in JST
            if (data[0].updated_at) {
                const entryJstDate = formatInTimeZone(new Date(data[0].updated_at), 'Asia/Tokyo', 'yyyy-MM-dd');
                if (entryJstDate === currentJstDate) {
                    lastCompletedJST = entryJstDate;
                }
            }

            let current = completedDays[0];
            streak = 1;

            for (let i = 1; i < completedDays.length; i++) {
                if (completedDays[i] === current - 1) {
                    streak++;
                    current = completedDays[i];
                } else {
                    break;
                }
            }
        }

        return { completed, total: 90, streak, lastCompletedJST, completedDays };
    },

    getDefaultEntry(dayNumber: number): SoapEntry {
        return {
            day_number: dayNumber,
            scripture: '',
            observation: '',
            application: '',
            prayer: '',
            updated_at: null
        };
    }
};

export const SOAP_EXPLANATION = {
    S: {
        title: 'Scripture',
        description: 'Write down the Bible verse or passage you are studying.',
        prompt: 'What scripture speaks to you today?'
    },
    O: {
        title: 'Observation',
        description: 'Write what you observe in the scripture. What does it say? What do you notice?',
        prompt: 'What do you notice in this passage?'
    },
    A: {
        title: 'Application',
        description: 'Write how you will apply this scripture to your life today.',
        prompt: 'How will you apply this to your life?'
    },
    P: {
        title: 'Prayer',
        description: 'Write a prayer based on what you learned from the scripture.',
        prompt: 'What is your prayer response?'
    }
};
