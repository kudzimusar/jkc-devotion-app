"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, UserCheck, UserX, ChevronRight, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Member {
    id: string; name: string; email: string;
    membership_status?: string; city?: string;
    gender?: string; phone?: string;
    date_joined_church?: string; baptism_status?: string;
}

const BADGE_COLORS: Record<string, string> = {
    member: 'bg-emerald-500/20 text-emerald-400',
    visitor: 'bg-blue-500/20 text-blue-400',
    leader: 'bg-violet-500/20 text-violet-400',
    'not_baptized': 'bg-white/10 text-white/40',
    'baptized': 'bg-cyan-500/20 text-cyan-400',
};

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        supabase.from('profiles').select('*').order('name')
            .then(({ data }) => {
                setMembers(data || []);
                setLoading(false);
            });
    }, []);

    const filtered = members.filter(m => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
        const matchFilter = filter === 'all' || m.membership_status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">Member Directory</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">{members.length} registered members</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search members..."
                            className="h-9 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 w-52"
                        />
                    </div>
                    <select
                        value={filter} onChange={e => setFilter(e.target.value)}
                        className="h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="member">Members</option>
                        <option value="visitor">Visitors</option>
                        <option value="leader">Leaders</option>
                    </select>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Members', val: members.length, icon: Users, color: 'text-blue-400' },
                    { label: 'Active Members', val: members.filter(m => m.membership_status === 'member').length, icon: UserCheck, color: 'text-emerald-400' },
                    { label: 'Visitors', val: members.filter(m => m.membership_status === 'visitor' || !m.membership_status).length, icon: UserX, color: 'text-amber-400' },
                    { label: 'Baptized', val: members.filter(m => m.baptism_status === 'baptized').length, icon: UserCheck, color: 'text-cyan-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-white">{s.val}</p>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-wide">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Member table */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5">
                    {['Name', 'Email', 'Status', 'City', 'Joined', ''].map(h => (
                        <p key={h} className="text-[9px] font-black text-white/30 uppercase tracking-widest">{h}</p>
                    ))}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-white/30 text-xs">Loading members...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-white/30 text-xs">No members found</div>
                ) : (
                    <div className="divide-y divide-white/3">
                        {filtered.map((m, i) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors items-center"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-black text-violet-400 flex-shrink-0">
                                        {m.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <p className="text-xs font-bold text-white truncate">{m.name || 'Unknown'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="w-3 h-3 text-white/20 flex-shrink-0" />
                                    <p className="text-xs text-white/40 truncate">{m.email}</p>
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg capitalize ${BADGE_COLORS[m.membership_status || 'visitor'] || 'bg-white/10 text-white/40'}`}>
                                    {m.membership_status || 'visitor'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-white/20" />
                                    <p className="text-xs text-white/40 truncate">{m.city || '—'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-white/20" />
                                    <p className="text-[10px] text-white/40">
                                        {m.date_joined_church ? new Date(m.date_joined_church).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                                    </p>
                                </div>
                                <button className="text-[9px] font-black text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-0.5">
                                    View <ChevronRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
