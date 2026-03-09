"use client";

import { useState, useRef, useEffect } from "react";
import {
    Search, Bell, Plus, ChevronDown, User, LogOut, RefreshCw,
    BookOpen, Calendar, Heart, Users, FileText, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Auth } from "@/lib/auth";
import { AdminAuth } from "@/lib/admin-auth";
import { basePath as BP } from "@/lib/utils";
import Link from "next/link";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";
import { useTheme } from "@/components/theme-provider";

import { QuickActionModal, QuickActionType } from "./QuickActionModal";

interface TopBarProps {
    alertCount?: number;
    userName?: string;
    onRefresh?: () => void;
}

export function TopBar({ alertCount = 0, userName = "Admin", onRefresh }: TopBarProps) {
    const { role } = useAdminCtx();
    const { mode, toggleMode } = useTheme();
    const [quickOpen, setQuickOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // Quick Action Modal State
    const [activeAction, setActiveAction] = useState<QuickActionType | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    const quickRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const ROLE_LABELS: Record<string, string> = {
        super_admin: "System Master",
        owner: "Organization Owner",
        shepherd: "Shepherd / Leader",
        admin: "Administrator",
        ministry_lead: "Ministry Leader",
        ministry_leader: "Ministry Leader"
    };

    const QUICK_ACTIONS_CONFIG = [
        { icon: Users, label: "Add Member", type: "member" as QuickActionType },
        { icon: Calendar, label: "Create Event", type: "event" as QuickActionType },
        { icon: Heart, label: "Add Prayer Request", type: "prayer" as QuickActionType },
        { icon: BookOpen, label: "Assign Ministry Role", type: "ministry" as QuickActionType },
        { icon: FileText, label: "Generate Report", type: "report" as QuickActionType },
    ];

    const openAction = (type: QuickActionType) => {
        setActiveAction(type);
        setIsActionModalOpen(true);
        setQuickOpen(false);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b border-border flex-shrink-0 z-50 transition-colors duration-500">
            {/* Quick Action Modal Replacement */}
            <QuickActionModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                type={activeAction}
            />

            {/* Left: Title */}
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-sm font-black tracking-widest text-foreground uppercase">Mission Control</h2>
                    <p className="text-[10px] text-muted-foreground font-medium tracking-wider">Japan Kingdom Church · Shepherd Dashboard</p>
                </div>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-xs mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        placeholder="Search members, ministries, requests..."
                        className="w-full h-9 bg-foreground/5 border border-border rounded-xl pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMode}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    {mode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>

                {/* Refresh */}
                {onRefresh && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={onRefresh}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                )}

                {/* Notifications */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        id="notifications-btn"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted relative transition-colors"
                        onClick={() => setNotifOpen(o => !o)}
                    >
                        <Bell className="w-4 h-4" />
                        {alertCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background" />
                        )}
                    </Button>
                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Alerts</p>
                                    {alertCount > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">{alertCount} URGENT</Badge>}
                                </div>
                                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                                    {[
                                        { text: "12 members haven't engaged in 7+ days", level: "critical" },
                                        { text: "Financial stress prayers up 40%", level: "warning" },
                                        { text: "Youth attendance grew 24% this month", level: "info" },
                                    ].map((n, i) => (
                                        <div key={i} className={`p-3 rounded-xl text-xs font-medium space-x-2 ${n.level === 'critical' ? 'bg-red-500/10 text-red-300' : n.level === 'warning' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                                            {n.text}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Actions */}
                <div className="relative" ref={quickRef}>
                    <Button
                        id="quick-actions-btn"
                        onClick={() => setQuickOpen(o => !o)}
                        className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl gap-1.5 shadow-lg shadow-violet-500/20"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Quick Actions
                        <ChevronDown className={`w-3 h-3 transition-transform ${quickOpen ? 'rotate-180' : ''}`} />
                    </Button>
                    <AnimatePresence>
                        {quickOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-12 w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-2">
                                    {QUICK_ACTIONS_CONFIG.map((qa) => {
                                        const Icon = qa.icon;
                                        return (
                                            <button key={qa.label} onClick={() => openAction(qa.type)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-left font-medium">
                                                <Icon className="w-4 h-4 text-violet-400" />
                                                {qa.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                {/* Profile */}
                <div className="relative ml-2" ref={profileRef}>
                    <button
                        id="admin-profile-btn"
                        onClick={() => setProfileOpen(o => !o)}
                        className="flex items-center gap-2 h-9 px-3 rounded-xl hover:bg-muted transition-all"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">
                            {userName[0]}
                        </div>
                        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute right-0 top-12 w-48 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-2">
                                    <div className="px-3 py-2 mb-1">
                                        <p className="text-xs font-black text-foreground">{userName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{ROLE_LABELS[role] || "Staff Member"}</p>
                                    </div>
                                    <div className="border-t border-border pt-1 space-y-0.5">
                                        <Link href="/shepherd/dashboard/settings/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                            <User className="w-3.5 h-3.5" /> My Profile
                                        </Link>
                                        <button onClick={() => AdminAuth.logoutAdmin()} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
