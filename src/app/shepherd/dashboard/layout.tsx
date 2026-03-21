"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminAuth, AdminRole } from "@/lib/admin-auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { AIPanel } from "@/components/dashboard/AIPanel";
import { supabase } from "@/lib/supabase";
import { basePath as BP } from "@/lib/utils";
import { toast } from "sonner";

import { AdminCtx, AdminContext, useAdminCtx } from "./Context";

export default function ShepherdDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [state, setState] = useState<{ loading: boolean; authed: boolean; ctx: AdminCtx }>({
        loading: true,
        authed: false,
        ctx: { role: 'admin', userName: 'Admin', userId: '', orgId: '', alertCount: 0, refreshDashboard: () => { } }
    });

    const loadSession = useCallback(async () => {
        const session = await AdminAuth.getAdminSession();
        if (!session) {
            router.replace("/login/");
            return;
        }

        // Load alert count with standard client (secure via RLS)
        const { count } = await supabase
            .from('ai_insights')
            .select('*', { count: 'exact', head: true })
            .eq('priority', 'critical')
            .eq('is_acknowledged', false);

        setState({
            loading: false,
            authed: true,
            ctx: {
                role: session.role,
                userName: session.name,
                userId: session.userId,
                orgId: session.orgId,
                alertCount: count || 0,
                refreshDashboard: () => loadSession(),
            }
        });
    }, [router]);

    useEffect(() => { loadSession(); }, [loadSession]);

    const handleRefresh = () => {
        AdminAuth.clearCache();
        loadSession();
        toast.success("Dashboard refreshed");
    };

    if (state.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background transition-colors duration-500">
                <div className="text-center space-y-3">
                    <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Initializing Mission Control
                    </p>
                </div>
            </div>
        );
    }

    if (!state.authed) return null; // router.replace already called

    return (
        <AdminContext.Provider value={state.ctx}>
            <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
                {/* Sidebar */}
                <Sidebar />

                {/* Main */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    {/* TopBar */}
                    <TopBar
                        alertCount={state.ctx.alertCount}
                        userName={state.ctx.userName}
                        onRefresh={handleRefresh}
                    />

                    {/* Content + AI Panel */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        <main className="flex-1 overflow-y-auto">
                            {children}
                        </main>
                        <AIPanel />
                    </div>
                </div>
            </div>
        </AdminContext.Provider>
    );
}
