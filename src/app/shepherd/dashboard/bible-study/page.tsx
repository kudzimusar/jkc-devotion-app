"use client";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { 
    Users, MessagesSquare as MessageSquare, CheckCircle2, 
    BookOpen, Sparkles, Plus, Search, Filter, 
    ChevronRight, Calendar, User, Heart, MapPin, Globe, Link as LinkIcon
} from "lucide-react";
import { useAdminCtx } from "../Context";
import { QuickActionModal } from "@/components/dashboard/QuickActionModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { BibleStudyRequestsPanel } from "@/components/dashboard/BibleStudyRequestsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateBibleStudyGroupAction } from "@/app/actions/admin";
import Link from "next/link";
import { Power, Edit2, ExternalLink } from "lucide-react";

export default function BibleStudyPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [pendingCount, setPendingCount] = useState(0);

    const { orgId } = useAdminCtx();

    const fetchGroups = async () => {
        if (!orgId) return;
        setLoading(true);
        const { data } = await supabase.from('bible_study_groups')
            .select('*')
            .eq('org_id', orgId)
            .order('member_count', { ascending: false });
        
        setGroups(data || []); 
        setLoading(false); 
        
        // Fetch pending requests count
        const { count } = await supabase
            .from('bible_study_group_requests')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('status', 'pending');
        setPendingCount(count || 0);
    };

    const toggleGroupStatus = async (groupId: string, currentStatus: boolean) => {
        const confirmed = confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this circle?`);
        if (!confirmed) return;

        const res = await updateBibleStudyGroupAction(groupId, { is_active: !currentStatus });
        if (res.success) {
            toast.success(`Circle ${currentStatus ? 'deactivated' : 'reactivated'} successfully!`);
            fetchGroups();
        } else {
            toast.error("Error: " + res.error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [orgId]);

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/groups/join/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Invitation link copied to clipboard!");
    };

    const totalMembers = groups.reduce((a, g) => a + (g.member_count || 0), 0);

    return (
        <div className="p-6 xl:p-8 max-w-[1600px] mx-auto">
            <QuickActionModal 
                isOpen={isCreateModalOpen} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingGroup(null);
                    fetchGroups();
                }} 
                type="bible_study" 
                initialData={editingGroup}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Bible Study Command</h1>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Users className="w-3 h-3" /> {groups.length} active circles · {totalMembers} members enrolled
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setEditingGroup(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl gap-2 shadow-xl shadow-primary/20 px-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Initialize New Group
                </Button>
            </div>

            <Tabs defaultValue="groups" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50">
                    <TabsTrigger value="groups" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-card shadow-sm">
                        <Users className="w-4 h-4 mr-2" /> All Groups
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="relative rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-card shadow-sm">
                        <Sparkles className="w-4 h-4 mr-2" /> Pending Joins
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-background animate-pulse font-black">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="groups" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-center">
                        {[
                            { label: 'Network Reach', val: groups.filter(g => g.is_active).length, color: 'text-primary' },
                            { label: 'Active Disciples', val: totalMembers, color: 'text-violet-500' },
                            { label: 'Weekly Velocity', val: groups.filter(g => g.meeting_day).length, color: 'text-emerald-500' },
                        ].map(s => (
                            <div key={s.label} className="bg-card border border-border rounded-[32px] p-8 shadow-sm group hover:border-primary/20 transition-all">
                                <p className={`text-4xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-60">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {groups.map((g, i) => (
                            <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-card border-border hover:border-primary/30 border rounded-[32px] p-8 transition-all group relative overflow-hidden shadow-sm flex flex-col h-full">
                                
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                                
                                <div className="flex items-start justify-between mb-6 relative">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5 group-hover:bg-primary transition-all duration-300">
                                        <MessageSquare className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            {g.is_private && <span className="text-[9px] font-black px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/10">PRIVATE</span>}
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase border ${g.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-muted text-muted-foreground border-border'}`}>
                                                {g.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{g.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">{g.description || "Building community through scripture and connection."}</p>
                                    </div>

                                    <div className="space-y-3 py-4 border-y border-border/50">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                            <p className="text-xs font-bold text-foreground/70">
                                                {g.meeting_day ? `${g.meeting_day}s` : 'Flexible'} · {g.meeting_time || 'TBD'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                            <p className="text-xs font-bold text-foreground/70 truncate">{g.location || (g.meeting_link ? 'Online' : 'TBD')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-primary">
                                            <Users className="w-4 h-4 shrink-0" />
                                            <p className="text-xs font-black uppercase tracking-widest">{g.member_count || 0} Members <span className="text-muted-foreground/40 font-bold ml-1">/ {g.max_members || 50}</span></p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex items-center justify-between gap-3 relative">
                                    <div className="flex gap-2">
                                         <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => {
                                                 setEditingGroup(g);
                                                 setIsCreateModalOpen(true);
                                             }}
                                             className="h-10 w-10 p-0 rounded-xl bg-muted border border-border hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                                         >
                                             <Edit2 className="w-4 h-4" />
                                         </Button>
                                         <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => toggleGroupStatus(g.id, g.is_active)}
                                             className={`h-10 w-10 p-0 rounded-xl border transition-all ${g.is_active 
                                                 ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500' 
                                                 : 'bg-red-500/5 border-red-500/10 text-red-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-500'}`}
                                         >
                                             <Power className="w-4 h-4" />
                                         </Button>
                                         <Link href={`/groups/${g.id}`} target="_blank">
                                             <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 className="h-10 w-10 p-0 rounded-xl bg-muted border border-border hover:bg-violet-500/10 hover:border-violet-500/50 text-muted-foreground hover:text-violet-500 transition-all"
                                             >
                                                 <ExternalLink className="w-4 h-4" />
                                             </Button>
                                         </Link>
                                     </div>

                                    {g.share_token && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyInviteLink(g.share_token);
                                            }}
                                            className="h-10 px-5 text-[10px] font-black uppercase tracking-[0.1em] border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-xl gap-2 transition-all shadow-lg shadow-primary/5"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            Copy Link
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {!loading && groups.length === 0 && (
                            <div className="col-span-full bg-muted/20 border-2 border-dashed border-border rounded-[40px] py-32 text-center animate-pulse">
                                <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">No Circles Established</p>
                                <Button onClick={() => setIsCreateModalOpen(true)} variant="link" className="text-primary mt-2 uppercase text-[10px] font-black">Begin Study Ministry Now</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BibleStudyRequestsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
