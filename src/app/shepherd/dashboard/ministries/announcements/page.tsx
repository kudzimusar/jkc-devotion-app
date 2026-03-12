"use client";

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { toast } from 'sonner';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MissionControlAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [ministries, setMinistries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [composeTitle, setComposeTitle] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const replyTo = (announcement: any) => {
        setSelectedMinistryId(announcement.ministry_id);
        setComposeTitle(`RE: ${announcement.title}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchAnnouncements = async (orgId: string) => {
        setLoading(true);
        const { data, error } = await supabaseAdmin
            .from('ministry_announcements')
            .select(`
                *,
                ministries(name),
                author:profiles(name)
            `)
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (!error && data) {
            setAnnouncements(data);
        } else {
            toast.error("Failed to load announcements");
        }
        setLoading(false);
    };

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
        if (!profile?.org_id) return;

        const { data: mData } = await supabaseAdmin.from('ministries').select('*').eq('org_id', profile.org_id);
        if (mData) setMinistries(mData);

        fetchAnnouncements(profile.org_id);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSendDownward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTitle || !composeBody) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            
            const { error } = await supabaseAdmin.from('ministry_announcements').insert({
                org_id: profile?.org_id,
                ministry_id: selectedMinistryId, // null means broadcast
                author_id: user?.id,
                direction: 'downward',
                title: composeTitle,
                body: composeBody,
                priority: 'normal'
            });

            if (error) throw error;
            toast.success("Announcement broadcasted");
            setComposeTitle('');
            setComposeBody('');
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to broadcast");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && announcements.length === 0) {
        return <div className="p-8 text-neutral-400">Loading Intelligence Comms...</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen">
            <header>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Ministry Comm Lines</h1>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mt-2">Mission Control &harr; Distributed Ministries</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Inbox */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Comm Feed</h2>
                    
                    {announcements.length === 0 && !loading && (
                        <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 text-center text-white/30 text-xs uppercase tracking-widest font-black">
                            No active comms.
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {announcements.map(a => (
                            <div key={a.id} className={`p-6 rounded-2xl border ${
                                a.direction === 'upward' 
                                    ? 'bg-emerald-950/10 border-emerald-500/20' 
                                    : 'bg-[#111827] border-white/5'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {a.direction === 'upward' ? (
                                            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <ArrowDownCircle className="w-5 h-5 text-indigo-400" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            a.direction === 'upward' ? 'text-emerald-400' : 'text-indigo-400'
                                        }`}>
                                            {a.direction === 'upward' ? 'INCOMING UPDATE' : 'OUTBOUND COMM'}
                                        </span>
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2 px-2 py-0.5 rounded bg-white/5">
                                            {a.ministries ? a.ministries.name : 'BROADCAST TO ALL'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white mb-2">{a.title}</h3>
                                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                {a.author?.name && (
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-4">Transmitted by {a.author.name}</p>
                                )}
                                {a.direction === 'upward' && (
                                    <button 
                                        onClick={() => replyTo(a)}
                                        className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        <Send className="w-3 h-3" /> Reply Downward
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compose Downward */}
                <div className="col-span-1">
                    <form onSubmit={handleSendDownward} className="bg-[#111827] border border-white/5 rounded-3xl p-6 sticky top-8">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Send className="w-4 h-4 text-indigo-400" /> Transmit Comm
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Target Ministry</label>
                                <select
                                    value={selectedMinistryId || ''}
                                    onChange={(e) => setSelectedMinistryId(e.target.value || null)}
                                    className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none appearance-none"
                                >
                                    <option value="" className="bg-[#111827]">ALL MINISTRIES (BROADCAST)</option>
                                    {ministries.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#111827]">{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief subject line"
                                    value={composeTitle}
                                    onChange={e => setComposeTitle(e.target.value)}
                                    className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Message Body</label>
                                <textarea
                                    required
                                    placeholder="Type your message..."
                                    rows={6}
                                    value={composeBody}
                                    onChange={e => setComposeBody(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? 'TRANSMITTING...' : 'INITIATE TRANSMISSION'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
