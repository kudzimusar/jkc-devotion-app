"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addPrayerRequestAction } from "@/app/actions/admin";
import { Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function PrayerForm({ onSuccess }: { onSuccess: () => void }) {
    const { userId, orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState("");
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    // AI Prediction Simulation
    const getAiPrediction = (val: string) => {
        if (val.length < 10) return null;
        if (val.toLowerCase().includes('sick') || val.toLowerCase().includes('pain')) return "Health (Urgent)";
        if (val.toLowerCase().includes('money') || val.toLowerCase().includes('job') || val.toLowerCase().includes('finance')) return "Financial (Normal)";
        return "General (Normal)";
    };

    const aiType = getAiPrediction(text);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const result = await addPrayerRequestAction({
            text,
            userId,
            orgId,
            isAnonymous: false
        });

        if (result.success) {
            toast.success("Prayer request added to the Intercessory list!");
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-violet-400 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-violet-300 uppercase">AI Prophetic Intent</p>
                    <p className="text-[10px] text-violet-300/60 leading-tight">I will automatically categorize this request and assign the appropriate intercessory urgency.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-white/40">Request Details</label>
                        {aiType && (
                            <Badge className="bg-violet-500/20 text-violet-400 border-0 text-[9px] px-2 py-0">
                                AI Sensed: {aiType}
                            </Badge>
                        )}
                    </div>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type the prayer request here..."
                        className="bg-white/5 border-white/10 text-white text-xs min-h-[120px] focus:ring-violet-500/50"
                        required
                    />
                </div>

                <Button type="submit" disabled={loading || text.length < 5} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-5 rounded-xl gap-2 shadow-lg shadow-violet-500/20">
                    {loading ? "Processing Prophetic Intake..." : "Submit Prayer Request"}
                    <Heart className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
