"use client";

import { supabase } from './supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { basePath as BP } from './utils';

export interface User {
    id: string;
    email: string | undefined;
    name: string;
    avatar_url?: string;
    org_id?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

// Shared Promise cache — all components on the same page load share one
// network round-trip instead of each firing their own getSession + profiles query.
let _userPromise: Promise<User | null> | null = null;

export const Auth = {
    // Get current session
    async getCurrentUser(forceRefresh = false): Promise<User | null> {
        if (_userPromise && !forceRefresh) return _userPromise;

        _userPromise = (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return null;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                return {
                    id: session.user.id,
                    email: session.user.email,
                    name: profile?.name || session.user.user_metadata?.full_name || 'User',
                    avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                    org_id: profile?.org_id || session.user.user_metadata?.org_id
                };
            } catch {
                _userPromise = null; // reset on error so the next call retries
                return null;
            }
        })();

        return _userPromise;
    },

    // Create new account
    async createAccount(email: string, password: string, name: string, metadata: any = {}): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        ...metadata
                    },
                    emailRedirectTo: window.location.origin + BP + '/welcome/devotion'
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
        } catch (err) {
            const error = err as Error;
            // Check specifically for email not confirmed error from Supabase
            if (error.message.includes('Email not confirmed')) {
                return { success: false, error: 'Email not confirmed', user: { email } as User };
            }
            return { success: false, error: error.message };
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

            const user = await this.getCurrentUser(true); // force fresh fetch after login
            return { success: true, user: user || undefined };
        } catch (err) {
            const error = err as Error;
            if (error.message.includes('Email not confirmed')) {
                return { success: false, error: 'Email not confirmed', user: { email } as User };
            }
            return { success: false, error: error.message };
        }
    },

    // Resend Confirmation Email
    async resendConfirmation(email: string): Promise<AuthResponse> {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            const error = err as Error;
            return { success: false, error: error.message };
        }
    },

    // Social Login
    async signInWithGoogle() {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + BP + '/welcome/devotion'
            }
        });
    },

    async signInWithApple() {
        return await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: window.location.origin + BP + '/welcome/devotion'
            }
        });
    },

    // Logout
    async logout() {
        _userPromise = null; // clear in-memory cache
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });
            sessionStorage.clear();
        }
        window.location.replace(BP || '/'); // replace = no back-button return to stale session
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
        } catch (err) {
            const error = err as Error;
            return { success: false, error: error.message };
        }
    },
    // Delete account (Client-side cleanup)
    async deleteAccount(): Promise<AuthResponse> {
        _userPromise = null; // clear in-memory cache
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No user logged in' };

        try {
            const { error: profileErr } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileErr) throw profileErr;

            await supabase.auth.signOut();
            window.location.href = BP || '/';
            return { success: true };
        } catch (err) {
            const error = err as Error;
            return { success: false, error: error.message };
        }
    }
};
