"use client";

import { useState } from "react";
import {
    Users, UserPlus, Baby, ClipboardCheck,
    ChevronRight, Save, X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UsherReportModalProps {
    registeredCount: number;
    onReportSubmitted?: () => void;
}

export function UsherReportModal({ registeredCount, onReportSubmitted }: UsherReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        service_type: "Sunday Service",
        adults_count: 0,
        children_count: 0,
        first_timers_count: 0,
        returning_visitors_count: 0,
        notes: ""
    });

    const totalManual = formData.adults_count + formData.children_count;
    const gap = totalManual - registeredCount;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Get user org_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
            const org_id = profile?.org_id;

            const { error } = await supabase.from('ministry_reports').insert([{
                org_id,
                ministry_name: "Ushers",
                report_date: new Date().toISOString().split('T')[0],
                submitted_by: user.id as any,
                metrics: {
                    ...formData,
                    total: totalManual,
                    adults: formData.adults_count,
                    children: formData.children_count,
                    first_timers: formData.first_timers_count,
                    returning: formData.returning_visitors_count
                },
                summary: `Sunday Service Report: ${totalManual} total headcount.`
            }]);

            if (error) throw error;

            toast.success("Ministry report submitted successfully!");
            setOpen(false);
            onReportSubmitted?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit report");
        } finally {
            setLoading(false);
        }
    };

    const increment = (field: keyof typeof formData) => {
        if (typeof formData[field] === 'number') {
            setFormData(prev => ({ ...prev, [field]: (prev[field] as number) + 1 }));
        }
    };

    const decrement = (field: keyof typeof formData) => {
        if (typeof formData[field] === 'number' && (formData[field] as number) > 0) {
            setFormData(prev => ({ ...prev, [field]: (prev[field] as number) - 1 }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl h-12 px-6 shadow-lg shadow-violet-500/20">
                    <ClipboardCheck className="w-4 h-4 mr-2" /> SUBMIT USHER REPORT
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-md rounded-3xl p-0 overflow-hidden shadow-2xl transition-colors">
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Sunday Service Report</DialogTitle>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Manual Headcount & Visitor Tracking</p>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Quick Counter Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <Counter
                            label="Adults"
                            icon={Users}
                            value={formData.adults_count}
                            onInc={() => increment('adults_count')}
                            onDec={() => decrement('adults_count')}
                        />
                        <Counter
                            label="Children"
                            icon={Baby}
                            value={formData.children_count}
                            onInc={() => increment('children_count')}
                            onDec={() => decrement('children_count')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Counter
                            label="First-Timers"
                            icon={UserPlus}
                            value={formData.first_timers_count}
                            onInc={() => increment('first_timers_count')}
                            onDec={() => decrement('first_timers_count')}
                            accent="emerald"
                        />
                        <Counter
                            label="Returning"
                            icon={Users}
                            value={formData.returning_visitors_count}
                            onInc={() => increment('returning_visitors_count')}
                            onDec={() => decrement('returning_visitors_count')}
                            accent="blue"
                        />
                    </div>

                    {/* Reconciliation Stats */}
                    <div className="bg-muted border border-border rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Reconciliation Intelligence</p>
                            {gap > 0 ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black">+{gap} UNREGISTERED</span>
                            ) : gap < 0 ? (
                                <span className="text-[10px] bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black">{gap} DISCREPANCY</span>
                            ) : (
                                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-black">MATCHED</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <MiniStat label="Digital" val={registeredCount} />
                            <MiniStat label="Manual" val={totalManual} accent="text-primary" />
                            <MiniStat label="Visitors" val={formData.first_timers_count} accent="text-emerald-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-60">Service Notes</p>
                        <Input
                            placeholder="e.g. Higher impact during altar call..."
                            className="bg-muted border-border text-sm h-12 rounded-xl text-foreground placeholder:text-muted-foreground/40"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-black rounded-2xl text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                    >
                        {loading ? "Submitting..." : "SUBMIT MINISTRY REPORT"}
                        <Save className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Counter({ label, value, onInc, onDec, icon: Icon, accent = "primary" }: any) {
    const colors: any = {
        primary: "bg-primary/10 text-primary border-primary/20",
        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };

    return (
        <div className={`p-4 rounded-2xl border ${colors[accent]} flex flex-col items-center gap-3`}>
            <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onDec} className="w-8 h-8 rounded-full bg-foreground/5 dark:bg-white/5 flex items-center justify-center font-black text-lg hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors text-foreground">-</button>
                <span className="text-2xl font-black text-foreground w-8 text-center">{value}</span>
                <button onClick={onInc} className="w-8 h-8 rounded-full bg-foreground/5 dark:bg-white/5 flex items-center justify-center font-black text-lg hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors text-foreground">+</button>
            </div>
        </div>
    );
}

function MiniStat({ label, val, accent = "text-foreground" }: any) {
    return (
        <div className="text-center">
            <p className="text-[9px] text-muted-foreground/40 font-bold uppercase">{label}</p>
            <p className={`text-sm font-black ${accent}`}>{val}</p>
        </div>
    );
}
