"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateReportAction } from "@/app/actions/admin";
import { FileText, Sparkles, TrendingUp, Users, Heart, BarChart } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function ReportForm({ onSuccess }: { onSuccess: () => void }) {
    const { userId, orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const REPORT_TYPES = [
        { id: 'health', name: 'Shepherd Health', icon: Heart, color: 'text-violet-400', desc: 'Devotions & SOAP analytics' },
        { id: 'growth', name: 'Growth Intelligence', icon: TrendingUp, color: 'text-emerald-400', desc: 'Membership trends' },
        { id: 'financial', name: 'Financial Stewardship', icon: BarChart, color: 'text-amber-400', desc: 'Giving summaries' },
    ];

    async function handleGenerate() {
        if (!selectedType) return;
        setLoading(true);

        const result = await generateReportAction(selectedType, orgId, userId);

        if (result.success) {
            toast.success(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Intelligence generated!`);
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">Prophetic Synthesis Engine</p>
                    <p className="text-[10px] text-indigo-600/60 dark:text-indigo-300/60 leading-tight">I will analyze current data across all tables to generate a narrative intelligence briefing.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground px-1">Select Briefing Type</label>
                <div className="grid grid-cols-1 gap-2">
                    {REPORT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-primary/5 border-primary/50' : 'bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/20'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center ${type.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-foreground">{type.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{type.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <Button
                onClick={handleGenerate}
                disabled={loading || !selectedType}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-xl gap-2 shadow-lg shadow-indigo-500/20 mt-2"
            >
                {loading ? "Synthesizing Data..." : "Generate AI Briefing"}
                <FileText className="w-4 h-4" />
            </Button>
        </div>
    );
}
