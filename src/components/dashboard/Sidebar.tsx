"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard, HeartPulse, Users, BookOpen, Music,
    Globe, Calendar, DollarSign, TrendingUp, Sparkles,
    FileText, Settings, ChevronLeft, ChevronRight, Shield,
    MessagesSquare, Flame
} from "lucide-react";
import { basePath as BP } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Church Overview", icon: LayoutDashboard, path: "" },
    { label: "Spiritual Analytics", icon: HeartPulse, path: "/spiritual" },
    { label: "Pastoral Care", icon: Shield, path: "/care" },
    { label: "Members", icon: Users, path: "/members" },
    { label: "Ministries", icon: Music, path: "/ministries" },
    { label: "Fellowship Circles", icon: MessagesSquare, path: "/fellowship" },
    { label: "Events", icon: Calendar, path: "/events" },
    { label: "Giving & Finance", icon: DollarSign, path: "/finance" },
    { label: "Growth Intelligence", icon: TrendingUp, path: "/growth" },
    { label: "AI Command Center", icon: Sparkles, path: "/ai" },
    { label: "Reports & Data", icon: FileText, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
];

const BASE_PATH = "/shepherd/dashboard";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex flex-col h-full bg-[#0d1421] border-r border-white/5 overflow-hidden flex-shrink-0"
        >
            {/* Logo */}
            <div className={cn(
                "flex items-center gap-3 px-5 py-5 border-b border-white/5 flex-shrink-0",
                collapsed && "justify-center px-0"
            )}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                    <Flame className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-xs font-black tracking-widest text-white/90 uppercase">Church OS</p>
                        <p className="text-[9px] text-white/40 font-medium tracking-wider uppercase">Mission Control</p>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                <div className="space-y-0.5 px-2">
                    {NAV_ITEMS.map((item) => {
                        const fullPath = `${BASE_PATH}${item.path}`;
                        const isActive = item.path === ""
                            ? pathname === fullPath || pathname === BASE_PATH + "/"
                            : pathname.startsWith(fullPath);
                        const Icon = item.icon;

                        return (
                            <motion.button
                                key={item.path}
                                whileHover={{ x: 2 }}
                                onClick={() => router.push(fullPath)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
                                    isActive
                                        ? "bg-violet-500/20 text-violet-300"
                                        : "text-white/40 hover:text-white/80 hover:bg-white/5",
                                    collapsed && "justify-center px-0"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                    isActive ? "bg-violet-500/30" : "group-hover:bg-white/10"
                                )}>
                                    <Icon className={cn(
                                        "w-4 h-4",
                                        isActive ? "text-violet-300" : "text-current"
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

            {/* Collapse toggle */}
            <div className="p-3 border-t border-white/5 flex-shrink-0">
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-center p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
                </button>
            </div>
        </motion.aside>
    );
}
