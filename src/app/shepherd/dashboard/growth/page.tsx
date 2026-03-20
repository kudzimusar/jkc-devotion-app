"use client";
import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { TrendingUp, Users, UserCheck, Globe, Plus, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminCtx } from "../layout";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function GrowthPage() {
    const [trendData, setTrendData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { orgId } = useAdminCtx();

    const loadGrowthData = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('vw_growth_intelligence')
                .select('*')
                .eq('org_id', orgId)
                .order('month', { ascending: false });

            if (error) throw error;
            setTrendData(data || []);
        } catch (error: any) {
            toast.error("Failed to load growth data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGrowthData();
    }, [orgId]);

    // Aggregate totals
    const totals = trendData.reduce((acc, row) => ({
        salvations: acc.salvations + (row.total_salvations || 0),
        reached: acc.reached + (row.people_reached || 0),
        contacts: acc.contacts + (row.contacts || 0),
        events: acc.events + (row.outreach_events || 0),
    }), { salvations: 0, reached: 0, contacts: 0, events: 0 });

    const funnelStages = [
        { label: 'People Reached', count: totals.reached, color: '#60a5fa' },
        { label: 'Contacts Collected', count: totals.contacts, color: '#8b5cf6' },
        { label: 'Salvations Recorded', count: totals.salvations, color: '#34d399' }
    ];

    const maxFunnelCount = Math.max(totals.reached, 1);

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">Growth Intelligence</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">Real-time outreach data via Ministry Reports</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Reached', val: totals.reached, color: 'text-blue-400' },
                    { label: 'Total Contacts', val: totals.contacts, color: 'text-violet-400' },
                    { label: 'New Salvations', val: totals.salvations, color: 'text-emerald-400' },
                    { label: 'Outreach Events', val: totals.events, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Funnel */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 mb-6">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-5">Outreach Conversion Funnel</p>
                <div className="space-y-4">
                    {funnelStages.map((s, i) => {
                        const pct = Math.round((s.count / maxFunnelCount) * 100);
                        return (
                            <div key={s.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-white/40 font-bold uppercase">{s.label}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-white">{s.count}</p>
                                    </div>
                                </div>
                                <div className="h-6 bg-white/5 rounded-lg overflow-hidden flex items-center">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.8 }}
                                        className="h-full rounded-r-lg"
                                        style={{ background: s.color, opacity: 0.9 }}
                                    >
                                        {pct > 5 && <span className="text-[8px] font-black text-black/50 ml-2">{pct}%</span>}
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {totals.reached === 0 && !loading && (
                    <p className="text-center text-white/20 text-xs mt-4">No outreach data available yet.</p>
                )}
            </div>

            {/* Monthly Trend */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">6-Month Trend</p>
                <div className="space-y-2">
                    {trendData.map((rowConfig: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {new Date(rowConfig.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] text-white/40 mt-1">{rowConfig.outreach_events} Events</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Reached</p>
                                    <p className="text-sm font-black text-blue-400">{rowConfig.people_reached || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saved</p>
                                    <p className="text-sm font-black text-emerald-400">{rowConfig.total_salvations || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {trendData.length === 0 && !loading && (
                        <div className="text-center text-white/20 text-xs py-4">No monthly records.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
