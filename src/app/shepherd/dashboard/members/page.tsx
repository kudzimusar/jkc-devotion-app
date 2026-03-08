"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, UserCheck, UserX, ChevronRight, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toast } from "sonner";
import { saveAs } from 'file-saver';

interface Member {
    id: string; name: string; email: string;
    membership_status?: string; city?: string;
    gender?: string; phone?: string;
    date_joined_church?: string; baptism_status?: string;
    avatar_url?: string;
    skills_talents?: string[];
    milestones?: any;
    ministry_members?: any[];
    member_skills?: any[];
    org_members?: any;
    discipleship_score?: number;
    stage?: string;
    growth_stage?: string;
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
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        setLoading(true);
        // Using supabaseAdmin to ensure access to all member data regardless of RLS
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                *,
                milestones:member_milestones(*),
                ministry_members(*),
                member_skills(*),
                org_members(role, stage, discipleship_score, joined_at)
            `)
            .order('name');

        if (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to load members directory");
        } else {
            const processed = (data || []).map((m: any) => ({
                ...m,
                milestones: m.milestones?.[0] || {},
                org_members: m.org_members?.[0] || {},
                discipleship_score: m.org_members?.[0]?.discipleship_score || 0,
                growth_stage: m.growth_stage || m.org_members?.[0]?.stage || 'visitor'
            }));
            setMembers(processed);
        }
        setLoading(false);
    }

    const exportDirectory = () => {
        const headers = ["Name", "Email", "Status", "City", "Phone", "Baptized", "Joined Church"];
        const rows = filtered.map(m => [
            m.name,
            m.email,
            m.membership_status || 'visitor',
            m.city || '-',
            m.phone || '-',
            m.baptism_status || 'no',
            m.date_joined_church || '-'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `JKC_Member_Directory_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success("Directory exported successfully!");
    };

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
                    <Button onClick={exportDirectory} variant="outline" className="h-9 px-4 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white">
                        Export CSV
                    </Button>
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
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg capitalize ${BADGE_COLORS[m.growth_stage || 'visitor'] || 'bg-white/10 text-white/40'}`}>
                                    {m.growth_stage || 'visitor'}
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
                                <button
                                    onClick={() => setSelectedMember(m)}
                                    className="text-[9px] font-black text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-0.5"
                                >
                                    View <ChevronRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                    >
                        <div className="p-8 border-b border-white/5 flex items-start justify-between bg-gradient-to-br from-violet-600/10 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-violet-500/20 flex items-center justify-center text-3xl font-black text-violet-400 border border-violet-500/20">
                                    {selectedMember.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter">{selectedMember.name}</h2>
                                    <div className="flex gap-2 mt-2">
                                        <Badge className={`${BADGE_COLORS[selectedMember.membership_status || 'visitor'] || 'bg-white/10 text-white/40'} border-0 font-black px-3 py-1`}>
                                            {selectedMember.membership_status?.toUpperCase() || 'VISITOR'}
                                        </Badge>
                                        <Badge className="bg-white/5 text-white/40 border-0 font-black px-3 py-1">
                                            {selectedMember.city || 'LOCATION UNKNOWN'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors">
                                <UserX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</p>
                                    <p className="text-sm font-bold text-white/80">{selectedMember.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</p>
                                    <p className="text-sm font-bold text-white/80">{selectedMember.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Spiritual Milestones</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Salvation', val: selectedMember.milestones?.salvation_date },
                                        { label: 'Baptism', val: selectedMember.milestones?.baptism_date },
                                        { label: 'Membership', val: selectedMember.milestones?.membership_date },
                                        { label: 'Foundation', val: selectedMember.milestones?.foundation_class_date }
                                    ].map(m => (
                                        <div key={m.label} className={`p-4 rounded-2xl border ${m.val ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/2 border-white/5 opacity-50'}`}>
                                            <p className="text-[10px] font-black uppercase text-white/30">{m.label}</p>
                                            <p className={`text-sm font-bold mt-0.5 ${m.val ? 'text-emerald-400' : 'text-white/20'}`}>
                                                {m.val ? new Date(m.val).toLocaleDateString() : 'Pending'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedMember.ministry_members && selectedMember.ministry_members.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Ministry Involvement</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.ministry_members.map(m => (
                                            <Badge key={m.id} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-4 py-1.5 rounded-xl font-bold">
                                                {m.ministry_name} • {m.ministry_role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedMember.member_skills?.length || 0) > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Skills & Assets</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.member_skills?.map(s => (
                                            <Badge key={s.id} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-1.5 rounded-xl font-bold">
                                                {s.skill_name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Pastor's Intel</h4>
                                <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Growth Stage</p>
                                            <p className="text-sm font-black text-white uppercase mt-1">{selectedMember.growth_stage || 'Visitor'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Discipleship Score</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-violet-500" style={{ width: `${selectedMember.discipleship_score || 0}%` }} />
                                                </div>
                                                <span className="text-xs font-black text-violet-400">{selectedMember.discipleship_score || 0}/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 bg-white/2 flex gap-3">
                            <Button
                                onClick={() => window.print()}
                                className="flex-1 h-14 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border-white/10 shadow-lg"
                            >
                                Print Profile
                            </Button>
                            <Button className="flex-1 h-14 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl border-0 shadow-lg shadow-violet-600/20">
                                Send Message
                            </Button>
                            <Button variant="outline" className="flex-1 h-14 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl">
                                Assign to Ministry
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .fixed.inset-0.z-50 {
                        position: static !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    header, aside, .p-8.border-t, button, .flex.items-center.justify-between.mb-6, .grid.grid-cols-4.gap-3.mb-6, .mb-6 {
                        display: none !important;
                    }
                    .bg-[#0f172a] {
                        background: white !important;
                        color: black !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .text-white { color: black !important; }
                    .text-white\/20, .text-white\/30, .text-white\/40 { color: #666 !important; }
                    .bg-white\/5, .bg-white\/2, .bg-black\/20 { background: #f5f5f5 !important; }
                    .border-white\/5, .border-white\/10 { border-color: #eee !important; }
                    h2, h3, h4 { color: black !important; }
                    .text-violet-400 { color: #7c3aed !important; }
                    .bg-violet-600\/10 { background: #f5f3ff !important; }
                }
            `}</style>
        </div>
    );
}
