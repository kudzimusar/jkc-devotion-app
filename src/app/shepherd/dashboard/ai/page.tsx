"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, CheckCircle2, RefreshCw, AlertTriangle, Info, Zap, XCircle, ThumbsUp, Brain, TrendingUp, ShieldAlert, Star, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

import { PILEngine } from "@/lib/pil-engine";
import { useAdminCtx } from "../Context";

const PRIORITY_CONFIG = {
    critical: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', dot: 'bg-red-600 dark:bg-red-400', badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
    high: { color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20', dot: 'bg-orange-600 dark:bg-orange-400', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' },
    warning: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', dot: 'bg-amber-600 dark:bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
    info: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/10', dot: 'bg-blue-600 dark:bg-blue-400', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' },
};

// Insight type → visual config
const INSIGHT_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    growth:       { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: TrendingUp, label: 'Growth' },
    risk:         { color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/30',     icon: ShieldAlert, label: 'Risk' },
    opportunity:  { color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/30',    icon: Sparkles,    label: 'Opportunity' },
    commendation: { color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/30',   icon: Star,        label: 'Commendation' },
    correlation:  { color: 'text-violet-700 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-violet-200 dark:border-violet-500/30',  icon: Link2,       label: 'Correlation' },
};

const URGENCY_CONFIG: Record<string, string> = {
    immediate:  'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    this_week:  'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    this_month: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    monitor:    'text-muted-foreground/30 bg-muted/50 border-border',
};

export default function AICommandCenterPage() {
    const { orgId } = useAdminCtx();
    const [insights, setInsights] = useState<any[]>([]);
    const [aiInsights, setAiInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(true);
    const [runningSweep, setRunningSweep] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    // Broadcast panel state
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    const loadInsights = async () => {
        if (!orgId) return;
        setLoading(true);
        const { data } = await supabase
            .from('prophetic_insights')
            .select('*')
            .eq('org_id', orgId)
            .order('generated_at', { ascending: false });
        
        const all = data || [];
        setInsights(all.filter(i => !i.metadata?.is_ai_generated));
        setAiInsights(all.filter(i => i.metadata?.is_ai_generated && !i.is_acknowledged));

        setLoading(false);
        setAiLoading(false);
    };

    const loadAiInsights = async () => {
        // Now unified into loadInsights
    };



    const runSweep = async () => {
        if (!orgId) return;
        setRunningSweep(true);
        try {
            await PILEngine.runIntelligenceSweep(orgId);
            await loadInsights();
            await loadAiInsights();
        } finally {
            setRunningSweep(false);
        }
    };

    useEffect(() => {
        if (orgId) {
            loadInsights();
            loadAiInsights();
        }
    }, [orgId]);

    const acknowledge = async (id: string) => {
        setAcknowledging(id);
        await supabase.from('prophetic_insights').update({ is_acknowledged: true }).eq('id', id);
        setInsights(prev => prev.map(i => i.id === id ? { ...i, is_acknowledged: true } : i));
        setAcknowledging(null);
    };

    const approveAiInsight = async (insight: any) => {
        setProcessing(insight.id);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Approve in prophetic_insights
        await supabase
            .from('prophetic_insights')
            .update({
                is_acknowledged: true,
                metadata: { ...insight.metadata, approved_by: user?.id, is_approved: true }
            })
            .eq('id', insight.id);

        // 2. If type is 'opportunity', create a member_feed_items row
        if (insight.insight_type === 'opportunity' && insight.subject_id) {
            const { data: ministry } = await supabase
                .from('ministries')
                .select('id, name, slug')
                .eq('id', insight.ministry_id)
                .single();

            await supabase.from('member_feed_items').insert({
                org_id: 'fa547adf-f820-412f-9458-d6bade11517d',
                target_user_id: insight.subject_id,
                feed_type: 'ministry_invitation',
                title: ministry
                    ? `You've been recommended for ${ministry.name}`
                    : 'You have a ministry opportunity',
                body: insight.insight_description || insight.insight_title,
                cta_text: 'View Ministry',
                cta_url: ministry ? `/ministry-dashboard/${ministry.slug}/` : '/ministry-dashboard/',
                is_visible: true,
                created_by: user?.id || null,
                published_at: new Date().toISOString(),
            });
        }

        setAiInsights(prev => prev.filter(i => i.id !== insight.id));
        setProcessing(null);
    };

    const dismissAiInsight = async (insight: any) => {
        setProcessing(insight.id);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
            .from('prophetic_insights')
            .update({
                is_acknowledged: true,
                metadata: { ...insight.metadata, dismissed_by: user?.id, is_approved: false }
            })
            .eq('id', insight.id);

        setAiInsights(prev => prev.filter(i => i.id !== insight.id));
        setProcessing(null);
    };

    const sendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastTitle || !broadcastBody) return;
        setBroadcasting(true);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('member_feed_items').insert({
            org_id: 'fa547adf-f820-412f-9458-d6bade11517d',
            feed_type: 'church_announcement',
            title: broadcastTitle,
            body: broadcastBody,
            is_visible: true,
            created_by: user?.id || null,
            published_at: new Date().toISOString(),
        });
        
        setBroadcastTitle('');
        setBroadcastBody('');
        setBroadcasting(false);
        alert('Broadcast sent to member feeds!');
    };

    const unacknowledged = insights.filter(i => !i.is_acknowledged);
    const acknowledged = insights.filter(i => i.is_acknowledged);
    const pendingAi = aiInsights.filter(i => !i.is_acknowledged);

    return (
        <div className="p-6 xl:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-foreground flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Prophetic Intelligence Layer
                        <Badge className="bg-primary/20 text-primary border-0 text-[10px] font-black uppercase tracking-tighter">BETA</Badge>
                    </h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{unacknowledged.length} rule-based forecasts · {pendingAi.length} AI insights pending review</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={runSweep} disabled={runningSweep}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-all font-bold">
                        <Zap className={`w-3.5 h-3.5 ${runningSweep ? 'animate-pulse' : ''}`} />
                        {runningSweep ? 'Scanning...' : 'Run Full Sweep'}
                    </button>
                    <button onClick={() => { loadInsights(); loadAiInsights(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* === AI MINISTRY INSIGHTS PANEL (Phase 3) === */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Gemini AI Ministry Insights</p>
                    <span className="text-[9px] text-muted-foreground/40 font-medium">— Approve or Dismiss each insight before it reaches ministry leaders</span>
                </div>

                {aiLoading ? (
                    <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground text-xs shadow-sm transition-colors">Loading AI insights...</div>
                ) : pendingAi.length === 0 ? (
                    <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm transition-colors">
                        <Brain className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                        <p className="text-muted-foreground text-xs">No pending AI insights. Run a sweep to generate new ones.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingAi.map(insight => {
                            const typeMeta = insight.category || 'correlation';
                            const cfg = INSIGHT_TYPE_CONFIG[typeMeta] || INSIGHT_TYPE_CONFIG.correlation;
                            const Icon = cfg.icon;
                            
                            const urgencyMeta = insight.metadata?.urgency || 'monitor';
                            const urgencyCfg = URGENCY_CONFIG[urgencyMeta] || URGENCY_CONFIG.monitor;
                            
                            const isOpen = expanded === insight.id;
                            const isProcessing = processing === insight.id;

                            return (
                                <motion.div key={insight.id} layout className={`border rounded-3xl overflow-hidden ${cfg.bg} ${cfg.border}`}>
                                    <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : insight.id)}>
                                        <div className={`w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-bold text-foreground">{insight.metadata?.summary || insight.insight_title}</p>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${urgencyCfg} uppercase tracking-widest`}>{urgencyMeta?.replace('_', ' ')}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{cfg.label} · {insight.metadata?.subject || 'Church Wide'} · {new Date(insight.generated_at || insight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="px-4 pb-4 space-y-3">
                                                {insight.insight_description && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight_description}</p>
                                                )}
                                                {insight.recommended_action && (
                                                    <div className={`p-3 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                                                        <p className={`text-[8px] font-black ${cfg.color} uppercase tracking-wider mb-1`}>Recommended Action</p>
                                                        <p className="text-xs text-foreground/80">{insight.recommended_action}</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 pt-1">
                                                    <button onClick={() => approveAiInsight(insight)} disabled={isProcessing}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                        {isProcessing ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button onClick={() => dismissAiInsight(insight)} disabled={isProcessing}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-black text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Rule-Based Forecasts', val: insights.length, color: 'text-primary' },
                    { label: 'Critical Risk', val: insights.filter(i => i.risk_level === 'critical').length, color: 'text-red-600 dark:text-red-400' },
                    { label: 'AI Pending Review', val: pendingAi.length, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Resolved', val: acknowledged.length, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm transition-colors">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* === BROADCAST PANEL (Phase 3) === */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-black text-foreground uppercase tracking-widest">Member Feed Broadcast</h2>
                </div>
                <p className="text-[10px] text-muted-foreground mb-4 pb-4 border-b border-border">Send manual nudges and announcements directly to member home feeds alongside automated AI insights.</p>
                
                <form onSubmit={sendBroadcast} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            placeholder="Announcement Title" 
                            value={broadcastTitle}
                            onChange={e => setBroadcastTitle(e.target.value)}
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50"
                            required
                        />
                    </div>
                    <div>
                        <textarea 
                            placeholder="Announcement message body..." 
                            value={broadcastBody}
                            onChange={e => setBroadcastBody(e.target.value)}
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 min-h-[100px]"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={broadcasting || !broadcastTitle || !broadcastBody}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-colors"
                        >
                            {broadcasting ? 'Sending...' : 'Publish to Feed'}
                            <Zap className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* === LEGACY: Rule-based Prophetic Insights === */}
            <div>
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest mb-3">Rule-Based Leadership Forecasts</p>
                <div className="space-y-2 mb-6">
                    {loading ? <div className="text-center py-12 text-white/30 text-xs">Loading PIL forecasts...</div> :
                        unacknowledged.map(insight => {
                            const cfg = PRIORITY_CONFIG[insight.risk_level as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.info;
                            const isOpen = expanded === insight.id;
                            return (
                                <motion.div key={insight.id} layout className={`border rounded-2xl overflow-hidden ${cfg.bg}`}>
                                    <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : insight.id)}>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${cfg.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-foreground">{insight.insight_title}</p>
                                                {insight.probability_score && (
                                                    <span className="text-[9px] font-black text-muted-foreground/60">{insight.probability_score}% Prob.</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{insight.category} · {new Date(insight.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase flex-shrink-0 ${cfg.badge}`}>{insight.risk_level}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="px-4 pb-4 space-y-3">
                                                <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight_description}</p>
                                                {insight.recommended_action && (
                                                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                        <p className="text-[8px] font-black text-primary/50 uppercase tracking-wider mb-1">Shepherd Strategy</p>
                                                        <p className="text-xs text-foreground/80">{insight.recommended_action}</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-3 pt-2">
                                                    <button onClick={() => acknowledge(insight.id)}
                                                        className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition-colors">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    }
                    {!loading && unacknowledged.length === 0 && (
                        <div className="text-center py-8 text-emerald-400/60 text-xs italic">All rule-based forecasts processed.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
