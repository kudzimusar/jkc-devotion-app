"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { toast } from 'sonner';
import { AlertCircle, ArrowUpCircle, MessageCircle, Send, Paperclip, Eye, LayoutGrid, List, FileText } from 'lucide-react';
import Link from 'next/link';

export default function MinistryAnnouncementsPage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [composeTitle, setComposeTitle] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [announcementAttachments, setAnnouncementAttachments] = useState<Record<string, any[]>>({});

    const fetchAnnouncements = async (sess: MinistrySession) => {
        if (!sess?.ministryId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const { data, error } = await supabase
            .from('ministry_announcements')
            .select('id, title, body, direction, created_at, author_id')
            .eq('ministry_id', sess.ministryId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Announcements fetch error:', error);
            toast.error("Failed to load announcements");
        } else if (data) {
            setAnnouncements(data);
            
            // Fetch attachments for these announcements
            const { data: attachmentData } = await supabase
                .from('message_attachments')
                .select('*')
                .in('announcement_id', data.map(a => a.id));
            
            if (attachmentData) {
                const map: Record<string, any[]> = {};
                attachmentData.forEach(att => {
                    if (!map[att.announcement_id]) map[att.announcement_id] = [];
                    map[att.announcement_id].push(att);
                });
                setAnnouncementAttachments(map);
            }
        }
        setLoading(false);
    };

    const downloadAttachment = async (path: string, name: string) => {
        const { data, error } = await supabase.storage
            .from('ministry-attachments')
            .download(path);
        if (error) {
            toast.error("Failed to download attachment");
            return;
        }
        if (data) {
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
        }
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
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                toast.error("Session expired. Please refresh and try again.");
                setIsSubmitting(false);
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile?.org_id) {
                toast.error("Could not verify your organization. Please refresh.");
                setIsSubmitting(false);
                return;
            }

            const { data: inserted, error } = await supabase.from('ministry_announcements').insert({
                org_id: profile.org_id,
                ministry_id: session.ministryId,
                author_id: user.id,
                direction: 'upward',
                title: composeTitle,
                body: composeBody,
                priority: 'normal'
            }).select('id').single();

            if (error) throw error;

            // Handle file uploads
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const filePath = `${session.ministryId}/${Date.now()}-${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('ministry-attachments')
                        .upload(filePath, file);
                    
                    if (uploadError) {
                        toast.error(`Failed to upload ${file.name}`);
                        continue;
                    }

                    await supabase.from('message_attachments').insert({
                        announcement_id: inserted.id,
                        uploaded_by: user.id,
                        file_name: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        mime_type: file.type
                    });
                }
            }

            toast.success("Your message and attachments have been delivered.");
            setComposeTitle('');
            setComposeBody('');
            setAttachments([]);
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-white tracking-wide uppercase">Inbox</h2>
                            <div className="flex bg-[#0d1421] p-1 rounded-xl border border-white/10">
                                <button 
                                    onClick={() => setViewMode('card')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {announcements.length === 0 && !loading && (
                            <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-8 text-center text-white/30 text-sm font-medium">
                                No messages found.
                            </div>
                        )}

                        {viewMode === 'card' ? (
                            <div className="space-y-4">
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
                                        
                                        {announcementAttachments[a.id] && (
                                            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                                {announcementAttachments[a.id].map(att => (
                                                    <button 
                                                        key={att.id}
                                                        onClick={() => downloadAttachment(att.file_path, att.file_name)}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                                    >
                                                        <Paperclip className="w-3 h-3 text-violet-400" />
                                                        {att.file_name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0d1421] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                                {announcements.map((a, idx) => (
                                    <div key={a.id} className={`border-b border-white/5 last:border-0`}>
                                        <div 
                                            onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                                            className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${a.direction === 'downward' ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{a.title}</p>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                                                    {a.direction === 'downward' ? 'FROM LEADERSHIP' : 'MY UPDATE'} • {new Date(a.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Eye className={`w-4 h-4 transition-all ${expandedId === a.id ? 'text-violet-400' : 'text-white/20'}`} />
                                        </div>
                                        {expandedId === a.id && (
                                            <div className="px-6 pb-6 pt-2 bg-gradient-to-b from-white/5 to-transparent animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                                {announcementAttachments[a.id] && (
                                                    <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                                        {announcementAttachments[a.id].map(att => (
                                                            <button 
                                                                key={att.id}
                                                                onClick={() => downloadAttachment(att.file_path, att.file_name)}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                                            >
                                                                <Paperclip className="w-3 h-3 text-violet-400" />
                                                                {att.file_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                                                <Paperclip className="w-3 h-3" /> Attachments
                                            </label>
                                            {attachments.length > 0 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setAttachments([])}
                                                    className="text-[9px] font-bold text-red-400/50 hover:text-red-400 uppercase tracking-tighter"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf,.doc,.docx"
                                                onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-4 text-center group-hover:border-violet-500/50 transition-all">
                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                    {attachments.length > 0 
                                                        ? `${attachments.length} file(s) selected` 
                                                        : 'Click or drag files'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
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
