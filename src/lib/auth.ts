"use client";

import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
    id: string;
    email: string | undefined;
    name: string;
    avatar_url?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export const Auth = {
    // Get current session
    async getCurrentUser(): Promise<User | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        // Get profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        return {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.user_metadata?.full_name || 'User',
            avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url
        };
    },

    // Create new account
    async createAccount(email: string, password: string, name: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) throw error;
            if (!data.user) throw new Error('Signup failed');

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: name
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Login
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            const user = await this.getCurrentUser();
            return { success: true, user: user || undefined };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // Social Login
    async signInWithGoogle() {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    },

    async signInWithApple() {
        return await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: window.location.origin
            }
        });
    },

    // Logout
    async logout() {
        await supabase.auth.signOut();
    },

    // Update profile
    async updateProfile(updates: { name?: string; avatar_url?: string }): Promise<AuthResponse> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No user logged in' };

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            const updatedUser = await this.getCurrentUser();
            return { success: true, user: updatedUser || undefined };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
};
