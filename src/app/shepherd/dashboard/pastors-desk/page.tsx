"use client";
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import {
    Users, TrendingUp, Calendar, Heart, Share2,
    ArrowUpRight, ArrowDownRight, AlertCircle,
    BarChart3, PieChart as PieChartIcon, Activity,
    RefreshCcw, ChevronRight, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';
import { SocialAnalytics } from '@/components/dashboard/SocialAnalytics';
import { useAdminCtx } from '../Context';

const COLORS = ['#8b5cf6', '#3b82f6', '#94a3b8'];

export default function PastorsDesk() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        memberGrowth: 0,
        attendanceIntent: [
            { name: 'In-Person', value: 0 },
            { name: 'Online', value: 0 },
            { name: 'Not Attending', value: 0 }
        ],
        socialMetrics: {
            reach: 0,
            engagement: 0,
            growth: 0
        },
        careAlerts: [] as any[],
        declarationsToday: 0
    });

    const { orgId } = useAdminCtx();

    const fetchStats = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            // 1. Total Members & Growth
            const { count: total } = await supabase.from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId);

            // Simplified growth calculation: members joined in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { count: recent } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .gt('created_at', thirtyDaysAgo.toISOString());

            // 2. Attendance Intent (Latest service)
            const today = new Date().toISOString().split('T')[0];
            const { data: attendance } = await supabase
                .from('attendance_records')
                .select('attendance_status')
                .eq('org_id', orgId)
                .eq('event_date', today);

            const attendanceCounts = {
                'Present': 0,
                'Online': 0,
                'Excused': 0
            };
            attendance?.forEach(a => {
                const status = a.attendance_status as keyof typeof attendanceCounts;
                if (status in attendanceCounts) {
                    attendanceCounts[status]++;
                }
            });

            // 3. Social Metrics
            const { data: social } = await supabase
                .from('social_media_metrics')
                .select('*')
                .eq('org_id', orgId)
                .order('date', { ascending: false })
                .limit(1);

            // 4. Care Alerts (ai_insights)
            const { data: alerts } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('org_id', orgId)
                .eq('priority', 'critical')
                .eq('is_acknowledged', false)
                .limit(3);

            // 5. Declarations Today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const { count: decCount } = await supabase
                .from('user_declarations')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .gte('confirmed_at', startOfToday.toISOString());

            setStats({
                totalMembers: total || 0,
                memberGrowth: recent || 0,
                attendanceIntent: [
                    { name: 'In-Person', value: attendanceCounts['Present'] },
                    { name: 'Online', value: attendanceCounts['Online'] },
                    { name: 'Excused', value: attendanceCounts['Excused'] }
                ],
                socialMetrics: {
                    reach: social?.[0]?.reach || 0,
                    engagement: social?.[0]?.engagement || 0,
                    growth: social?.[0]?.followers || 0
                },
                careAlerts: alerts || [],
                declarationsToday: decCount || 0
            });
        } catch (error) {
            console.error('Error fetching pastor stats:', error);
            // Don't show toast error if it's just the new table missing yet
            if ((error as any).code !== 'PGRST116' && (error as any).code !== '42P01') {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) fetchStats();
    }, [orgId]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <RefreshCcw className="w-6 h-6 animate-spin text-violet-500 opacity-50" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase transition-colors">Pastor's Desk</h1>
                    <p className="text-muted-foreground font-medium transition-colors">Strategic overview of the church's health and impact.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="h-10 px-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" /> Refresh Data
                    </button>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 uppercase font-black text-[10px] tracking-widest px-3 py-1">
                        System Active
                    </Badge>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border rounded-3xl overflow-hidden group transition-colors">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Users className="w-5 h-5 text-violet-400" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Total Members</CardDescription>
                        <CardTitle className="text-3xl font-black text-foreground">{stats.totalMembers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                            <TrendingUp className="w-3 h-3" />
                            +{stats.memberGrowth} this month
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border rounded-3xl overflow-hidden group transition-colors">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Attendance Intent</CardDescription>
                        <CardTitle className="text-3xl font-black text-foreground">
                            {stats.attendanceIntent.reduce((sum, item) => sum + item.value, 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 text-opacity-80">
                            <Activity className="w-3 h-3" />
                            {stats.attendanceIntent.find(a => a.name === 'In-Person')?.value} planning in-person
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border rounded-3xl overflow-hidden group transition-colors">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Daily Affirmations</CardDescription>
                        <CardTitle className="text-3xl font-black text-foreground">{stats.declarationsToday}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                            <Activity className="w-3 h-3" />
                            {stats.declarationsToday > 0 ? 'Active participation' : 'Awaiting declarations'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border rounded-3xl overflow-hidden group transition-colors">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Heart className="w-5 h-5 text-rose-400" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Pastoral Alerts</CardDescription>
                        <CardTitle className="text-3xl font-black text-foreground">{stats.careAlerts.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-xs font-bold ${stats.careAlerts.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {stats.careAlerts.length > 0 ? 'Critical care needed' : 'All members stable'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Attendance Chart */}
                <Card className="lg:col-span-8 bg-card border-border rounded-3xl p-6 transition-colors">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                            <BarChart3 className="w-5 h-5 text-violet-400" /> Attendance Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] px-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.attendanceIntent}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="name" stroke="currentColor" strokeOpacity={0.5} fontSize={10} fontWeight="bold" />
                                <YAxis stroke="currentColor" strokeOpacity={0.5} fontSize={10} fontWeight="bold" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                    itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {stats.attendanceIntent.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status distribution & Care alerts */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-card border-border rounded-3xl p-6 transition-colors">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                                <PieChartIcon className="w-5 h-5 text-blue-400" /> Channel Mix
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] px-0 flex flex-col items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.attendanceIntent}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.attendanceIntent.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-4 mt-2">
                                {stats.attendanceIntent.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-rose-500/5 border-rose-500/20 rounded-3xl p-6 transition-colors">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-rose-500">
                                <AlertCircle className="w-5 h-5" /> Care Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 space-y-4">
                            {stats.careAlerts.length > 0 ? stats.careAlerts.map((alert, i) => (
                                <div key={i} className="p-3 bg-card border border-border rounded-2xl flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                        <Heart className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{alert.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{alert.insight}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-emerald-500/50 text-[10px] font-black uppercase tracking-widest">
                                    No critical spiritual alerts.
                                </div>
                            )}
                            {stats.careAlerts.length > 0 && (
                                <button className="w-full h-10 rounded-xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest mt-2 hover:bg-rose-600 transition-colors">
                                    View Action Items
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Outreach & Social Strategy (NEW) */}
            <div className="pt-8 border-t border-border transition-colors">
                <SocialAnalytics />
            </div>
        </div>
    );
}
