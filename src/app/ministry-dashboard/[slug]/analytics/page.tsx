"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, BarChart3, TrendingUp, Users, CalendarDays, FileText, Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
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
        // Pull ministry_analytics record
        const { data: analyticsData } = await supabase
            .from('ministry_analytics')
            .select('*')
            .eq('ministry_id', ministryId)
            .maybeSingle();

        // Pull all reports for this ministry
        const { data: reports } = await supabase
            .from('ministry_reports')
            .select('*')
            .eq('ministry_id', ministryId)
            .order('created_at', { ascending: false })
            .limit(20);

        // Compute local stats from reports
        const attendanceLogs = (reports || []).filter(r => r.report_type === 'attendance');
        const eventLogs = (reports || []).filter(r => r.report_type === 'event');
        const totalAttendees = attendanceLogs.reduce((sum, r) => sum + (r.report_data?.total_attendees || 0), 0);
        const avgAttendance = attendanceLogs.length > 0 ? Math.round(totalAttendees / attendanceLogs.length) : 0;
        const totalSalvations = attendanceLogs.reduce((sum, r) => sum + (r.report_data?.salvations || 0), 0);
        const totalFirstTimers = attendanceLogs.reduce((sum, r) => sum + (r.report_data?.first_timers || 0), 0);

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
                    <Link href={`/ministry-dashboard/${slug}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{session.ministryName}</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white">Analytics</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-white">{session.ministryName} Analytics</h1>
                    <p className="text-white/40 text-sm mt-1 font-medium">Live intelligence pulled from all submitted reports.</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.map(({ label, value, icon: Icon, color, suffix }) => (
                        <div key={label} className="bg-[#0d1421] border border-white/10 rounded-3xl p-6 shadow-xl">
                            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-4 ${colorMap[color]}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className={`text-3xl font-black ${colorMap[color].split(' ')[0]}`}>{value}{suffix}</p>
                            <p className="text-white/40 text-xs mt-1.5 font-bold uppercase tracking-widest">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Reports Timeline */}
                <div>
                    <h2 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase mb-4">Submission Timeline</h2>
                    {recentReports.length === 0 ? (
                        <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-8 text-center text-white/30 text-sm">No reports submitted yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {recentReports.slice(0, 10).map(report => (
                                <div key={report.id} className="bg-[#0d1421] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${report.report_type === 'attendance' ? 'bg-emerald-400' : report.report_type === 'event' ? 'bg-blue-400' : 'bg-violet-400'}`} />
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm capitalize">{report.report_type} Report</p>
                                        {report.report_type === 'attendance' && (
                                            <p className="text-white/40 text-xs mt-0.5">{report.report_data?.total_attendees} attendees · {report.report_data?.service_type}</p>
                                        )}
                                        {report.report_type === 'event' && (
                                            <p className="text-white/40 text-xs mt-0.5">{report.report_data?.event_name} · {report.report_data?.event_type}</p>
                                        )}
                                        {report.report_type !== 'attendance' && report.report_type !== 'event' && (
                                            <p className="text-white/40 text-xs mt-0.5">Custom report form</p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                        report.status === 'submitted' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-white/30 bg-white/5 border-white/10'
                                    }`}>{report.status}</span>
                                    <span className="text-[10px] text-white/30 font-medium">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
