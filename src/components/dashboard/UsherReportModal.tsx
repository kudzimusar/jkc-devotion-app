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
            const { error } = await supabase.from('service_reports').insert([{
                ...formData,
                total_count: totalManual,
                report_date: new Date().toISOString().split('T')[0]
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
            <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-md rounded-3xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600/20 to-transparent p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Sunday Service Report</DialogTitle>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Manual Headcount & Visitor Tracking</p>
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
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black text-white/40 uppercase">Reconciliation Intelligence</p>
                            {gap > 0 ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black">+{gap} UNREGISTERED</span>
                            ) : gap < 0 ? (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-black">{gap} DISCREPANCY</span>
                            ) : (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black">MATCHED</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <MiniStat label="Digital" val={registeredCount} />
                            <MiniStat label="Manual" val={totalManual} accent="text-violet-400" />
                            <MiniStat label="Visitors" val={formData.first_timers_count} accent="text-emerald-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Service Notes</p>
                        <Input
                            placeholder="e.g. Higher impact during altar call..."
                            className="bg-white/5 border-white/10 text-sm h-12 rounded-xl"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-500 h-14 text-white font-black rounded-2xl text-lg shadow-xl shadow-violet-600/20 transition-all hover:scale-[1.02]"
                    >
                        {loading ? "Submitting..." : "SUBMIT MINISTRY REPORT"}
                        <Save className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Counter({ label, value, onInc, onDec, icon: Icon, accent = "violet" }: any) {
    const colors: any = {
        violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
        <div className={`p-4 rounded-2xl border ${colors[accent]} flex flex-col items-center gap-3`}>
            <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onDec} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-lg hover:bg-white/10 transition-colors">-</button>
                <span className="text-2xl font-black text-white w-8 text-center">{value}</span>
                <button onClick={onInc} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-lg hover:bg-white/10 transition-colors">+</button>
            </div>
        </div>
    );
}

function MiniStat({ label, val, accent = "text-white" }: any) {
    return (
        <div className="text-center">
            <p className="text-[9px] text-white/30 font-bold uppercase">{label}</p>
            <p className={`text-sm font-black ${accent}`}>{val}</p>
        </div>
    );
}
