"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addMemberAction } from "@/app/actions/admin";
import { Users } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function MemberForm({ onSuccess }: { onSuccess: () => void }) {
    const { orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await addMemberAction({ ...data, orgId });

        if (result.success) {
            toast.success("Member added successfully!");
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Full Name</label>
                    <Input name="name" placeholder="John Doe" className="bg-white/5 border-white/10 text-white text-xs" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Email</label>
                    <Input name="email" type="email" placeholder="john@example.com" className="bg-white/5 border-white/10 text-white text-xs" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Phone</label>
                    <Input name="phone" placeholder="+81..." className="bg-white/5 border-white/10 text-white text-xs" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">City</label>
                    <Input name="city" placeholder="Tokyo" className="bg-white/5 border-white/10 text-white text-xs" />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-5 rounded-xl">
                {loading ? "Adding Member..." : "Complete Onboarding"}
            </Button>
        </form>
    );
}
