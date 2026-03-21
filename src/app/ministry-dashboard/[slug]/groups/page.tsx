"use client";

import { useEffect, useState } from 'react';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import Link from 'next/link';
import { ChevronLeft, MessagesSquare, Users, MapPin, Calendar, Plus, Globe, Link as LinkIcon, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { toast } from 'sonner';
import { use } from 'react';

export default function MinistryGroupsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadGroups = async (sess: MinistrySession) => {
        setLoading(true);
        const { data } = await supabase
            .from('bible_study_groups')
            .select('*')
            .eq('org_id', sess.orgId)
            .order('name');
        setGroups(data || []);
        setLoading(false);
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/welcome/bible-study/join?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Invitation link copied!");
    };

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            loadGroups(sess);
        });
    }, [slug]);

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            <QuickActionModal 
                isOpen={isCreateModalOpen} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    loadGroups(session);
                }} 
                type="bible_study" 
            />

            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/ministry-dashboard/${slug}`} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest">{session.ministryName}</h1>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Bible Study Groups Management</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl gap-2"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Group
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="py-20 text-center">
                        <p className="text-white/20 text-xs font-bold uppercase animate-pulse">Loading groups...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((g, idx) => (
                            <motion.div
                                key={g.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#0d1421] border border-white/10 p-5 rounded-[2rem] hover:border-violet-500/30 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <MessagesSquare className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${g.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'}`}>
                                            {g.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-white/40 uppercase tracking-tighter">
                                            {g.meeting_type || 'In-Person'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">{g.name}</h3>
                                
                                <div className="space-y-2">
                                    {g.meeting_type === 'online' || g.meeting_type === 'hybrid' ? (
                                        <div className="flex items-center gap-2 group/link">
                                            <Globe className="w-3.5 h-3.5 text-violet-400/50" />
                                            <p className="text-[10px] text-violet-400 truncate font-medium">{g.meeting_link || 'Link missing'}</p>
                                        </div>
                                    ) : (
                                        g.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-white/20" />
                                                <p className="text-[10px] text-white/40 font-medium">{g.location}</p>
                                            </div>
                                        )
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-white/20" />
                                        <p className="text-[10px] text-white/40 font-medium capitalize">
                                            {g.meeting_day ? `${g.meeting_day}s` : 'Flexible'}
                                            {g.meeting_time && ` @ ${g.meeting_time}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-white/20" />
                                        <p className="text-[10px] text-white/40 font-medium">{g.member_count || 0} Members</p>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                                        {g.share_token ? 'Shareable' : 'Private'}
                                    </span>
                                    <div className="flex gap-2">
                                        {g.share_token && (
                                            <button 
                                                onClick={() => copyInviteLink(g.share_token)}
                                                className="h-8 px-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2 hover:bg-violet-500/20 transition-all text-[9px] font-black uppercase tracking-widest text-violet-400"
                                            >
                                                <LinkIcon className="w-3.5 h-3.5" />
                                                Copy Invite
                                            </button>
                                        )}
                                        <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/30 transition-all">
                                            <Users className="w-3.5 h-3.5 text-white/40" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {groups.length === 0 && !loading && (
                            <div className="col-span-full py-20 bg-[#0d1421] border border-dashed border-white/10 rounded-[2rem] text-center">
                                <Sparkles className="w-8 h-8 text-white/5 mx-auto mb-4" />
                                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No groups established yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
