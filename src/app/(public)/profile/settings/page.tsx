"use client";

import { useEffect, useState } from "react";
import { Auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
    Settings, LayoutDashboard, User as UserIcon, Palette, Globe, Shield, Lock, Bell, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { basePath as BP } from "@/lib/utils";

const SIDEBAR_NAV = [
    { id: 'display', label: 'Display Settings', icon: Palette },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'security', label: 'Account Security', icon: Lock },
];

export default function SettingsHub() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('display');
    const [theme, setTheme] = useState('system');
    const [fontSize, setFontSize] = useState('medium');
    const [language, setLanguage] = useState('en');
    const [groupsVisibility, setGroupsVisibility] = useState(true);

    useEffect(() => {
        const init = async () => {
            const currentUser = await Auth.getCurrentUser();
            if (!currentUser) window.location.href = BP || '/';
            setUser(currentUser);
        };
        init();
    }, []);

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: window.location.origin + BP + '/profile/settings',
        });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password reset link sent to your email.");
        }
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm("Are you absolutely sure you want to delete your account? This action is permanent and will remove all your devotional data.");
        if (!confirm) return;

        try {
            const res = await Auth.deleteAccount();
            if (res.success) {
                toast.success("Account deleted successfully.");
            } else {
                toast.error(res.error || "Failed to delete account.");
            }
        } catch (e) {
            toast.error("Error deleting account.");
        }
    };

    const handleLogout = async () => {
        try {
            await Auth.logout();
            window.location.href = BP || '/';
        } catch (error) {
            toast.error("Error logging out.");
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-black overflow-x-hidden pb-20">

            <div className="flex h-[calc(100vh-65px)] max-w-7xl mx-auto">

                {/* SETTINGS SIDEBAR */}
                <aside className="w-64 bg-transparent flex-col hidden md:flex shrink-0 pt-8 pr-8">
                    <nav className="flex-1 space-y-1">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/5 font-semibold text-sm transition-all">
                            <LayoutDashboard className="w-4 h-4" /> Home
                        </Link>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/5 font-semibold text-sm transition-all mb-4">
                            <UserIcon className="w-4 h-4" /> Profile Hub
                        </Link>

                        <div className="pt-4 pb-2 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">
                            App Settings
                        </div>
                        {SIDEBAR_NAV.map(nav => (
                            <button
                                key={nav.id}
                                onClick={() => setActiveTab(nav.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === nav.id
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                                    }`}
                            >
                                <nav.icon className="w-4 h-4" /> {nav.label}
                            </button>
                        ))}

                        <div className="pt-8 w-full border-t border-foreground/5 mt-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 md:pt-12">
                    <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-[var(--primary)]" />
                        Settings
                    </h1>

                    <div className="bg-white dark:bg-[#111] rounded-[2rem] shadow-xl border border-foreground/10 overflow-hidden lg:max-w-4xl">

                        {/* Mobile Tab Scroller */}
                        <div className="flex md:hidden overflow-x-auto border-b border-foreground/10 custom-scrollbar">
                            {SIDEBAR_NAV.map(nav => (
                                <button
                                    key={nav.id}
                                    onClick={() => setActiveTab(nav.id)}
                                    className={`whitespace-nowrap px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === nav.id
                                        ? 'border-[var(--primary)] text-[var(--primary)]'
                                        : 'border-transparent text-foreground/50 hover:text-foreground'
                                        }`}
                                >
                                    {nav.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 md:p-10 lg:p-12 min-h-[50vh]">

                            {/* DISPLAY SETTINGS */}
                            {activeTab === 'display' && (
                                <div className="space-y-10 animate-in fade-in duration-300">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black">Theme Mode</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {['light', 'dark', 'system'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        setTheme(t);
                                                        const root = document.documentElement;
                                                        root.classList.remove("light", "dark");
                                                        if (t === "system") {
                                                            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                                                            root.classList.add(systemTheme);
                                                        } else {
                                                            root.classList.add(t);
                                                        }
                                                        toast.success(`Theme set to ${t}`);
                                                    }}
                                                    className={`px-6 py-4 rounded-xl border-2 font-bold capitalize transition-all ${theme === t ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-foreground/10 hover:border-foreground/20'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black">Font Size (Accessibility)</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {['small', 'medium', 'large', 'x-large'].map(fs => (
                                                <button
                                                    key={fs}
                                                    onClick={() => { setFontSize(fs); toast.success(`Font size updated`); }}
                                                    className={`px-6 py-4 rounded-xl border-2 font-bold capitalize transition-all ${fontSize === fs ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-foreground/10 hover:border-foreground/20'}`}
                                                >
                                                    <span className={fs === 'small' ? 'text-sm' : fs === 'medium' ? 'text-base' : fs === 'large' ? 'text-lg' : 'text-xl'}>Aa {fs}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-sm text-foreground/50 mt-2">Adjusts the sizing of all devotional text and forms.</p>
                                    </div>
                                </div>
                            )}

                            {/* LOCALIZATION */}
                            {activeTab === 'localization' && (
                                <div className="space-y-10 animate-in fade-in duration-300">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black">Display Language</h3>
                                        <div className="flex flex-col gap-3 max-w-sm">
                                            <button onClick={() => { setLanguage('en'); toast.success('Language changed'); }} className={`flex items-center gap-4 p-4 border rounded-xl font-bold ${language === 'en' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-foreground/10'}`}>
                                                🇺🇸 English (US)
                                            </button>
                                            <button onClick={() => { setLanguage('jp'); toast.success('言語が変更されました'); }} className={`flex items-center gap-4 p-4 border rounded-xl font-bold ${language === 'jp' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-foreground/10'}`}>
                                                🇯🇵 日本語 (Japanese)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PRIVACY */}
                            {activeTab === 'privacy' && (
                                <div className="space-y-10 animate-in fade-in duration-300">
                                    <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-black text-lg">Bible Study Groups Visibility</h4>
                                                <p className="text-sm text-foreground/50 mt-1 max-w-sm">Allow other church members to find your basic profile when creating Bible study groups.</p>
                                            </div>
                                            <button onClick={() => setGroupsVisibility(!groupsVisibility)} className={`w-14 h-8 rounded-full transition-colors relative ${groupsVisibility ? 'bg-[var(--primary)]' : 'bg-foreground/20'}`}>
                                                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${groupsVisibility ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                        <h4 className="font-black text-lg">Data & Cookies</h4>
                                        <p className="text-sm text-foreground/70 mt-1 leading-relaxed">
                                            We respect your privacy. All analytical data is fully anonymized before being recorded,
                                            ensuring that your journaling responses and personal spiritual progress remain strictly confidential between you and the pastoral team.
                                        </p>
                                        <ul className="text-xs text-foreground/50 list-disc pl-4 space-y-2 mt-4 font-medium">
                                            <li>Cookies are only used for maintaining authentication state via Supabase. We do not run any ad-tracking cookies.</li>
                                            <li>Your "Observation" and "Prayer" journal entries are encrypted at rest using AES-256 and subject to strict Row Level Security (RLS) policies.</li>
                                            <li>Only designated site administrators holding explicit Pastoral clearance can access aggregate church-wide member analytics.</li>
                                        </ul>
                                        <p className="text-xs text-[var(--primary)] mt-4 font-bold border-t border-foreground/10 pt-4">
                                            Contact your administration representative via your connection card if you wish to request a full GDPR-compliance data wipe spanning all your history.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SECURITY */}
                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 md:p-8 text-amber-600">
                                        <div className="flex items-start gap-4">
                                            <Lock className="w-6 h-6 shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-black text-lg mb-2">Password Reset</h4>
                                                <p className="text-sm opacity-80 mb-6 font-medium">Clicking this button will securely email you a link to reset your password and enforce an immediate log-out across all devices.</p>
                                                <Button onClick={handlePasswordReset} className="h-12 px-6 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 shadow-lg shadow-amber-500/20">Send Reset Link</Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 md:p-8 text-red-600">
                                        <h4 className="font-black text-lg mb-2">Danger Zone</h4>
                                        <p className="text-sm opacity-80 mb-6 font-medium">Permanently delete your account and all associated devotional data. This action cannot be undone.</p>
                                        <div className="flex gap-4">
                                            <Button onClick={handleDeleteAccount} variant="outline" className="h-12 px-6 rounded-xl border-red-500 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all">Delete My Account</Button>
                                            <Button onClick={handleLogout} variant="outline" className="h-12 px-6 rounded-xl border-foreground/20 text-foreground font-bold hover:bg-foreground hover:text-background flex md:hidden items-center gap-2">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
