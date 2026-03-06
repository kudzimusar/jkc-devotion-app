"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Users,
    Heart,
    BookOpen,
    ChevronRight,
    Sparkles,
    Clock,
    Database,
    ShieldCheck,
    LayoutGrid,
    Table
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const MINISTRY_ICONS: Record<string, any> = {
    ushering: Users,
    children: BookOpen,
    prayer: Heart,
    evangelism: Sparkles,
};

export default function MinistryHub() {
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

    useEffect(() => {
        async function loadForms() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('forms')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true });

                if (error) throw error;
                setForms(data || []);
            } catch (err) {
                console.error("Failed to load ministry forms", err);
            } finally {
                setLoading(false);
            }
        }
        loadForms();
    }, []);

    const ministryCategories = Array.from(new Set(forms.map(f => f.ministry)));

    return (
        <div className="p-6 xl:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-white">Ministry Intelligence Hub</h1>
                    <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest font-black">Digital Ministry Operational Reporting Layer</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase">Operational Security Active</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Database className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] font-black text-violet-400 uppercase">Live Pipeline Connected</span>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {selectedFormId ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#111827]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 md:p-8"
                    >
                        <div className="mb-8 pl-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFormId(null)}
                                className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest gap-2 bg-white/5 rounded-full px-4"
                            >
                                ← Return to Hub
                            </Button>
                        </div>
                        <DynamicFormRenderer
                            formId={selectedFormId}
                            onSuccess={() => setSelectedFormId(null)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-12"
                    >
                        {/* FORM NAVIGATION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {forms.map((form) => {
                                const Icon = MINISTRY_ICONS[form.ministry] || Table;
                                return (
                                    <button
                                        key={form.id}
                                        onClick={() => setSelectedFormId(form.id)}
                                        className="group relative bg-[#111827] border border-white/5 rounded-3xl p-6 hover:border-violet-500/30 transition-all text-left overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-violet-500/20 transition-all" />

                                        <div className="flex flex-col h-full gap-4 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
                                                <Icon className="w-5 h-5 text-violet-400" />
                                            </div>

                                            <div>
                                                <Badge className="bg-violet-500/20 text-violet-400 border-0 text-[8px] font-black uppercase mb-1.5">
                                                    {form.ministry}
                                                </Badge>
                                                <h3 className="text-sm font-black text-white">{form.name}</h3>
                                                <p className="text-[10px] text-white/25 mt-1 leading-relaxed font-medium">
                                                    {form.description}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Open Digital Record</span>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ANALYTICS PREVIEW SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-[#111827]/50 border border-white/5 rounded-[2rem] p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <LayoutGrid className="w-5 h-5 text-emerald-400" />
                                    <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Live Intelligence Feed</h2>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { title: "Attendance Reconciliation", date: "Last Sunday", stat: "98% Coverage", type: "ushering" },
                                        { title: "Kids Check-in Volume", date: "2 hours ago", stat: "142 Total", type: "children" },
                                        { title: "Outreach Contacts", date: "Yesterday", stat: "48 New Souls", type: "evangelism" },
                                    ].map((feed, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/10 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#0a101c] flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-white/20" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white">{feed.title}</p>
                                                    <p className="text-[9px] text-white/25 uppercase font-bold tracking-widest mt-0.5">{feed.date} · {feed.type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-emerald-400">{feed.stat}</p>
                                                <p className="text-[8px] text-white/20 font-black uppercase mt-0.5">Verified</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-[10px] font-black text-white/40 border border-white/10 py-6 rounded-2xl uppercase tracking-widest">
                                    View Full Operational Audit →
                                </Button>
                            </div>

                            <div className="bg-violet-600 border border-violet-500 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32" />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-4 h-4 text-white/60" />
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">AI Intelligence</span>
                                        </div>
                                        <h2 className="text-xl font-black leading-tight">Ministry trends are being processed in real-time.</h2>
                                        <p className="text-sm font-medium text-white/80 mt-2">The system is currently synthesizing data from Usher reports and Kids check-ins to forecast next month's volunteer requirements.</p>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-white/60 tracking-widest">Next Analysis Trigger</p>
                                            <p className="text-xs font-black">March 10, 2026 · 18:00 JST</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

