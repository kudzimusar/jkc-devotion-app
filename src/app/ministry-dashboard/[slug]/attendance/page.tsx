"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SERVICE_TYPES = ['Sunday Service', 'Mid-Week Meeting', 'Prayer Meeting', 'Youth Service', 'Outreach', 'Special Event'];

export default function AttendancePage() {
    const params = useParams();
    const slug = params.slug as string;

    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceType, setServiceType] = useState('Sunday Service');
    const [totalAttendees, setTotalAttendees] = useState('');
    const [firstTimers, setFirstTimers] = useState('');
    const [salvations, setSalvations] = useState('');
    const [waterBaptisms, setWaterBaptisms] = useState('');
    const [notes, setNotes] = useState('');

    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        MinistryAuth.requireAccess(slug, 'assistant').then(sess => {
            setSession(sess);
            loadRecentLogs(sess.ministryId);
            setLoading(false);
        }).catch(console.error);
    }, [slug]);

    const loadRecentLogs = async (ministryId: string) => {
        const { data } = await supabase
            .from('ministry_reports')
            .select('*')
            .eq('ministry_id', ministryId)
            .eq('report_type', 'attendance')
            .order('created_at', { ascending: false })
            .limit(5);
        setRecentLogs(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        const reportData = {
            service_date: serviceDate,
            service_type: serviceType,
            total_attendees: parseInt(totalAttendees) || 0,
            first_timers: parseInt(firstTimers) || 0,
            salvations: parseInt(salvations) || 0,
            water_baptisms: parseInt(waterBaptisms) || 0,
            notes,
        };

        const { error } = await supabase.from('ministry_reports').insert({
            ministry_id: session.ministryId,
            org_id: 'fa547adf-f820-412f-9458-d6bade11517d',
            submitted_by: user?.id,
            report_type: 'attendance',
            report_data: reportData,
            status: 'submitted',
        });

        if (error) {
            toast.error('Failed to submit: ' + error.message);
        } else {
            toast.success('Attendance recorded & sent to Mission Control!');
            setSubmitted(true);
            setTotalAttendees('');
            setFirstTimers('');
            setSalvations('');
            setWaterBaptisms('');
            setNotes('');
            setSubmitted(false);
            loadRecentLogs(session.ministryId);
        }
        setSubmitting(false);
    };

    if (loading || !session) {
        return <div className="flex items-center justify-center min-h-screen bg-[#080c14]"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            {/* Top Nav */}
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/ministry-dashboard/${slug}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{session.ministryName}</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white">Quick Attendance</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/5 to-transparent pointer-events-none" />
                <div className="relative grid md:grid-cols-5 gap-8">

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
                        <div>
                            <h1 className="text-2xl font-black text-white">Log Attendance</h1>
                            <p className="text-white/40 text-sm mt-1 font-medium">This feeds directly into Mission Control's weekly intelligence report.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Service Date</label>
                                <input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} required
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Service Type</label>
                                <select value={serviceType} onChange={e => setServiceType(e.target.value)}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all">
                                    {SERVICE_TYPES.map(t => <option key={t} value={t} className="bg-[#0d1421]">{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Total Attendees', value: totalAttendees, set: setTotalAttendees, color: 'emerald' },
                                { label: 'First Timers', value: firstTimers, set: setFirstTimers, color: 'blue' },
                                { label: 'Salvations', value: salvations, set: setSalvations, color: 'violet' },
                                { label: 'Water Baptisms', value: waterBaptisms, set: setWaterBaptisms, color: 'amber' },
                            ].map(({ label, value, set, color }) => (
                                <div key={label} className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</label>
                                    <input type="number" min="0" value={value} onChange={e => set(e.target.value)} placeholder="0"
                                        className={`w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-${color}-500/50 transition-all`} />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Notes for Mission Control</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any highlights, prayer requests, or observations..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all resize-none" />
                        </div>

                        <button type="submit" disabled={submitting || !totalAttendees}
                            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit to Mission Control</>}
                        </button>
                    </form>

                    {/* Recent Logs */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Recent Submissions</h2>
                        {recentLogs.length === 0 ? (
                            <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-6 text-center text-white/30 text-sm">No logs yet.</div>
                        ) : (
                            recentLogs.map((log) => (
                                <div key={log.id} className="bg-[#0d1421] border border-white/10 rounded-2xl p-4 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{log.report_data?.service_type}</span>
                                        <span className="text-[10px] text-white/30">{new Date(log.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-white font-bold text-lg">{log.report_data?.total_attendees} <span className="text-white/40 text-xs font-normal">attendees</span></p>
                                    {log.report_data?.first_timers > 0 && <p className="text-white/40 text-xs mt-1">{log.report_data.first_timers} first timers · {log.report_data?.salvations || 0} salvations</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
