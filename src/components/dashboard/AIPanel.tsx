"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { PILEngine } from "@/lib/pil-engine";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";
import { IntelligenceManualPanel } from "./IntelligenceManualPanel";

interface AiInsight {
    id: string;
    category: string;
    insight_title: string;
    insight_description: string;
    recommended_action: string;
    risk_level: string;
    generated_at: string;
}

const PRIORITY_CONFIG: Record<string, any> = {
    critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/5 dark:bg-red-500/10 border-red-500/10 dark:border-red-500/20', icon: AlertTriangle, dot: 'bg-red-500', label: 'CRITICAL' },
    high: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/5 dark:bg-red-500/10 border-red-500/10 dark:border-red-500/20', icon: AlertTriangle, dot: 'bg-red-500', label: 'CRITICAL' },
    warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 dark:border-amber-500/20', icon: TrendingUp, dot: 'bg-amber-500', label: 'ATTENTION' },
    medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 dark:border-amber-500/20', icon: TrendingUp, dot: 'bg-amber-500', label: 'ATTENTION' },
    info: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/20', icon: Zap, dot: 'bg-emerald-500', label: 'INSIGHT' },
    low: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/20', icon: Zap, dot: 'bg-emerald-500', label: 'INSIGHT' },
};

export function AIPanel({ insights: externalInsights }: { insights?: AiInsight[] }) {
    const { orgId } = useAdminCtx();
    const [insights, setInsights] = useState<AiInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [churchScore, setChurchScore] = useState<number | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (externalInsights && externalInsights.length > 0) {
            setInsights(externalInsights);
            setLoading(false);
        } else if (orgId && !hasFetched.current) {
            hasFetched.current = true;
            loadInsights();
        }
    }, [externalInsights, orgId]);

    async function loadInsights() {
        if (!orgId) return;
        setLoading(true);
        try {
            // 1. Run the PI Engine Sweep to refresh insights from real data
            await PILEngine.runIntelligenceSweep(orgId);
            
            // 2. Fetch the latest unacknowledged insights
            const { data } = await supabase
                .from('prophetic_insights')
                .select('*')
                .eq('org_id', orgId)
                .eq('is_acknowledged', false)
                .order('generated_at', { ascending: false })
                .limit(10);
            
            // 3. Try to load health score
            const { data: scoreData } = await supabase
                .from('church_health_metrics')
                .select('score')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (scoreData?.score) setChurchScore(scoreData.score);
            else setChurchScore(78); // Fallback if no metric row found

            if (data && data.length > 0) {
                setInsights(data);
            } else {
                setInsights([]); // No data = empty state
            }
        } catch (err) {
            console.error("AIPanel load error:", err);
            setInsights([]);
        } finally {
            setLoading(false);
        }
    }

    const criticalCount = insights.filter(i => i.risk_level === 'critical' || i.risk_level === 'high').length;

    return (
        <motion.aside
            animate={{ width: collapsed ? 20 : 320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
                "relative flex flex-col h-full bg-background border-l border-border transition-colors duration-500",
                collapsed ? "w-5 px-0" : "w-80"
            )}
        >
            {/* Toggle Button Handle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 -left-3 z-[100] flex items-center justify-center w-6 h-12 bg-card border border-border rounded-xl shadow-xl transition-all hover:bg-muted group",
                    collapsed && "left-0 translate-x-1"
                )}
                title={collapsed ? "Expand AI Shepherd" : "Collapse AI Shepherd"}
            >
                {collapsed ? (
                    <ChevronLeft className="w-4 h-4 text-violet-500 group-hover:scale-110" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-violet-500 group-hover:scale-110" />
                )}
            </button>

            {!collapsed && (
                <div className="flex flex-col h-full w-[320px] overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-foreground uppercase tracking-wide">AI Shepherd</p>
                                    <p className="text-[9px] text-muted-foreground">Daily Intelligence</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={loadInsights}>
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {/* Church Health Score */}
                        {churchScore !== null && (
                            <div className="bg-muted border border-border rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Church Health Score</p>
                                    {criticalCount > 0 && (
                                        <span className="text-[9px] font-black bg-red-500/20 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full">
                                            {criticalCount} ALERT{criticalCount > 1 ? 'S' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-violet-500 dark:text-violet-300">{churchScore}</span>
                                    <span className="text-sm font-bold text-muted-foreground mb-1">/ 100</span>
                                </div>
                                <div className="mt-2 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${churchScore}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        className={`h-full rounded-full ${churchScore >= 75 ? 'bg-emerald-500' : churchScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Insights List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1">Today's Insights</p>
                        <AnimatePresence>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                                ))
                            ) : insights.length === 0 ? (
                                <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl">
                                    <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest leading-loose">
                                        No new alerts recorded today.<br/>System at rest.
                                    </p>
                                </div>
                            ) : (
                                insights.map((insight, idx) => {
                                    const cfg = PRIORITY_CONFIG[insight.risk_level] || PRIORITY_CONFIG.info;
                                    const isExp = expanded === insight.id;
                                    return (
                                        <motion.div
                                            key={insight.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setExpanded(isExp ? null : insight.id)}
                                            className={cn(
                                                "border rounded-xl p-3 cursor-pointer transition-all hover:border-violet-500/30",
                                                cfg.bg
                                            )}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mt-1.5 flex-shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className={`text-[9px] font-black tracking-wider uppercase ${cfg.color}`}>{cfg.label}</p>
                                                        <ChevronRight className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                                                    </div>
                                                    <p className="text-xs font-semibold text-foreground mt-0.5 leading-tight">{insight.insight_title}</p>
                                                    <AnimatePresence>
                                                        {isExp && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{insight.insight_description}</p>
                                                                <div className="mt-2 pt-2 border-t border-border">
                                                                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-wider mb-1">Suggested Action</p>
                                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{insight.recommended_action}</p>
                                                                </div>
                                                                <div className="mt-2 text-[8px] text-muted-foreground/30 font-mono">
                                                                    Generated: {new Date(insight.generated_at).toLocaleString()}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-border flex-shrink-0 space-y-3">
                        <IntelligenceManualPanel />
                        <p className="text-[9px] text-muted-foreground text-center font-medium tracking-wider">
                            PIL-Layer Engine · Stable {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            )}
        </motion.aside>
    );
}
