"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Music, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAdminCtx } from "../layout";

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
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        const load = async () => {
            const [rolesRes, skillsRes] = await Promise.all([
                supabaseAdmin.from('ministry_members').select('*').eq('org_id', orgId).eq('is_active', true),
                supabaseAdmin.from('member_skills').select('*, profiles(name, avatar_url, org_id)')
            ]);
            
            // Filter skills/candidates by org_id (since profiles join might not filter outer query)
            const filteredCandidates = (skillsRes.data || []).filter((s: any) => s.profiles?.org_id === orgId);
            
            setMembers(rolesRes.data || []);
            setCandidates(filteredCandidates);
            setLoading(false);
        };
        load();
    }, [orgId]);

    // Group by ministry
    const byMinistry = members.reduce((acc: Record<string, any[]>, m) => {
        if (!acc[m.ministry_name]) acc[m.ministry_name] = [];
        acc[m.ministry_name].push(m);
        return acc;
    }, {});
    const ministryList = Object.entries(byMinistry).map(([name, mems]) => ({ name, count: mems.length, members: mems }));
    const chartData = ministryList.map(m => ({ name: m.name, count: m.count })).sort((a, b) => b.count - a.count);

    const STAFFING_GAPS = ['childrens', 'counseling', 'missions'];

    const handleInvite = async (candidate: any, ministryName: string) => {
        try {
            const { error } = await supabaseAdmin.from('ministry_members').insert({
                user_id: candidate.user_id,
                org_id: orgId,
                ministry_name: ministryName,
                ministry_role: 'member',
                is_active: true
            });
            if (error) throw error;
            // Optionally update state to show "Invited"
            alert(`Invitation sent to ${candidate.profiles?.name} for ${ministryName}`);
        } catch (e) {
            console.error("Invite Error:", e);
        }
    };

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
                {/* Candidates Search & Match (NEW) */}
                <div className="mt-8 border-t border-white/5 pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-violet-400">Candidate Matching</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Intelligent placement based on member skills</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] font-black">AI OPTIMIZED</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {['Youth Ministry', 'Worship', 'Media', 'Counseling'].map(min => {
                            const minCandidates = candidates.filter(c => {
                                const skill = c.skill_name.toLowerCase();
                                if (min === 'Worship' && (skill.includes('music') || skill.includes('sing') || skill.includes('choir'))) return true;
                                if (min === 'Youth Ministry' && (skill.includes('teach') || skill.includes('youth'))) return true;
                                if (min === 'Media' && (skill.includes('tech') || skill.includes('video') || skill.includes('edit'))) return true;
                                if (min === 'Counseling' && skill.includes('counsel')) return true;
                                return false;
                            });

                            return (
                                <div key={min} className="bg-[#111827] border border-white/5 rounded-3xl p-6 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-black text-white/60 uppercase">{min}</p>
                                        <span className="text-[10px] text-white/30 font-bold">{minCandidates.length} matches</span>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        {minCandidates.length > 0 ? minCandidates.slice(0, 3).map(c => (
                                            <div key={c.id} className="flex items-center justify-between bg-white/3 p-3 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-[10px] font-black text-violet-400">
                                                        {c.profiles?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{c.profiles?.name}</p>
                                                        <p className="text-[9px] text-white/30 truncate max-w-[100px]">{c.skill_name} · {c.skill_level}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleInvite(c, min)}
                                                    className="p-2 bg-violet-500/10 text-violet-400 rounded-xl hover:bg-violet-500/20 transition-colors"
                                                >
                                                    <Users className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="h-20 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-[10px] text-white/20 font-bold uppercase">
                                                No Candidates
                                            </div>
                                        )}
                                    </div>
                                    {minCandidates.length > 3 && (
                                        <button className="mt-4 text-[9px] font-black text-violet-400 uppercase tracking-widest hover:text-white transition-colors">
                                            + {minCandidates.length - 3} more candidates
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
