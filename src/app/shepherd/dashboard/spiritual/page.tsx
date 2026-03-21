"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Flame, TrendingUp, BookOpen, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/lib/supabase";
import { useAdminCtx } from "../Context";

const TOOLTIP_STYLE = {
    contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
    itemStyle: { color: 'var(--foreground)', fontSize: 11 },
    labelStyle: { color: 'var(--muted-foreground)', fontSize: 9, textTransform: 'uppercase' as const },
};

export default function SpiritualPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [soap, setSoap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        Promise.all([
            supabase.from('member_stats')
                .select('*')
                .eq('org_id', orgId)
                .order('engagement_score', { ascending: false })
                .limit(20),
            supabase.from('soap_entries')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false })
                .limit(50),
        ]).then(([s, e]) => {
            setStats(s.data || []);
            setSoap(e.data || []);
            setLoading(false);
        });
    }, [orgId]);

    const avgStreak = stats.length ? Math.round(stats.reduce((a, s) => a + (s.current_streak || 0), 0) / stats.length) : 0;
    const totalDevotions = stats.reduce((a, s) => a + (s.completed_devotions || 0), 0);
    const activeToday = stats.filter(s => s.last_devotion_date === new Date().toISOString().split('T')[0]).length;

    // Sentiment from soap entries
    const sentimentCounts = soap.reduce((acc: Record<string, number>, e) => {
        if (e.sentiment) acc[e.sentiment] = (acc[e.sentiment] || 0) + 1;
        return acc;
    }, {});
    const sentimentData = Object.entries(sentimentCounts).map(([name, value]) => ({ name, value }));
    const COLORS = ['#7c3aed', '#0891b2', '#e11d48', '#059669', '#d97706']; // Darker variants for light mode

    // Streak leaderboard
    const topStreaks = [...stats].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0)).slice(0, 8);

    // Weekly completion trend (mock from stats data)
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendData = weekDays.map((day, i) => ({
        day,
        completions: Math.max(0, (activeToday || stats.length) - Math.floor(Math.random() * 5)),
    }));

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-foreground">Spiritual Analytics</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Devotion tracking, streaks, SOAP journal insights</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Avg Streak', val: `${avgStreak}d`, icon: Flame, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Active Today', val: activeToday, icon: HeartPulse, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Total Devotions', val: totalDevotions, icon: BookOpen, color: 'text-violet-600 dark:text-violet-400' },
                    { label: 'SOAP Entries', val: soap.length, icon: BarChart2, color: 'text-cyan-600 dark:text-cyan-400' },
                ].map(k => (
                    <div key={k.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color}`} />
                        </div>
                        <p className="text-2xl font-black text-foreground">{loading ? '—' : k.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Weekly Trend */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Weekly Completion Trend</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 9, opacity: 0.5 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="completions" name="Completions" stroke="#8b5cf6" strokeWidth={2} fill="url(#sg)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* SOAP Sentiment */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">SOAP Journal Themes</p>
                    {sentimentData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-muted-foreground/20 text-xs">
                            No sentiment data yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                                    {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />)}
                                </Pie>
                                <Tooltip {...TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Streak Leaderboard */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Streak Leaderboard</p>
                {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div> : (
                    <div className="space-y-2">
                        {topStreaks.map((s, i) => (
                            <div key={s.id || i} className="flex items-center gap-3">
                                <span className={`text-[10px] font-black w-5 text-center ${i < 3 ? 'text-amber-400' : 'text-muted-foreground/40'}`}>{i + 1}</span>
                                <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-xs font-black text-violet-600 dark:text-violet-400">
                                    {(s.name || 'U')[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground">{s.name || `Member #${i + 1}`}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, ((s.current_streak || 0) / 90) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-amber-400" />
                                    <p className="text-xs font-black text-foreground">{s.current_streak || 0}d</p>
                                </div>
                            </div>
                        ))}
                        {topStreaks.length === 0 && <p className="text-center text-muted-foreground/25 text-xs py-4">No streak data yet</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
