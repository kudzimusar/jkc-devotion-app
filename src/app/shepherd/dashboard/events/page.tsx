"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, CheckCircle2, Clock } from "lucide-react";
import { useAdminCtx } from "../Context";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        supabase.from('events')
            .select('*')
            .eq('org_id', orgId)
            .order('event_date', { ascending: false })
            .then(({ data }) => { 
                setEvents(data || []); 
                setLoading(false); 
            });
    }, [orgId]);

    const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
    const past = events.filter(e => new Date(e.event_date) < new Date());
    const attendanceRate = past.filter(e => e.actual_attendees).length > 0
        ? Math.round(past.reduce((a, e) => a + (e.actual_attendees || 0), 0) / past.reduce((a, e) => a + (e.expected_attendees || 1), 0) * 100)
        : 0;

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-foreground">Events & Services</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">{events.length} total events tracked</p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Upcoming', val: upcoming.length, color: 'text-primary dark:text-violet-400' },
                    { label: 'Past Events', val: past.length, color: 'text-muted-foreground/50' },
                    { label: 'Avg Attendance Rate', val: `${attendanceRate}%`, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Total Attendees', val: past.reduce((a, e) => a + (e.actual_attendees || 0), 0), color: 'text-blue-600 dark:text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border shadow-sm rounded-2xl p-4 transition-colors">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? <div className="text-center py-12 text-muted-foreground/30 text-xs font-black uppercase tracking-widest">Loading events...</div> :
                    events.map((e, i) => {
                        const isPast = new Date(e.event_date) < new Date();
                        const fillRate = e.expected_attendees ? Math.round((e.actual_attendees || 0) / e.expected_attendees * 100) : null;
                        return (
                            <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-muted' : 'bg-primary/10 dark:bg-violet-500/10'}`}>
                                    {isPast ? <CheckCircle2 className="w-5 h-5 text-muted-foreground/30" /> : <Clock className="w-5 h-5 text-primary dark:text-violet-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-foreground">{e.name}</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${isPast ? 'bg-muted text-muted-foreground/60' : 'bg-primary/20 text-primary dark:bg-violet-500/20 dark:text-violet-400'}`}>
                                            {isPast ? 'Past' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground/30" /><p className="text-[10px] text-muted-foreground/70">{new Date(e.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                                        {e.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground/30" /><p className="text-[10px] text-muted-foreground/70">{e.location}</p></div>}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {e.actual_attendees !== null && e.actual_attendees !== undefined ? (
                                        <>
                                            <p className="text-sm font-black text-foreground">{e.actual_attendees}</p>
                                            <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-tighter">of {e.expected_attendees} expected</p>
                                            {fillRate !== null && <p className={`text-[9px] font-black mt-0.5 ${fillRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : fillRate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{fillRate}% fill rate</p>}
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground/30 font-bold uppercase tracking-widest">{e.expected_attendees} expected</p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                }
            </div>
        </div>
    );
}
