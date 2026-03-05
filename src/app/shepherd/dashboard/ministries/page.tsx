"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { Music, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MINISTRY_COLORS: Record<string, string> = {
    worship: '#8b5cf6', youth: '#06b6d4', childrens: '#f87171',
    intercessory: '#fbbf24', evangelism: '#34d399', media: '#60a5fa',
    choir: '#f472b6', ushers: '#a78bfa', counseling: '#fb923c', missions: '#4ade80',
};

const TOOLTIP_STYLE = {
    contentStyle: { background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 },
    itemStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    labelStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
};

export default function MinistriesPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabaseAdmin.from('member_roles').select('*').eq('active_status', true)
            .then(({ data }) => { setMembers(data || []); setLoading(false); });
    }, []);

    // Group by ministry
    const byMinistry = members.reduce((acc: Record<string, any[]>, m) => {
        if (!acc[m.ministry_name]) acc[m.ministry_name] = [];
        acc[m.ministry_name].push(m);
        return acc;
    }, {});
    const ministryList = Object.entries(byMinistry).map(([name, mems]) => ({ name, count: mems.length, members: mems }));
    const chartData = ministryList.map(m => ({ name: m.name, count: m.count })).sort((a, b) => b.count - a.count);

    const STAFFING_GAPS = ['childrens', 'counseling', 'missions'];

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Ministry Teams</h1>
                <p className="text-[11px] text-white/30 mt-0.5">{ministryList.length} active ministries · {members.length} team members</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Active Ministries', val: ministryList.length, color: 'text-violet-400' },
                    { label: 'Team Members', val: members.length, color: 'text-blue-400' },
                    { label: 'Leaders', val: members.filter(m => m.is_leader).length, color: 'text-amber-400' },
                    { label: 'Staffing Gaps', val: STAFFING_GAPS.length, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 mb-4">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Ministry Participation</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} layout="vertical" barSize={12}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="count" name="Members" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={MINISTRY_COLORS[entry.name] || '#8b5cf6'} opacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Ministry Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {ministryList.map((ministry, i) => {
                    const isGap = STAFFING_GAPS.includes(ministry.name);
                    return (
                        <motion.div
                            key={ministry.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-[#111827] border rounded-2xl p-4 ${isGap ? 'border-red-500/20' : 'border-white/5'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${MINISTRY_COLORS[ministry.name]}20` }}>
                                    <Music className="w-4 h-4" style={{ color: MINISTRY_COLORS[ministry.name] || '#8b5cf6' }} />
                                </div>
                                {isGap && <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md uppercase">Needs Team</span>}
                            </div>
                            <p className="text-sm font-black text-white capitalize">{ministry.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Users className="w-3 h-3 text-white/30" />
                                <p className="text-[10px] text-white/40">{ministry.count} members · {ministry.members[0]?.role_title || 'Team'}</p>
                            </div>
                        </motion.div>
                    );
                })}
                {!loading && ministryList.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-white/25 text-xs">
                        No ministry members found. Seed data from the admin console.
                    </div>
                )}
            </div>
        </div>
    );
}
