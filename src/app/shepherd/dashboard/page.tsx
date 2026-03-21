"use client";
import { useState, useEffect } from "react";
import { ShepherdView } from "@/components/dashboard/shepherd-view";
import { useAdminCtx } from "./Context";
import { supabase } from "@/lib/supabase";
import { withRoleGuard } from "@/components/auth/withRoleGuard";

function ShepherdDashboardPage() {
    const { userName } = useAdminCtx();
    const [dashLang, setDashLang] = useState<"EN" | "JP">("EN");
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground font-black text-[10px] tracking-widest uppercase">Initializing Command Center...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-foreground tracking-wide">Church Mission Control</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · JST
                    </p>
                </div>
                <div className="flex items-center bg-muted p-1 rounded-xl border border-border">
                    <button onClick={() => setDashLang('EN')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'EN' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
                    <button onClick={() => setDashLang('JP')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'JP' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>日本語</button>
                </div>
            </div>
            <ShepherdView lang={dashLang} />
        </div>
    );
}

export default withRoleGuard(ShepherdDashboardPage, ['admin', 'shepherd', 'super_admin', 'owner', 'pastor']);
