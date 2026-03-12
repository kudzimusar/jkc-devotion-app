"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Users, CalendarDays, FileText, Bell, ClipboardList, TrendingUp, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MinistryOverviewPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [analytics, setAnalytics] = useState<any>(null);
    const [insights, setInsights] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any>(null);

    const loadData = async (sess: MinistrySession) => {
        // 1. Fetch Analytics
        const { data: analyticsData } = await supabase
            .from('ministry_analytics')
            .select('*')
            .eq('ministry_id', sess.ministryId)
            .maybeSingle();
        setAnalytics(analyticsData);

        // 2. Fetch AI Insights
        const { data: insightData } = await supabase
            .from('ai_ministry_insights')
            .select('*')
            .eq('ministry_id', sess.ministryId)
            .eq('is_approved', true)
            .eq('visible_to_ministry_leaders', true)
            .order('created_at', { ascending: false });
        setInsights(insightData || []);

        // 3. Fetch Last Report
        const { data: lastReport } = await supabase
            .from('ministry_reports')
            .select('created_at, service_date')
            .eq('ministry_id', sess.ministryId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (lastReport) {
            const daysSince = Math.floor((new Date().getTime() - new Date(lastReport.created_at).getTime()) / (1000 * 3600 * 24));
            setRecentActivity({
                daysSince,
                lastDate: lastReport.service_date
            });
        }
    };

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            loadData(sess);
            setLoading(false);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    if (loading || !session) {
        return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><p className="text-white/40 font-medium">Loading ministry profile...</p></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link 
                        href="/ministry-dashboard" 
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-violet-500/50 group-hover:bg-violet-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">My Ministries</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white tracking-wide">{session.ministryName}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                        {session.ministryRole}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 relative z-10">
                {/* Header Card */}
                <div 
                  className="rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/10"
                  style={{ backgroundColor: session.color || '#6366F1' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">{session.ministryName}</h1>
                        <p className="text-white/90 max-w-lg leading-relaxed font-medium">{session.description}</p>
                    </div>
                </div>

                {/* Dashboard Actions */}
                <div>
                    <h2 className="text-[10px] font-black text-white/30 mb-4 tracking-[0.3em] uppercase">Operations</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {MinistryAuth.can(session.ministryRole, 'assistant') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/reports`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                                        <FileText className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors">Submit Report</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Log attendance, events, resources</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/attendance`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                        <ClipboardList className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Quick Attendance</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Log service headcounts</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/events`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                        <CalendarDays className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Ministry Events</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Manage retreats & outreach</p>
                                </Link>
                            </>
                        )}
                        {MinistryAuth.can(session.ministryRole, 'leader') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/team`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                                        <Users className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">Manage Team</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Assign roles to volunteers</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/analytics`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Analytics</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">View performance metrics</p>
                                </Link>
                            </>
                        )}
                        <Link href={`/ministry-dashboard/${slug}/announcements`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-pink-500/50 hover:bg-pink-500/5 transition-all shadow-xl group">
                            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                                <Bell className="w-5 h-5 text-pink-400" />
                            </div>
                            <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">Announcements</h3>
                            <p className="text-white/40 text-xs mt-1.5 font-medium">Messages from leadership</p>
                        </Link>
                    </div>
                </div>
                {/* Ministry Intelligence Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* KPI Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-[10px] font-black text-white/30 mb-4 tracking-[0.3em] uppercase">Ministry Health Intelligence</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <KPICard 
                                    label="Health Score" 
                                    value={analytics?.health_score ?? '—'} 
                                    color={analytics?.health_score >= 70 ? 'emerald' : analytics?.health_score >= 40 ? 'amber' : 'red'}
                                    suffix="/100"
                                />
                                <KPICard 
                                    label="Avg Attendance" 
                                    value={analytics?.avg_attendance ?? 0} 
                                    color="indigo" 
                                />
                                <KPICard 
                                    label="Total Reports" 
                                    value={analytics?.total_reports ?? 0} 
                                    color="violet" 
                                />
                                <KPICard 
                                    label="Salvations" 
                                    value={analytics?.salvations ?? 0} 
                                    color="pink" 
                                />
                                <KPICard 
                                    label="Visitors" 
                                    value={analytics?.visitors ?? 0} 
                                    color="blue" 
                                />
                                <div className={`bg-[#0d1421] border border-white/10 rounded-3xl p-5 shadow-xl transition-all ${recentActivity?.daysSince > 7 ? 'ring-1 ring-red-500/50 bg-red-500/5' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Reports Status</p>
                                        {recentActivity?.daysSince > 7 && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                    </div>
                                    <p className={`text-2xl font-black ${recentActivity?.daysSince > 7 ? 'text-red-400' : 'text-white'}`}>
                                        {recentActivity ? `${recentActivity.daysSince}d ago` : 'No reports'}
                                    </p>
                                    <p className="text-[9px] text-white/20 mt-1 uppercase font-bold">Days since last report</p>
                                </div>
                            </div>
                        </div>

                        {/* Automation Status */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Automation Active</p>
                                    <p className="text-xs text-white/40">Real-time health score & Mission Control sync enabled</p>
                                </div>
                            </div>
                            <div className="text-xs font-medium text-white/60 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                {recentActivity 
                                    ? `Last sync: ${new Date(recentActivity.lastDate).toLocaleDateString()}` 
                                    : 'Awaiting first report...'}
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Column */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase flex items-center gap-2">
                             <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Insights
                        </h2>
                        <div className="space-y-3">
                            {insights.length === 0 ? (
                                <div className="bg-[#0d1421]/50 border border-dashed border-white/10 rounded-3xl p-8 text-center">
                                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Searching for patterns...</p>
                                    <p className="text-[10px] text-white/10 mt-1">Approved insights will appear here</p>
                                </div>
                            ) : (
                                insights.map(insight => (
                                    <InsightCard key={insight.id} insight={insight} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, color = 'indigo', suffix = '' }: any) {
    const colors: any = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };

    return (
        <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-5 shadow-xl">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p>
             <p className={`text-2xl font-black ${colors[color].split(' ')[0]}`}>{value}{suffix}</p>
        </div>
    );
}

function InsightCard({ insight }: any) {
    const typeColors: any = {
        growth: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
        risk: 'border-red-500/30 bg-red-500/5 text-red-400',
        opportunity: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
        commendation: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
        correlation: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
    };

    const color = typeColors[insight.insight_type] || 'border-white/10 bg-white/5 text-white';

    return (
        <div className={`p-4 rounded-2xl border ${color.split(' ')[0]} ${color.split(' ')[1]} shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
                    {insight.insight_type}
                </span>
                <span className="text-[9px] text-white/20 font-bold">{new Date(insight.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-white font-bold text-xs">{insight.subject}</p>
            <p className="text-white/60 text-[11px] mt-1.5 leading-relaxed">{insight.summary}</p>
        </div>
    );
}

