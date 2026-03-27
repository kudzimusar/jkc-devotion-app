"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Binary, CheckCircle2, Loader2, Sparkles, 
    ArrowRight, Info, Mail, Zap, XCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIOnboardingStatusProps {
    orgId: string;
}

export function AIOnboardingStatus({ orgId }: AIOnboardingStatusProps) {
    const [status, setStatus] = useState<string | null>(null);
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        async function checkStatus() {
            const { data: intel } = await supabase
                .from('organization_intelligence')
                .select('*')
                .eq('org_id', orgId)
                .single();

            if (intel) {
                setStatus(intel.ai_provisioning_status);
                
                if (intel.ai_provisioning_status === 'completed') {
                    // Fetch the first insight
                    const { data: firstInsight } = await supabase
                        .from('prophetic_insights')
                        .select('*')
                        .eq('org_id', orgId)
                        .order('generated_at', { ascending: true })
                        .limit(1)
                        .single();
                    
                    setInsight(firstInsight);
                }
            }
            setLoading(false);
        }

        checkStatus();

        // Subscribe to changes
        const channel = supabase
            .channel('ai-status-changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'organization_intelligence', filter: `org_id=eq.${orgId}` },
                (payload) => {
                    setStatus(payload.new.ai_provisioning_status);
                    if (payload.new.ai_provisioning_status === 'completed') {
                        checkStatus(); // Re-fetch insight
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId]);

    const handleRetry = async () => {
        setLoading(true);
        try {
            // Re-fetch the record to get the latest context
            const { data: record } = await supabase
                .from('organization_intelligence')
                .select('*')
                .eq('org_id', orgId)
                .single();

            if (record) {
                // Call the edge function manually
                const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/provision-church-intelligence`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ record })
                });

                if (res.ok) {
                    setStatus('processing');
                }
            }
        } catch (e) {
            console.error('Retry failed:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !status || (status === 'completed' && !insight)) return null;

    if (status === 'completed') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                                        Prophetic Insight Layer Active
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-foreground mb-1">
                                    {insight.insight_title}
                                </h2>
                                <p className="text-muted-foreground text-sm max-w-2xl mb-4 italic">
                                    "{insight.insight_description}"
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                                        <ArrowRight className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground">
                                        ACTION: {insight.recommended_action}
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl h-14 px-8 shadow-xl shadow-indigo-600/20"
                                    onClick={() => window.location.href = '#ai-panel'}
                                >
                                    OPEN STRATEGY CENTER
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (status === 'failed') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
            >
                <Card className="bg-red-500/5 border-2 border-dashed border-red-500/20 rounded-[2rem] p-10">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center border border-red-500/20 mx-auto">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-foreground">
                                Provisioning Error
                            </h2>
                            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                                Our strategic engine encountered an issue while processing your church DNA. This is usually temporary and may be due to a transient API interruption.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleRetry}
                                className="bg-red-600 hover:bg-red-700 text-white font-black h-14 px-10 rounded-2xl shadow-xl shadow-red-600/20"
                            >
                                <Zap className="w-5 h-5 mr-3 fill-current" /> RETRY PROVISIONING
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
        >
            <Card className="bg-muted/30 border-dashed border-2 border-border rounded-[2rem] p-10">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center border border-border shadow-inner">
                            {status === 'processing' ? (
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            ) : (
                                <Binary className="w-12 h-12 text-muted-foreground/30" />
                            )}
                        </div>
                        {status === 'processing' && (
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <Zap className="w-4 h-4 text-white fill-current" />
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-foreground">
                            {status === 'processing' ? 'Calibrating Your Intelligence Layer' : 'AI Growth Provisioning Pending'}
                        </h2>
                        <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                            {status === 'processing' 
                                ? 'Our strategic engine is currently analyzing your church context and theological DNA to generate your first growth blueprint.' 
                                : 'Your organization is in queue for AI provisioning. This typically takes less than 5 minutes to initialize.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg"><Sparkles className="w-4 h-4 text-indigo-400" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calibration</p>
                            </div>
                            <p className="text-xs font-bold text-foreground">Theological DNA Analysis</p>
                            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ width: status === 'processing' ? '60%' : '10%' }}
                                    className="h-full bg-indigo-500" 
                                />
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-pink-500/10 rounded-lg"><Binary className="w-4 h-4 text-pink-400" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Insights</p>
                            </div>
                            <p className="text-xs font-bold text-foreground">First Prophetic Blueprint</p>
                            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ width: status === 'processing' ? '30%' : '0%' }}
                                    className="h-full bg-pink-500" 
                                />
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg"><Mail className="w-4 h-4 text-emerald-400" /></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notification</p>
                            </div>
                            <p className="text-xs font-bold text-foreground">Strategy Delivery via Brevo</p>
                            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-0" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <Info className="w-3 h-3" /> System status: {status.toUpperCase()}
                        </p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
