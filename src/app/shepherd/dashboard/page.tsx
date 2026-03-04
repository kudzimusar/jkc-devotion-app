"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    HeartPulse,
    Globe,
    LogOut,
    ArrowLeft,
    RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShepherdView } from "@/components/dashboard/shepherd-view";

const BP = "/jkc-devotion-app";

export default function ShepherdDashboard() {
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [dashLang, setDashLang] = useState<"EN" | "JP">("EN");

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            const user = await Auth.getCurrentUser();

            if (!user) {
                // If not logged in, we let the auth guard handle it or show guest view
                // For now, assume mock if no user for demo
                setUserRole("shepherd");
            } else {
                const { data: member } = await supabase
                    .from("org_members")
                    .select("role")
                    .eq("user_id", user.id)
                    .single();

                if (member) {
                    setUserRole(member.role);
                } else {
                    // Fallback to member or no-access
                    setUserRole("member");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    if (!userRole || (userRole !== 'shepherd' && userRole !== 'admin' && userRole !== 'owner' && userRole !== 'ministry_lead')) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-screen text-center space-y-4">
                <HeartPulse className="w-16 h-16 text-red-500 opacity-20" />
                <h1 className="text-2xl font-bold">Access Restricted</h1>
                <p className="opacity-60 max-w-md">This dashboard is reserved for Pastors, Elders, and Ministry Leads overseeing the congregation's spiritual health.</p>
                <Button onClick={() => window.location.href = BP}>Return to Devotions</Button>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = BP} className="glass rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-primary flex items-center gap-3">
                            <HeartPulse className="w-8 h-8" />
                            SHEPHERD OVERSIGHT
                        </h1>
                        <p className="text-sm opacity-50 font-medium tracking-wide uppercase">Congregational Spiritual Health • JKC Transformation Journey</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
                        <button
                            onClick={() => setDashLang('EN')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dashLang === 'EN' ? 'bg-primary text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                        >
                            ENGLISH
                        </button>
                        <button
                            onClick={() => setDashLang('JP')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dashLang === 'JP' ? 'bg-primary text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                        >
                            日本語
                        </button>
                    </div>

                    <Button variant="ghost" className="glass rounded-full text-xs font-bold gap-2 text-red-400 hover:text-red-300" onClick={() => Auth.logout().then(() => window.location.href = BP)}>
                        <LogOut className="w-4 h-4" />
                        LOGOUT
                    </Button>
                </div>
            </div>

            <ShepherdView lang={dashLang} />
        </main>
    );
}
