'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Send, Plus, Trash2, Globe, Sparkles,
    TrendingUp, Trophy, Activity, FileText,
    ChevronRight, X, Loader2, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminCtx } from '../layout';

export default function NewsletterManager() {
    const [newsletters, setNewsletters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { orgId } = useAdminCtx();

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        salvations: 0,
        growth: 0,
        mission_progress: 0,
        is_published: true
    });

    const [feedData, setFeedData] = useState({
        feed_type: 'church_announcement',
        title: '',
        body: '',
        cta_text: '',
        cta_url: '',
        expires_at: ''
    });
    const [isPostingFeed, setIsPostingFeed] = useState(false);

    const fetchNewsletters = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('newsletters')
                .select('*')
                .eq('org_id', orgId)
                .order('published_at', { ascending: false });
            setNewsletters(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) fetchNewsletters();
    }, [orgId]);

    const handleCreate = async () => {
        if (!formData.title || !formData.message) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('newsletters').insert({
                org_id: orgId,
                title: formData.title,
                content: {
                    message: formData.message,
                    impact_metrics: {
                        salvations: Number(formData.salvations),
                        growth: Number(formData.growth),
                        mission_progress: Number(formData.mission_progress)
                    }
                },
                author_id: user.id,
                is_published: formData.is_published
            });

            if (error) throw error;
            toast.success("Newsletter published and metrics synchronized!");
            setIsCreating(false);
            setFormData({ title: '', message: '', salvations: 0, growth: 0, mission_progress: 0, is_published: true });
            fetchNewsletters();
        } catch (e) {
            console.error(e);
            toast.error("Failed to publish newsletter");
        }
    };

    const handlePostFeed = async () => {
        if (!feedData.title || !feedData.body) {
            toast.error("Please fill in required feed fields");
            return;
        }

        setIsPostingFeed(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();
            
            if (!orgId) throw new Error("No organization ID found");

            const { error } = await supabase.from('news_feed').insert({
                org_id: orgId,
                feed_type: feedData.feed_type,
                title: feedData.title,
                body: feedData.body,
                cta_text: feedData.cta_text || null,
                cta_url: feedData.cta_url || null,
                expires_at: feedData.expires_at || null,
                published_at: new Date().toISOString()
            });

            if (error) throw error;
            toast.success("Posted to member feed.");
            setFeedData({
                feed_type: 'church_announcement',
                title: '',
                body: '',
                cta_text: '',
                cta_url: '',
                expires_at: ''
            });
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to post to feed");
        } finally {
            setIsPostingFeed(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this newsletter?")) return;
        try {
            const { error } = await supabase.from('newsletters').delete().eq('id', id);
            if (error) throw error;
            toast.success("Newsletter deleted");
            fetchNewsletters();
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground dark:text-white tracking-tighter uppercase transition-colors">Newsletters</h1>
                    <p className="text-foreground/40 dark:text-white/40 font-medium tracking-wide transition-colors">Publish weekly victories and strategic metrics to the congregation.</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-violet-600/20"
                >
                    <Plus className="w-5 h-5" /> Create Weekly Update
                </Button>
            </header>

            {/* Member Feed Post Section */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Post to Member Feed</h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Appears on /welcome for logged-in members</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Feed Type</label>
                            <select 
                                value={feedData.feed_type}
                                onChange={e => setFeedData({ ...feedData, feed_type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-sm text-white focus:border-violet-500 outline-none transition-colors"
                            >
                                <option value="church_announcement">Church Announcement</option>
                                <option value="event_notification">Event Notification</option>
                                <option value="growth_nudge">Growth Nudge</option>
                                <option value="ministry_invitation">Ministry Invitation</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Title *</label>
                            <Input
                                placeholder="e.g. Prayer Night this Friday"
                                value={feedData.title}
                                onChange={e => setFeedData({ ...feedData, title: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Message *</label>
                            <Textarea
                                placeholder="What's happening?"
                                value={feedData.body}
                                onChange={e => setFeedData({ ...feedData, body: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">CTA Text</label>
                                <Input
                                    placeholder="e.g. LEARN MORE"
                                    value={feedData.cta_text}
                                    onChange={e => setFeedData({ ...feedData, cta_text: e.target.value })}
                                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">CTA URL</label>
                                <Input
                                    placeholder="https://..."
                                    value={feedData.cta_url}
                                    onChange={e => setFeedData({ ...feedData, cta_url: e.target.value })}
                                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Expires At (Optional)</label>
                            <Input
                                type="date"
                                value={feedData.expires_at}
                                onChange={e => setFeedData({ ...feedData, expires_at: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                            />
                        </div>
                        <div className="pt-2">
                            <Button 
                                onClick={handlePostFeed}
                                disabled={isPostingFeed}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-14 rounded-2xl text-sm shadow-xl shadow-violet-600/20"
                            >
                                {isPostingFeed ? "POSTING..." : "POST TO MEMBER FEED"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="bg-card dark:bg-[#111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -z-10" />

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-foreground dark:text-white uppercase tracking-tight flex items-center gap-2 transition-colors">
                                <Sparkles className="w-5 h-5 text-violet-400" /> New Weekly Victory
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="text-foreground/30 dark:text-white/30 hover:text-foreground dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-foreground/40 dark:text-white/40 uppercase tracking-widest ml-1 mb-1 block transition-colors">Title / Theme</label>
                                    <Input
                                        placeholder="e.g., The Wind of Grace: Week 24"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="bg-foreground/5 dark:bg-white/5 border-border dark:border-white/10 rounded-xl h-12 text-foreground dark:text-white placeholder:text-foreground/20 dark:placeholder:text-white/20 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-foreground/40 dark:text-white/40 uppercase tracking-widest ml-1 mb-1 block transition-colors">Message to Congregation</label>
                                    <Textarea
                                        placeholder="Share the word, the vision, and the thanks..."
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        className="bg-foreground/5 dark:bg-white/5 border-border dark:border-white/10 rounded-2xl min-h-[200px] text-foreground dark:text-white placeholder:text-foreground/20 dark:placeholder:text-white/20 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                                <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest">Impact Metrics (Numerical Victories)</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                                            <label className="text-[10px] font-black text-foreground/40 dark:text-white/40 uppercase transition-colors">Salvations This Quarter</label>
                                        </div>
                                        <Input
                                            type="number"
                                            value={formData.salvations}
                                            onChange={e => setFormData({ ...formData, salvations: parseInt(e.target.value) })}
                                            className="bg-background/40 dark:bg-black/40 border-border dark:border-white/5 rounded-xl h-10 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                                            <label className="text-[10px] font-black text-white/40 uppercase">New Members (Growth)</label>
                                        </div>
                                        <Input
                                            type="number"
                                            value={formData.growth}
                                            onChange={e => setFormData({ ...formData, growth: parseInt(e.target.value) })}
                                            className="bg-black/40 border-white/5 rounded-xl h-10"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="w-3.5 h-3.5 text-blue-400" />
                                            <label className="text-[10px] font-black text-white/40 uppercase">Mission Progress %</label>
                                        </div>
                                        <Input
                                            type="number"
                                            value={formData.mission_progress}
                                            onChange={e => setFormData({ ...formData, mission_progress: parseInt(e.target.value) })}
                                            className="bg-black/40 border-white/5 rounded-xl h-10"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border dark:border-white/5 transition-colors">
                                    <Button onClick={handleCreate} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-14 rounded-2xl text-base shadow-xl">
                                        Publish To All Profiles
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Synchronizing Archives</p>
                </div>
            ) : newsletters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsletters.map(n => (
                        <Card key={n.id} className="bg-card dark:bg-white/5 border-border dark:border-white/10 rounded-[2rem] overflow-hidden group hover:bg-muted dark:hover:bg-white/10 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className="bg-violet-500/20 text-violet-400 border-0 uppercase font-black text-[9px] tracking-widest">
                                        Published: {new Date(n.published_at).toLocaleDateString()}
                                    </Badge>
                                    <button onClick={() => handleDelete(n.id)} className="text-foreground/20 dark:text-white/20 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <CardTitle className="text-foreground dark:text-white font-black uppercase tracking-tight leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{n.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-foreground/40 dark:text-white/40 line-clamp-3 font-medium leading-relaxed transition-colors">
                                    {n.content?.message}
                                </p>
                                <div className="flex items-center gap-4 pt-4 border-t border-border dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">+{n.content?.impact_metrics?.growth}</span>
                                        <span className="text-[8px] font-black text-foreground/20 dark:text-white/20 uppercase tracking-tighter">Growth</span>
                                    </div>
                                    <div className="flex flex-col border-l border-border dark:border-white/10 pl-4">
                                        <span className="text-[10px] font-black text-violet-400 uppercase">{n.content?.impact_metrics?.salvations}</span>
                                        <span className="text-[8px] font-black text-foreground/20 dark:text-white/20 uppercase tracking-tighter">Souls</span>
                                    </div>
                                    <div className="flex flex-col border-l border-border dark:border-white/10 pl-4">
                                        <span className="text-[10px] font-black text-blue-400 uppercase">{n.content?.impact_metrics?.mission_progress}%</span>
                                        <span className="text-[8px] font-black text-foreground/20 dark:text-white/20 uppercase tracking-tighter">Mission</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-40 bg-card dark:bg-white/5 rounded-[3rem] border border-dashed border-border dark:border-white/10 transition-colors">
                    <FileText className="w-12 h-12 text-foreground/10 dark:text-white/10 mx-auto mb-4" />
                    <p className="text-xs font-black text-foreground/30 dark:text-white/30 uppercase tracking-[0.3em]">No Newsletters Published Yet</p>
                </div>
            )}
        </div>
    );
}
