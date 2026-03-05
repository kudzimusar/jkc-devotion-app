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
            <div className="flex flex-col items-center justify-center p-6 md:p-20 min-h-screen text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="glass border-red-500/20 bg-red-500/5 p-8 md:p-12 rounded-[3rem] max-w-lg mx-auto text-center flex flex-col items-center shadow-2xl">
                    <HeartPulse className="w-16 h-16 text-red-500 mb-6 drop-shadow-lg" />
                    <h1 className="text-3xl font-black text-white mb-2 tracking-wide">Access Restricted</h1>
                    <p className="opacity-70 font-medium mb-8 text-sm leading-relaxed">
                        This dashboard is secured and reserved strictly for Pastoral leadership, Elders, and Ministry Leads to oversee the congregation's spiritual health.
                    </p>

                    <div className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl mb-8 text-left space-y-3 shadow-inner">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-[#FF3366] mb-2 flex items-center gap-2">
                            Auth Structure Overview
                        </h4>
                        <p className="text-[10px] opacity-70 leading-relaxed font-mono">
                            1. Supabase verifies active user session.<br /><br />
                            2. Database queries `org_members` table for your UUID.<br /><br />
                            3. User must hold `shepherd`, `admin`, `owner`, or `ministry_lead` level clearance.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={() => {
                                toast.success("Bypassing security for testing as Pastor...");
                                setUserRole("shepherd");
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl h-12 w-full shadow-lg shadow-amber-600/20"
                        >
                            BYPASS FOR TESTING (MOCK PASTOR)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = BP || "/"}
                            className="glass border-white/10 rounded-2xl h-12 w-full font-bold opacity-60 hover:opacity-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            RETURN TO APP
                        </Button>
                    </div>
                </div>
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
