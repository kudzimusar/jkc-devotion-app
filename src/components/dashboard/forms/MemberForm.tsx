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
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Full Name</label>
                    <Input name="name" placeholder="John Doe" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Email</label>
                    <Input name="email" type="email" placeholder="john@example.com" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Phone</label>
                    <Input name="phone" placeholder="+81..." className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">City</label>
                    <Input name="city" placeholder="Tokyo" className="bg-muted border-border text-foreground text-xs placeholder:text-muted-foreground/40" />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-xl shadow-lg shadow-primary/20 transition-all">
                {loading ? "Adding Member..." : "Complete Onboarding"}
            </Button>
        </form>
    );
}
