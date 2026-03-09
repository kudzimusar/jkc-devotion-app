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
                <label className="text-[10px] font-black uppercase text-muted-foreground">Event Title</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Input name="name" placeholder="Sunday Service, Youth Night..." className="bg-muted border-border text-foreground text-xs pl-9 placeholder:text-muted-foreground/40" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Type</label>
                    <select name="type" className="w-full h-9 bg-muted border border-border rounded-xl px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all">
                        <option value="service" className="bg-card">Service</option>
                        <option value="fellowship" className="bg-card">Fellowship</option>
                        <option value="outreach" className="bg-card">Outreach</option>
                        <option value="special" className="bg-card">Special Event</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Date & Time</label>
                    <Input name="date" type="datetime-local" className="bg-muted border-border text-foreground text-xs" required />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Location</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Input name="location" placeholder="Church Main Hall, Online, etc." className="bg-muted border-border text-foreground text-xs pl-9 placeholder:text-muted-foreground/40" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Notes / Description</label>
                <Textarea name="description" placeholder="Brief overview of the event..." className="bg-muted border-border text-foreground text-xs min-h-[80px] placeholder:text-muted-foreground/40" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-xl shadow-lg shadow-primary/20 transition-all">
                {loading ? "Creating Event..." : "Publish Event"}
            </Button>
        </form>
    );
}
