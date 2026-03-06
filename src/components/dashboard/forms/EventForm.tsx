"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createEventAction } from "@/app/actions/admin";
import { Calendar, MapPin, AlignLeft } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function EventForm({ onSuccess }: { onSuccess: () => void }) {
    const { userId, orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const result = await createEventAction({
            ...data,
            orgId,
            userId
        });

        if (result.success) {
            toast.success("Event created successfully!");
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Event Title</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <Input name="name" placeholder="Sunday Service, Youth Night..." className="bg-white/5 border-white/10 text-white text-xs pl-9" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Type</label>
                    <select name="type" className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50">
                        <option value="service" className="bg-[#111827]">Service</option>
                        <option value="fellowship" className="bg-[#111827]">Fellowship</option>
                        <option value="outreach" className="bg-[#111827]">Outreach</option>
                        <option value="special" className="bg-[#111827]">Special Event</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40">Date & Time</label>
                    <Input name="date" type="datetime-local" className="bg-white/5 border-white/10 text-white text-xs" required />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Location</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <Input name="location" placeholder="Church Main Hall, Online, etc." className="bg-white/5 border-white/10 text-white text-xs pl-9" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Notes / Description</label>
                <Textarea name="description" placeholder="Brief overview of the event..." className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-5 rounded-xl">
                {loading ? "Creating Event..." : "Publish Event"}
            </Button>
        </form>
    );
}
