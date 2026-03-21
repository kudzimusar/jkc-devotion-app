"use client";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { Heart, AlertTriangle, CheckCircle2, Clock, MessageSquare, Plus, Filter } from "lucide-react";
import { useAdminCtx } from "../Context";

interface Prayer { id: string; category: string; urgency: string; request_text: string; status: string; is_anonymous: boolean; created_at: string; }

const URGENCY_CONFIG = {
    crisis: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
    urgent: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
    normal: { color: 'text-muted-foreground', bg: 'bg-card border-border', badge: 'bg-muted text-muted-foreground' },
};

const STATUS_CONFIG = {
    active: { icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    in_prayer: { icon: Heart, color: 'text-violet-600 dark:text-violet-400' },
    answered: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    closed: { icon: CheckCircle2, color: 'text-muted-foreground/40' },
};

export default function CareAndPrayerPage() {
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        const load = async () => {
            const [prayersRes, alertsRes] = await Promise.all([
                supabase.from('prayer_requests').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
                supabase.from('member_alerts').select('*, member:profiles(name, org_id)').eq('is_resolved', false).order('created_at', { ascending: false })
            ]);
            
            // Filter alerts where member is in the same org (if join doesn't filter enough)
            const filteredAlerts = (alertsRes.data || []).filter((a: any) => a.member?.org_id === orgId);
            
            setPrayers(prayersRes.data || []);
            setAlerts(filteredAlerts);
            setLoading(false);
        };
        load();
    }, [orgId]);

    const active = prayers.filter(p => p.status === 'active' || p.status === 'in_prayer');
    const answered = prayers.filter(p => p.status === 'answered');
    const crisis = prayers.filter(p => p.urgency === 'crisis');

    const filtered = prayers.filter(p => filter === 'all' || p.status === filter || p.urgency === filter);

    const markAnswered = async (id: string) => {
        await supabase.from('prayer_requests').update({ status: 'answered', answered_date: new Date().toISOString().split('T')[0] }).eq('id', id);
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: 'answered' } : p));
    };

    return (
        <div className="p-6 xl:p-8 text-foreground transition-colors duration-500">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Pastoral Care Center</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Prayer board, crisis alerts & counseling coordination</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Active Prayers', val: active.length, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Care Alerts', val: alerts.length, color: 'text-red-600 dark:text-red-400' },
                    { label: 'Crisis Requests', val: crisis.length, color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'Answered', val: answered.length, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Total Volume', val: prayers.length + alerts.length, color: 'text-primary' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {['all', 'active', 'in_prayer', 'answered', 'crisis'].map(f => (
                    <button key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground/40 text-[10px] uppercase tracking-[0.2em] font-black">Loading Care Intelligence...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prayer Board */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-2">Live Prayer Board</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filtered.map((p, i) => {
                                const urg = URGENCY_CONFIG[p.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.normal;
                                const stat = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
                                const StatIcon = stat.icon;
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`p-4 rounded-2xl border shadow-sm ${urg.bg}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${urg.badge}`}>
                                                    {p.urgency}
                                                </span>
                                            </div>
                                            <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed mb-3">
                                            {p.is_anonymous ? '🔒 ' : ''}{p.request_text}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-medium text-muted-foreground/40">{new Date(p.created_at).toLocaleDateString()}</p>
                                            {p.status !== 'answered' && (
                                                <button onClick={() => markAnswered(p.id)} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3 h-3" /> Answered
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Care Alerts Sidebar */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Disengagement Risk
                        </h2>
                        <div className="space-y-3">
                            {alerts.length > 0 ? alerts.map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl group hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-black text-foreground">{a.member?.name}</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${a.severity === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                                            {a.severity}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground/50 mb-3">{a.alert_type}</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-muted border border-border rounded-xl text-[9px] font-black text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all uppercase tracking-widest">
                                            View Profile
                                        </button>
                                        <button className="px-4 py-2 bg-red-600 dark:bg-red-500/20 rounded-xl text-[9px] font-black text-white dark:text-red-400 hover:bg-red-700 dark:hover:bg-red-500/30 transition-all uppercase tracking-widest shadow-sm">
                                            Contact
                                        </button>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/10 mx-auto mb-2" />
                                    <p className="text-[9px] text-muted-foreground/20 font-black uppercase tracking-widest">No Alerts Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
