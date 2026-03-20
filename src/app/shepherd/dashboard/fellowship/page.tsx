"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { MessagesSquare, Users, MapPin, Calendar } from "lucide-react";
import { useAdminCtx } from "../layout";

export default function FellowshipPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        supabaseAdmin.from('fellowship_groups')
            .select('*')
            .eq('org_id', orgId)
            .order('member_count', { ascending: false })
            .then(({ data }) => { 
                setGroups(data || []); 
                setLoading(false); 
            });
    }, [orgId]);

    const totalMembers = groups.reduce((a, g) => a + (g.member_count || 0), 0);

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Fellowship Circles</h1>
                <p className="text-[11px] text-white/30 mt-0.5">{groups.length} active groups · {totalMembers} members in circles</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Active Groups', val: groups.filter(g => g.is_active).length, color: 'text-violet-400' },
                    { label: 'Total Members', val: totalMembers, color: 'text-blue-400' },
                    { label: 'Weekly Meetings', val: groups.filter(g => g.meeting_frequency === 'weekly').length, color: 'text-emerald-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map((g, i) => (
                    <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <MessagesSquare className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${g.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                                {g.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h3 className="text-sm font-black text-white mb-2">{g.name}</h3>
                        <div className="space-y-1.5">
                            {g.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />
                                    <p className="text-[10px] text-white/40">{g.location}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-white/30 flex-shrink-0" />
                                <p className="text-[10px] text-white/40 capitalize">{g.meeting_frequency || 'weekly'} meetings</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-white/30 flex-shrink-0" />
                                <p className="text-[10px] text-white/40">{g.member_count} members</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {!loading && groups.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-white/25 text-xs">No fellowship groups yet.</div>
                )}
            </div>
        </div>
    );
}
