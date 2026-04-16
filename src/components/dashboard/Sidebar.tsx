"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard, HeartPulse, Users, BookOpen, Music,
    Globe, Calendar, DollarSign, TrendingUp, Sparkles,
    FileText, Settings, ChevronLeft, ChevronRight, Shield,
    MessagesSquare, Flame, LayoutGrid, Megaphone, ShieldCheck,
    Youtube, Mail, Play, ShoppingBag, Zap
} from "lucide-react";
import { basePath as BP } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Church Overview", icon: LayoutDashboard, path: "" },
    { label: "ChurchGPT AI", icon: Sparkles, path: "/member-chat", absolute: true },
    { label: "Spiritual Analytics", icon: HeartPulse, path: "/spiritual" },
    { label: "Pastoral Care", icon: Shield, path: "/care" },
    { label: "Members", icon: Users, path: "/members" },
    { label: "Membership Requests", icon: ShieldCheck, path: "/requests" },
    { label: "Kingdom Connect", icon: Zap, path: "/kcc" },
    { label: "Ministries", icon: Music, path: "/ministries" },
    { label: "Bible Study Groups", icon: MessagesSquare, path: "/bible-study" },
    { label: "Events", icon: Calendar, path: "/events" },
    { label: "Giving & Finance", icon: DollarSign, path: "/finance" },
    { label: "Donation Log", icon: DollarSign, path: "/finance/giving-log" },
    { label: "Growth Intelligence", icon: TrendingUp, path: "/growth" },
    { label: "Platform Intelligence", icon: Globe, path: "/platform" },
    { label: "AI Command Center", icon: Sparkles, path: "/ai" },
    { label: "Ministry Hub", icon: LayoutGrid, path: "/ministry-hub" },
    { label: "Ministry Comms", icon: Megaphone, path: "/ministries/announcements" },
    { label: "Newsletters", icon: Megaphone, path: "/newsletters" },
    { label: "Sermons", icon: Youtube, path: "/sermons" },
    { label: "Testimonies", icon: Play, path: "/testimonies" },
    { label: "Merchandise", icon: ShoppingBag, path: "/merchandise" },
    { label: "Website Inquiries", icon: Mail, path: "/inquiries" },
    { label: "Communications Log", icon: MessagesSquare, path: "/communications" },
    { label: "Reports & Data", icon: FileText, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
];

const BASE_PATH = "/shepherd/dashboard";

import { useEffect } from "react";
import { AdminAuth, AdminRole } from "@/lib/admin-auth";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [role, setRole] = useState<AdminRole | null>(null);

    useEffect(() => {
        AdminAuth.getAdminSession().then(session => {
            if (session) setRole(session.role);
        });
    }, []);

    const showPastorSwitch = role === 'super_admin' || role === 'owner' || (role as string) === 'pastor';

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex flex-col h-full bg-card border-r border-border overflow-hidden flex-shrink-0 transition-colors duration-500"
        >
            {/* Logo */}
            <div className={cn(
                "flex items-center gap-3 px-5 py-5 border-b border-border flex-shrink-0",
                collapsed && "justify-center px-0"
            )}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                    <Flame className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-xs font-black tracking-widest text-foreground uppercase">Church OS</p>
                        <p className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">Mission Control</p>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                <div className="space-y-0.5 px-2">
                    {NAV_ITEMS.map((item) => {
                        const fullPath = item.absolute ? item.path : `${BASE_PATH}${item.path}`;
                        const isActive = item.path === ""
                            ? pathname === BASE_PATH || pathname === BASE_PATH + "/"
                            : pathname === fullPath || 
                              pathname === `${fullPath}/`;
                        const Icon = item.icon;

                        return (
                            <motion.button
                                key={item.path}
                                whileHover={{ x: 2 }}
                                onClick={() => router.push(fullPath.endsWith('/') ? fullPath : `${fullPath}/`)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
                                    isActive
                                        ? "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 shadow-sm"
                                        : item.label === "ChurchGPT AI" 
                                            ? "text-amber-600 hover:bg-amber-500/10" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                    collapsed && "justify-center px-0"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                    isActive ? "bg-violet-500/30" : "group-hover:bg-muted"
                                )}>
                                    <Icon className={cn(
                                        "w-4 h-4",
                                        isActive ? "text-violet-600 dark:text-violet-400" : "text-current"
                                    )} />
                                </div>
                                {!collapsed && (
                                    <span className="text-xs font-semibold tracking-wide truncate">
                                        {item.label}
                                    </span>
                                )}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </nav>

            {/* Pastor Switch & Collapse */}
            <div className="p-3 border-t border-border flex-shrink-0 space-y-1">
                {showPastorSwitch && !collapsed && (
                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                sessionStorage.setItem('church_os_active_surface', 'pastor-hq');
                                sessionStorage.removeItem('church_os_domain_session');
                            }
                            router.push("/pastor-hq/");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-all group"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pastor&apos;s HQ</span>
                    </button>
                )}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs font-medium">Collapse Sidebar</span>}
                </button>
            </div>
        </motion.aside>
    );
}
