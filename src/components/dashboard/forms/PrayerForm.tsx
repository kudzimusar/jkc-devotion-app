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
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-primary uppercase">AI Prophetic Intent</p>
                    <p className="text-[10px] text-primary/60 leading-tight">I will automatically categorize this request and assign the appropriate intercessory urgency.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Request Details</label>
                        {aiType && (
                            <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-2 py-0.5 font-bold">
                                AI Sensed: {aiType}
                            </Badge>
                        )}
                    </div>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type the prayer request here..."
                        className="bg-muted border-border text-foreground text-xs min-h-[120px] focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                        required
                    />
                </div>

                <Button type="submit" disabled={loading || text.length < 5} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all">
                    {loading ? "Processing Prophetic Intake..." : "Submit Prayer Request"}
                    <Heart className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
