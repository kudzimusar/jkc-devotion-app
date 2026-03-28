"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, BarChart3, TrendingUp, Users, CalendarDays, FileText, Loader2 } from 'lucide-react';

export default function AnalyticsClient() {
    const params = useParams();
    const slug = params.slug as string;

    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentReports, setRecentReports] = useState<any[]>([]);

    useEffect(() => {
        MinistryAuth.requireAccess(slug, 'leader').then(async sess => {
            setSession(sess);
            await loadAnalytics(sess.ministryId);
            setLoading(false);
        }).catch(console.error);
    }, [slug]);

    const loadAnalytics = async (ministryId: string) => {
        const { data: analyticsData } = await supabase
            .from('ministry_analytics')
            .select('*')
            .eq('ministry_id', ministryId)
            .maybeSingle();

        const { data: reports } = await supabase
            .from('ministry_reports')
            .select('*')
            .eq('ministry_id', ministryId)
            .order('created_at', { ascending: false })
            .limit(20);

        const attendanceLogs = (reports || []).filter(r => r.report_type === 'attendance');
        const eventLogs = (reports || []).filter(r => r.report_type === 'event');
        const totalAttendees = attendanceLogs.reduce((sum, r) => sum + (r.data?.total_attendees || 0), 0);
        const avgAttendance = attendanceLogs.length > 0 ? Math.round(totalAttendees / attendanceLogs.length) : 0;
        const totalSalvations = attendanceLogs.reduce((sum, r) => sum + (r.data?.salvations || 0), 0);
        const totalFirstTimers = attendanceLogs.reduce((sum, r) => sum + (r.data?.first_timers || 0), 0);

        setAnalytics({ ...analyticsData, totalAttendees, avgAttendance, totalSalvations, totalFirstTimers, attendanceLogs, eventLogs });
        setRecentReports(reports || []);
    };

    if (loading || !session) {
        return <div className="flex items-center justify-center min-h-screen bg-[#080c14]"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;
    }

    const stats = [
        { label: 'Total Reports', value: analytics?.total_reports ?? recentReports.length, icon: FileText, color: 'violet', suffix: '' },
        { label: 'Avg Attendance', value: analytics?.avgAttendance ?? 0, icon: Users, color: 'emerald', suffix: '' },
        { label: 'Total Salvations', value: analytics?.totalSalvations ?? 0, icon: TrendingUp, color: 'amber', suffix: '' },
        { label: 'Events Logged', value: analytics?.eventLogs?.length ?? 0, icon: CalendarDays, color: 'blue', suffix: '' },
        { label: 'First Timers', value: analytics?.totalFirstTimers ?? 0, icon: Users, color: 'pink', suffix: '' },
        { label: 'Health Score', value: analytics?.health_score ?? '—', icon: BarChart3, color: 'indigo', suffix: analytics?.health_score ? '/100' : '' },
    ];

    const colorMap: Record<string, string> = {
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    };

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/ministry-dashboard/${slug}`} className="flex items-center gap-2 text-white/50 hover:text-white group">
                         <span className="text-white">Back to Ministry Hub</span>
                    </Link>
                </div>
            </div>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-8">
                {stats.map(({ label, value, icon: Icon, color, suffix }) => (
                    <div key={label} className="bg-[#0d1421] border border-white/10 rounded-3xl p-6">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-4 ${colorMap[color]}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <p className={`text-3xl font-black ${colorMap[color].split(' ')[0]}`}>{value}{suffix}</p>
                        <p className="text-white/40 text-xs mt-1.5 font-bold uppercase tracking-widest">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
