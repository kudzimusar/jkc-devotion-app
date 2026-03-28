"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SERVICE_TYPES = ['Sunday Service', 'Mid-Week Meeting', 'Prayer Meeting', 'Youth Service', 'Outreach', 'Special Event'];

export default function AttendanceClient() {
    const params = useParams();
    const slug = params.slug as string;

    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
            service_date: serviceDate,
            data: reportData,
            status: 'submitted',
        });

        if (error) {
            toast.error('Failed to submit: ' + error.message);
        } else {
            toast.success('Report saved and sent to Mission Control!');
            setTotalAttendees('');
            setFirstTimers('');
            setSalvations('');
            setWaterBaptisms('');
            setNotes('');
            loadRecentLogs(session.ministryId);
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
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white">Quick Attendance</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 relative">
                <div className="relative grid md:grid-cols-5 gap-8">
                    <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm" />
                            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm">
                                {SERVICE_TYPES.map(t => <option key={t} value={t} className="bg-[#0d1421]">{t}</option>)}
                            </select>
                        </div>
                        <input type="number" value={totalAttendees} onChange={e => setTotalAttendees(e.target.value)} placeholder="Total Attendees" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4" />
                        <button type="submit" disabled={submitting || !totalAttendees} className="w-full h-12 bg-emerald-600 rounded-xl">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
