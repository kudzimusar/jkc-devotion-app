"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assignMinistryRoleAction } from "@/app/actions/admin";
import { BookOpen, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function MinistryForm({ onSuccess }: { onSuccess: () => void }) {
    const { userId: adminId } = useAdminCtx();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const memberId = formData.get('memberId') as string;
        const role = formData.get('role') as string;
        const ministry = formData.get('ministry') as string;

        const result = await assignMinistryRoleAction(memberId, role, ministry, adminId);

        if (result.success) {
            toast.success("Ministry invitation sent successfully!");
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase">Ministry Matching Intelligence</p>
                    <p className="text-[10px] text-emerald-600/60 dark:text-emerald-300/60 leading-tight">I will notify the member via the app and track their invitation status automatically.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Select Member</label>
                <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Input name="memberId" placeholder="Search by name or email..." className="bg-muted border-border text-foreground text-xs pl-9 placeholder:text-muted-foreground/40" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Ministry</label>
                    <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <select name="ministry" className="w-full h-9 bg-muted border border-border rounded-xl pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all">
                            <option value="Worship" className="bg-card">Worship</option>
                            <option value="Media" className="bg-card">Media</option>
                            <option value="Intercessory" className="bg-card">Intercessory</option>
                            <option value="Youth" className="bg-card">Youth</option>
                            <option value="Hospitality" className="bg-card">Hospitality</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Role</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <select name="role" className="w-full h-9 bg-muted border border-border rounded-xl pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all">
                            <option value="member" className="bg-card">Member</option>
                            <option value="leader" className="bg-card">Leader</option>
                            <option value="coordinator" className="bg-card">Coordinator</option>
                        </select>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                {loading ? "Sending Invitation..." : "Assign & Notify"}
            </Button>
        </form>
    );
}
