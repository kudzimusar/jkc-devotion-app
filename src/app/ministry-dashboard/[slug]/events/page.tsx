"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, CalendarDays, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = ['Retreat', 'Outreach', 'Workshop', 'Conference', 'Team Meeting', 'Community Service', 'Fundraiser', 'Special Service'];

export default function EventsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState('Retreat');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [expectedAttendees, setExpectedAttendees] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');

    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        MinistryAuth.requireAccess(slug, 'assistant').then(sess => {
            setSession(sess);
            loadEvents(sess.ministryId);
            setLoading(false);
        }).catch(console.error);
    }, [slug]);

    const loadEvents = async (ministryId: string) => {
        const { data } = await supabase
            .from('ministry_reports')
            .select('*')
            .eq('ministry_id', ministryId)
            .eq('report_type', 'event')
            .order('created_at', { ascending: false })
            .limit(10);
        setEvents(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('ministry_reports').insert({
            ministry_id: session.ministryId,
            org_id: 'fa547adf-f820-412f-9458-d6bade11517d',
            submitted_by: user?.id,
            report_type: 'event',
            report_data: {
                event_name: eventName,
                event_type: eventType,
                event_date: eventDate,
                location,
                expected_attendees: parseInt(expectedAttendees) || 0,
                budget: parseFloat(budget) || 0,
                description,
            },
            status: 'submitted',
        });

        if (error) {
            toast.error('Failed to submit: ' + error.message);
        } else {
            toast.success('Event logged & sent to Mission Control!');
            setEventName(''); setEventDate(''); setLocation('');
            setExpectedAttendees(''); setBudget(''); setDescription('');
            loadEvents(session.ministryId);
        }
        setSubmitting(false);
    };

    if (loading || !session) {
        return <div className="flex items-center justify-center min-h-screen bg-[#080c14]"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/ministry-dashboard/${slug}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{session.ministryName}</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white">Ministry Events</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-blue-400" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-5 gap-8">

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
                        <div>
                            <h1 className="text-2xl font-black text-white">Log Ministry Event</h1>
                            <p className="text-white/40 text-sm mt-1 font-medium">Events are visible to Mission Control for planning and resource allocation.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Event Name</label>
                            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} required placeholder="e.g. Annual Youth Retreat"
                                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Event Type</label>
                                <select value={eventType} onChange={e => setEventType(e.target.value)}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all">
                                    {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-[#0d1421]">{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Event Date</label>
                                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Location / Venue</label>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Hall, Hakone, Online"
                                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Expected Attendees</label>
                                <input type="number" min="0" value={expectedAttendees} onChange={e => setExpectedAttendees(e.target.value)} placeholder="0"
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Budget (¥)</label>
                                <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0"
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Description & Goals</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Purpose of the event, goals, any resources needed from admin..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
                        </div>

                        <button type="submit" disabled={submitting || !eventName || !eventDate}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit Event to Mission Control</>}
                        </button>
                    </form>

                    {/* Past Events */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Logged Events</h2>
                        {events.length === 0 ? (
                            <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-6 text-center text-white/30 text-sm">No events logged yet.</div>
                        ) : (
                            events.map(ev => (
                                <div key={ev.id} className="bg-[#0d1421] border border-white/10 rounded-2xl p-4">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{ev.report_data?.event_type}</span>
                                        <span className="text-[10px] text-white/30">{ev.report_data?.event_date}</span>
                                    </div>
                                    <p className="text-white font-bold text-sm">{ev.report_data?.event_name}</p>
                                    {ev.report_data?.location && <p className="text-white/40 text-xs mt-1">{ev.report_data.location}</p>}
                                    {ev.report_data?.expected_attendees > 0 && <p className="text-white/40 text-xs mt-1">{ev.report_data.expected_attendees} expected</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
