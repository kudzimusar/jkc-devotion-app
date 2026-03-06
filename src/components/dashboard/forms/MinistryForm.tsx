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
                <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-emerald-300 uppercase">Ministry Matching Intelligence</p>
                    <p className="text-[10px] text-emerald-300/60 leading-tight">I will notify the member via the app and track their invitation status automatically.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Select Member</label>
                <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <Input name="memberId" placeholder="Search by name or email..." className="bg-white/5 border-white/10 text-white text-xs pl-9" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Ministry</label>
                    <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                        <select name="ministry" className="w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50">
                            <option value="Worship" className="bg-[#111827]">Worship</option>
                            <option value="Media" className="bg-[#111827]">Media</option>
                            <option value="Intercessory" className="bg-[#111827]">Intercessory</option>
                            <option value="Youth" className="bg-[#111827]">Youth</option>
                            <option value="Hospitality" className="bg-[#111827]">Hospitality</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Role</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                        <select name="role" className="w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50">
                            <option value="member" className="bg-[#111827]">Member</option>
                            <option value="leader" className="bg-[#111827]">Leader</option>
                            <option value="coordinator" className="bg-[#111827]">Coordinator</option>
                        </select>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl">
                {loading ? "Sending Invitation..." : "Assign & Notify"}
            </Button>
        </form>
    );
}
