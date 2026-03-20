"use client";
import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, CheckCircle2, Clock } from "lucide-react";
import { useAdminCtx } from "../layout";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (!orgId) return;
        supabaseAdmin.from('events')
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
                <h1 className="text-xl font-black text-white">Events & Services</h1>
                <p className="text-[11px] text-white/30 mt-0.5">{events.length} total events tracked</p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Upcoming', val: upcoming.length, color: 'text-violet-400' },
                    { label: 'Past Events', val: past.length, color: 'text-white/50' },
                    { label: 'Avg Attendance Rate', val: `${attendanceRate}%`, color: 'text-emerald-400' },
                    { label: 'Total Attendees', val: past.reduce((a, e) => a + (e.actual_attendees || 0), 0), color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? <div className="text-center py-12 text-white/30 text-xs">Loading events...</div> :
                    events.map((e, i) => {
                        const isPast = new Date(e.event_date) < new Date();
                        const fillRate = e.expected_attendees ? Math.round((e.actual_attendees || 0) / e.expected_attendees * 100) : null;
                        return (
                            <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-white/5' : 'bg-violet-500/10'}`}>
                                    {isPast ? <CheckCircle2 className="w-5 h-5 text-white/30" /> : <Clock className="w-5 h-5 text-violet-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-white">{e.name}</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${isPast ? 'bg-white/10 text-white/30' : 'bg-violet-500/20 text-violet-400'}`}>
                                            {isPast ? 'Past' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-white/25" /><p className="text-[10px] text-white/40">{new Date(e.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                                        {e.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-white/25" /><p className="text-[10px] text-white/40">{e.location}</p></div>}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {e.actual_attendees !== null && e.actual_attendees !== undefined ? (
                                        <>
                                            <p className="text-sm font-black text-white">{e.actual_attendees}</p>
                                            <p className="text-[9px] text-white/30">of {e.expected_attendees} expected</p>
                                            {fillRate !== null && <p className={`text-[9px] font-black ${fillRate >= 90 ? 'text-emerald-400' : fillRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{fillRate}% fill rate</p>}
                                        </>
                                    ) : (
                                        <p className="text-xs text-white/30">{e.expected_attendees} expected</p>
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
