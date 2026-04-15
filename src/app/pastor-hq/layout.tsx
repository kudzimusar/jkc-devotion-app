"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, Moon, Sun, Monitor, LogOut } from "lucide-react";
import { AdminAuth, AdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";

import { PastorCtx, PastorContext } from "./pastor-context";

export default function PastorHQLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<{ loading: boolean; authed: boolean; ctx: PastorCtx }>({
        loading: true,
        authed: false,
        ctx: { role: 'super_admin', userName: 'Pastor', userId: '', orgId: '', refreshDashboard: () => { } }
    });

    const loadSession = useCallback(async () => {
        const session = await AdminAuth.getSession('tenant');
        
        // Strict Pastor/SuperAdmin/Owner check for Pastor HQ
        // Surface check: pastor-hq
        const authorized = session && session.auth_surface === 'pastor-hq';

        if (!authorized) {
            router.replace("/church/login/");
            return;
        }

        setState({
            loading: false,
            authed: true,
            ctx: {
                role: session.role as AdminRole,
                userName: session.name,
                userId: session.identity_id,
                orgId: session.org_id || '',
                refreshDashboard: () => loadSession(),
            }
        });
    }, [router]);

    useEffect(() => { loadSession(); }, [loadSession]);

    const handleLogout = async () => {
        await AdminAuth.logout();
        router.push("/church/login/");
    };

    if (state.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto">
                        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                        Preparing Strategic Center
                    </p>
                </div>
            </div>
        );
    }

    if (!state.authed) return null;

    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <PastorContext.Provider value={state.ctx}>
                <div className="min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-violet-500/20">
                    {/* Top Strategic Navigation (Simplified) */}
                    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-xl z-50 px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Monitor className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black uppercase tracking-tighter">Pastor&apos;s HQ</h1>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Strategic Command Center</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Operational Hot-Switch */}
                            <button 
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.setItem('church_os_active_surface', 'mission-control');
                                        sessionStorage.removeItem('church_os_domain_session');
                                        // Do NOT clear church_os_phq_direct — the pastor remains authenticated
                                        // for this session and must be able to return freely without re-doing 2MFA
                                    }
                                    router.push("/shepherd/dashboard/");
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-violet-500 transition-colors"
                            >
                                Switch to Mission Control
                            </button>

                            {/* Profile / Logout */}
                            <div className="flex items-center gap-3 pl-6 border-l border-border">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase leading-tight">{state.ctx.userName}</p>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Strategic Head</p>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Secondary Tab Navigation */}
                    <PastorHQTabs />

                    {/* Main Content Area — pt-36 = 64px nav + 44px tabs + spacing */}
                    <main className="pt-36 pb-12 px-8 max-w-[1400px] mx-auto">
                        {children}
                    </main>
                </div>
            </PastorContext.Provider>
        </ThemeProvider>
    );
}

import { useTheme } from "next-themes";

function PastorHQTabs() {
    const pathname = usePathname();
    const tabs = [
        { label: 'Dashboard', href: '/pastor-hq' },
        { label: 'Inquiries', href: '/pastor-hq/inquiries' },
        { label: 'Prayer Requests', href: '/pastor-hq/prayer-requests' },
        { label: 'Settings', href: '/pastor-hq/settings' },
    ];
    return (
        <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur border-b border-border px-8">
            <div className="max-w-[1400px] mx-auto flex gap-6">
                {tabs.map(tab => {
                    const isActive = tab.href === '/pastor-hq'
                        ? pathname === '/pastor-hq'
                        : pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                                isActive
                                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-20 h-10 bg-muted rounded-full animate-pulse" />;

    return (
        <div className="flex items-center bg-muted rounded-full p-1 gap-1">
            <button 
                onClick={() => setTheme('light')}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    theme === 'light' ? "bg-background shadow-sm text-violet-600" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Sun className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setTheme('dark')}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    theme === 'dark' ? "bg-background shadow-sm text-violet-400" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    );
}
