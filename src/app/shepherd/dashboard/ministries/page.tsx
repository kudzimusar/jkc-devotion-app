"use client";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";
import Link from "next/link";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Music, Users, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAdminCtx } from "../Context";

const MINISTRY_COLORS: Record<string, string> = {
    worship: '#8b5cf6', youth: '#06b6d4', childrens: '#f87171',
    intercessory: '#fbbf24', evangelism: '#34d399', media: '#60a5fa',
    choir: '#f472b6', ushers: '#a78bfa', counseling: '#fb923c', missions: '#4ade80',
    'language-school': '#3b82f6', 'kingdom-class': '#3b82f6'
};

const TOOLTIP_STYLE = {
    contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
    itemStyle: { color: 'var(--foreground)', fontSize: 11 },
    labelStyle: { color: 'var(--muted-foreground)', fontSize: 9 },
};

export default function MinistriesPage() {
    const [allMinistries, setAllMinistries] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [talentMatches, setTalentMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        const load = async () => {
            const [ministriesRes, rolesRes, skillsRes, talentRes] = await Promise.all([
                supabase.from('vw_ministry_hub').select('*').eq('org_id', orgId),
                supabase.from('ministry_members').select('*').eq('org_id', orgId).eq('is_active', true),
                supabase.from('member_skills').select('*, profiles(name, avatar_url, org_id)'),
                supabase.from('vw_ministry_talent_match').select('*').eq('org_id', orgId).limit(40)
            ]);

            const filteredCandidates = (skillsRes.data || []).filter((s: any) => s.profiles?.org_id === orgId);

            setAllMinistries(ministriesRes.data || []);
            setMembers(rolesRes.data || []);
            setCandidates(filteredCandidates);
            setTalentMatches(talentRes.data || []);
            setLoading(false);
        };
        load();
    }, [orgId]);

    // Build list including all ministries from the DB
    const ministryList = allMinistries.map((m: any) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        count: m.volunteer_count || 0,
        members: members.filter(mem => mem.ministry_id === m.id || mem.ministry_name === m.name)
    })).sort((a, b) => b.count - a.count);

    const chartData = ministryList.filter(m => m.count > 0).map(m => ({ name: m.name, count: m.count }));

    // Gaps are strictly defined as any ministry with less than 2 members.
    const staffingGaps = ministryList.filter(m => m.count < 2).map(m => m.name);

    const handleInvite = async (candidate: any, ministryName: string) => {
        try {
            const { error } = await supabase.from('ministry_members').insert({
                user_id: candidate.user_id,
                org_id: orgId,
                ministry_name: ministryName,
                ministry_role: 'member',
                is_active: true
            });
            if (error) throw error;
            alert(`Invitation sent to ${candidate.profiles?.name} for ${ministryName}`);
        } catch (e) {
            console.error("Invite Error:", e);
        }
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-foreground">Ministry Teams</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">{ministryList.length} active ministries · {members.length} team members</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Active Ministries', val: ministryList.length, color: 'text-primary' },
                    { label: 'Team Members', val: members.length, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Leaders', val: members.filter(m => m.is_leader).length, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Staffing Gaps', val: staffingGaps.length, color: 'text-red-600 dark:text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm transition-colors">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm transition-colors">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Ministry Participation</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} layout="vertical" barSize={12}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
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
                    const isGap = staffingGaps.includes(ministry.name);
                    return (
                        <Link key={ministry.name} href={ministry.slug === 'language-school' ? '/kingdom-class-control/' : `/ministry-dashboard/${ministry.slug || ministry.name.toLowerCase()}/`}>
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`bg-card border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 group cursor-pointer ${isGap ? 'border-red-500/20' : 'border-border'}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${MINISTRY_COLORS[ministry.name] || '#8b5cf6'}20` }}>
                                            <Music className="w-4 h-4" style={{ color: MINISTRY_COLORS[ministry.name] || '#8b5cf6' }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isGap && <span className="text-[8px] font-black bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md uppercase">Needs Team</span>}
                                        <ExternalLink className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <p className="text-sm font-black text-foreground capitalize group-hover:text-primary transition-colors">{ministry.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-[10px] text-muted-foreground/60">{ministry.count} volunteers · {isGap ? 'Critical' : 'Active'}</p>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
                {!loading && ministryList.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-muted-foreground/30 text-xs">
                        No ministry members found. Seed data from the admin console.
                    </div>
                )}
                {/* Talent Match — real data from vw_ministry_talent_match */}
                <div className="mt-8 border-t border-border pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-primary">Candidate Matching</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Intelligent placement based on member skills</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] font-black">AI OPTIMIZED</Badge>
                        </div>
                    </div>

                    {(() => {
                        // Group talent matches by ministry_name
                        const byMinistry: Record<string, any[]> = {};
                        for (const row of talentMatches) {
                            const key = row.ministry_name || 'Other';
                            if (!byMinistry[key]) byMinistry[key] = [];
                            byMinistry[key].push(row);
                        }
                        const ministryGroups = Object.entries(byMinistry);

                        if (ministryGroups.length === 0) {
                            return (
                                <div className="text-center py-10 text-[10px] text-muted-foreground/30 font-bold uppercase border-2 border-dashed border-border rounded-2xl">
                                    No talent matches found. Ensure vw_ministry_talent_match view exists.
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ministryGroups.map(([min, minCandidates]) => (
                                    <div key={min} className="bg-card border border-border rounded-3xl p-6 h-full flex flex-col shadow-sm transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs font-black text-muted-foreground uppercase">{min}</p>
                                            <span className="text-[10px] text-muted-foreground/40 font-bold">{minCandidates.length} matches</span>
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            {minCandidates.slice(0, 3).map((c: any) => (
                                                <div key={c.member_id + c.skill_name} className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                                            {c.member_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground">{c.member_name}</p>
                                                            <p className="text-[9px] text-muted-foreground truncate max-w-[100px]">{c.skill_level || 'Member'}</p>
                                                            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wide">
                                                                <CheckCircle2 className="w-2.5 h-2.5" /> {c.skill_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleInvite({ user_id: c.member_id, profiles: { name: c.member_name } }, min)}
                                                        className="p-2 bg-violet-500/10 text-violet-400 rounded-xl hover:bg-violet-500/20 transition-colors"
                                                    >
                                                        <Users className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {minCandidates.length > 3 && (
                                            <button className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest hover:text-foreground transition-colors">
                                                + {minCandidates.length - 3} more candidates
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
