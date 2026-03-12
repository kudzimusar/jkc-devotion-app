"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { toast } from 'sonner';
import { AlertCircle, ArrowUpCircle, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';

export default function MinistryAnnouncementsPage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [composeTitle, setComposeTitle] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAnnouncements = async (sess: MinistrySession) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ministry_announcements')
            .select(`
                *,
                author:profiles(name)
            `)
            .or(`ministry_id.is.null,ministry_id.eq.${sess.ministryId}`)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) {
            console.error(error);
            toast.error("Failed to load announcements");
        } else {
            setAnnouncements(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            fetchAnnouncements(sess);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    const handleSendUpward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTitle || !composeBody || !session) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            
            const { error } = await supabase.from('ministry_announcements').insert({
                org_id: profile?.org_id,
                ministry_id: session.ministryId,
                author_id: user?.id,
                direction: 'upward',
                title: composeTitle,
                body: composeBody,
                priority: 'normal'
            });

            if (error) throw error;
            toast.success("Your message has been delivered to Mission Control.");
            setComposeTitle('');
            setComposeBody('');
            fetchAnnouncements(session);
        } catch (error: any) {
            toast.error(error.message || "Failed to send update");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !session) {
        return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[#080c14] text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-wide">{session.ministryName} Announcements</h1>
                        <p className="text-white/40 text-sm mt-1 font-medium uppercase tracking-widest">Two-way communication with Mission Control.</p>
                    </div>
                     <Link href={`/ministry-dashboard/${slug}`} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full bg-[#0d1421]">
                        ← Back to Ministry Hub
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Inbox */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h2 className="text-base font-black text-white tracking-wide mb-4 uppercase">Inbox</h2>
                        {announcements.filter(a => a.direction === 'downward' || a.direction === 'upward').length === 0 && !loading && (
                            <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-8 text-center text-white/30 text-sm font-medium">
                                No messages found.
                            </div>
                        )}
                        {announcements.map(a => (
                            <div key={a.id} className={`p-5 rounded-3xl border shadow-xl ${
                                a.direction === 'downward' 
                                    ? 'bg-violet-950/20 border-violet-500/30 border-l-4 border-l-violet-500' 
                                    : 'bg-[#0d1421] border-white/10'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {a.direction === 'downward' ? (
                                            <AlertCircle className="w-4 h-4 text-violet-400" />
                                        ) : (
                                            <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            a.direction === 'downward' ? 'text-violet-400' : 'text-emerald-400'
                                        }`}>
                                            {a.direction === 'downward' ? 'FROM LEADERSHIP' : 'MY UPDATE'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-medium">
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-base text-white">{a.title}</h3>
                                <p className="text-white/60 text-sm mt-2 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                                {a.author?.name && (
                                    <p className="text-xs text-white/30 mt-4 font-medium">— {a.author.name}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Compose Upward */}
                    {MinistryAuth.can(session.ministryRole, 'assistant') && (
                        <div className="col-span-1">
                            <form onSubmit={handleSendUpward} className="bg-[#0d1421] border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-6">
                                <h2 className="text-base font-black tracking-wide mb-5 flex items-center gap-2 text-white">
                                    <Send className="w-4 h-4 text-violet-400" /> Message Admin
                                </h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Subject"
                                        value={composeTitle}
                                        onChange={e => setComposeTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                                    />
                                    <textarea
                                        required
                                        placeholder="Type an update or request..."
                                        rows={5}
                                        value={composeBody}
                                        onChange={e => setComposeBody(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl px-4 py-3 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send to Admin'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
