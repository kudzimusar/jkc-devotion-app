"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Users, Activity, Calendar, TrendingUp, Heart, AlertTriangle,
    CheckCircle2, Clock, ShieldAlert, UserCheck, Music, Flame,
    ArrowUp, ArrowDown, MessageSquare, Globe, ChevronRight, Minus, MapPin,
    UserPlus, ShieldCheck, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { startOfMonth, subDays, format, startOfWeek, endOfWeek, isAfter, isBefore } from "date-fns";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel,
    AreaChart, Area
} from "recharts";
import { UsherReportModal } from "./UsherReportModal";
import { AttendanceReconciliationCard } from "./AttendanceReconciliationCard";
import { MinistryOnboarding } from "./MinistryOnboarding";
import { toast } from "sonner";
import { CRITICAL_MINISTRIES, MINISTRY_OPTIONS } from "@/lib/constants";

/* ─── Types ─── */
interface DashboardData {
    totalMembers: number;
    newMembersThisMonth: number;
    memberGrowthPct: number;
    activeToday: number;
    engagementScore: number;
    avgStreak: number;
    lastSundayAttendance: number;
    weeklyAvgAttendance: number;
    newFamilies: number;
    salvations: number;
    baptisms: number;
    criticalAlerts: number;
    prayerActive: number;
    prayerAnswered: number;
    alertMembers: AtRiskMember[];
    devotionTrend: { day: string; completions: number; pct: number }[];
    ministryData: { name: string; count: number }[];
    prayerCategories: { name: string; value: number; color: string }[];
    evangelismFunnel: { name: string; value: number }[];
    householdData: { month: string; couples: number; singles: number; families: number }[];
    soapSentiment: SentimentData[];
    wordCloud: string[];
    attendanceTrend: { week: string; count: number }[];
    skillsData: { name: string; count: number }[];
    geoClusters: { name: string; count: number }[];
    manualAttendance: { total: number; adults: number; children: number; visitors: number };
    givingData: { month: string; amount: number }[];
    counselingQueue: { name: string; category: string; leader: string; date: string; urgent: boolean }[];
    staffingGaps: string[];
    discipleshipData: { label: string; count: number }[];
    churchHealth: {
        totalMinistryTouches: number;
        churchHealthScore: number;
        healthyMinistries: number;
        atRiskMinistries: number;
        totalSalvations: number;
        overdueMinistries: number;
        totalVolunteers: number;
    } | null;
}

interface AtRiskMember {
    id: string;
    name: string;
    email: string;
    days_inactive: number;
    risk_level: string;
    current_streak: number;
}

interface SentimentData { name: string; value: number; color: string; }

/* ─── Initial State ─── */
const INITIAL_DATA: DashboardData = {
    totalMembers: 0,
    newMembersThisMonth: 0,
    memberGrowthPct: 0,
    activeToday: 0,
    engagementScore: 0,
    avgStreak: 0,
    lastSundayAttendance: 0,
    weeklyAvgAttendance: 0,
    newFamilies: 0,
    salvations: 0,
    baptisms: 0,
    criticalAlerts: 0,
    prayerActive: 0,
    prayerAnswered: 0,
    alertMembers: [],
    devotionTrend: [],
    ministryData: [],
    prayerCategories: [],
    evangelismFunnel: [],
    householdData: [],
    soapSentiment: [],
    wordCloud: [],
    attendanceTrend: [],
    skillsData: [],
    geoClusters: [],
    manualAttendance: { total: 0, adults: 0, children: 0, visitors: 0 },
    givingData: [],
    counselingQueue: [],
    staffingGaps: [],
    discipleshipData: [],
    churchHealth: null
};

/* ─── Sub-components ─── */
function MetricCard({ title, value, sub, trend, trendVal, icon: Icon, accentColor = 'violet' }: any) {
    const colorMap: Record<string, string> = {
        violet: 'text-violet-500 bg-violet-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
        red: 'text-red-500 bg-red-500/10',
        cyan: 'text-cyan-500 bg-cyan-500/10',
    };
    const colors = colorMap[accentColor] || colorMap.violet;
    const [iconColor, iconBg] = colors.split(' ');

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</p>
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-black text-foreground">{value}</p>
                <div className="flex items-center gap-2">
                    {trend && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {trend === 'up' ? <ArrowUp className="w-2.5 h-2.5" /> : trend === 'down' ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                            {trendVal}
                        </span>
                    )}
                    <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
                </div>
            </div>
        </motion.div>
    );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-0.5 bg-primary rounded-full" />
            <div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-wider">{title}</h2>
                <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
}

const CUSTOM_TOOLTIP_STYLE = {
    contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px' },
    labelStyle: { color: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 },
    itemStyle: { color: 'var(--foreground)', fontSize: 11, fontWeight: 600 },
};

/* ─── Main Component ─── */
export function ShepherdView({ lang = 'EN' }: { lang: 'EN' | 'JP' }) {
    const [data, setData] = useState<DashboardData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [runningAI, setRunningAI] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [membershipRequests, setMembershipRequests] = useState<any[]>([]);

    const runIntelligence = async () => {
        setRunningAI(true);
        try {
            const res = await fetch('/api/intelligence/run', { method: 'POST' });
            if (res.ok) {
                console.log("Intelligence Refreshed");
                loadData();
            }
        } catch (e) {
            console.error("Intelligence Engine connection failed.");
        } finally {
            setRunningAI(false);
            toast.success("Prophetic Insight Layer Synced!");
        }
    };

    const handleMembershipAction = async (userId: string, status: string) => {
        try {
            // First, find the pending request for this user
            const { data: req } = await supabaseAdmin
                .from('membership_requests')
                .select('id')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .maybeSingle();

            if (req) {
                const { error } = await supabaseAdmin
                    .from('membership_requests')
                    .update({ status: status === 'member' ? 'approved' : 'rejected' })
                    .eq('id', req.id);
                if (error) throw error;
            } else {
                // Fallback direct update if no request record found (legacy)
                const { error } = await supabaseAdmin.from('profiles').update({ membership_status: status }).eq('id', userId);
                if (error) throw error;
            }

            toast.success(`User set to ${status}`);
            loadData();
        } catch (e) {
            toast.error("Action failed");
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const db = supabaseAdmin;

            const [
                profilesRes,
                statsRes,
                prayersRes,
                rolesRes,
                pulseRes,
                healthRes,
                propheticRes,
                notesRes,
                velocityRes,
                skillsRes,
                reconRes,
                soapRes,
                sentimentRes,
                evangelismRes,
                ministryAnalyticsRes
            ] = await Promise.all([
                db.from('profiles').select('*'),
                db.from('member_stats').select('*'),
                db.from('prayer_requests').select('*'),
                db.from('ministry_members').select('*'),
                db.from('vw_spiritual_pulse').select('*').maybeSingle(),
                db.from('church_health_metrics').select('*').order('created_at', { ascending: false }).limit(1),
                db.from('prophetic_insights').select('*').eq('is_acknowledged', false).order('generated_at', { ascending: false }).limit(10),
                db.from('pastoral_notes').select('*, member:profiles(name)').eq('category', 'counseling').eq('is_resolved', false).order('follow_up_date', { ascending: true }),
                db.from('vw_activity_velocity').select('*'),
                db.from('member_skills').select('*'),
                db.from('vw_attendance_reconciliation').select('*').order('report_date', { ascending: false }).limit(1),
                db.from('soap_entries').select('*'),
                db.from('soap_sentiment_metrics').select('*'),
                db.from('evangelism_pipeline').select('*'),
                db.from('ministry_analytics').select('ministry_id, health_score, avg_attendance, total_reports, salvations').eq('period_type', 'monthly')
            ]);

            const profiles = profilesRes.data || [];
            const stats = statsRes.data || [];
            const prayers = prayersRes.data || [];
            const ministryMembers = rolesRes.data || [];
            const pulse = pulseRes.data || { total_salvations: 0, total_baptisms: 0, total_formal_members: 0, foundations_complete: 0 };
            const recon = reconRes.data?.[0] || null;
            const propheticInsights = propheticRes.data || [];
            const pastoralNotes = notesRes.data || [];
            const soapEntries = soapRes.data || [];
            const soupSentimentData = sentimentRes.data || [];
            const evangelismData = evangelismRes.data || [];
            const ministryAnalyticsData = ministryAnalyticsRes.data || [];

            // 2. Calculations
            const now = new Date();
            const startOfThisMonth = startOfMonth(now);
            const newMembers = profiles.filter(p => isAfter(new Date(p.created_at || now), startOfThisMonth)).length;

            const activeToday = stats.filter(s => {
                if (!s.last_devotion_date) return false;
                const d = new Date(s.last_devotion_date);
                return d.toDateString() === now.toDateString();
            }).length;

            const avgStreak = stats.length > 0
                ? Math.round(stats.reduce((a, s) => a + (s.current_streak || 0), 0) / stats.length)
                : 0;

            // Household Split
            const hhSplit = { couples: 0, singles: 0, families: 0 };
            profiles.forEach(p => {
                const type = (p.household_type || '').toLowerCase();
                if (type.includes('single')) hhSplit.singles++;
                else if (type.includes('couple')) hhSplit.couples++;
                else if (type.includes('family')) hhSplit.families++;
            });

            // Ministry Data
            const minMap: Record<string, number> = {};
            ministryMembers.forEach(r => {
                minMap[r.ministry_name] = (minMap[r.ministry_name] || 0) + 1;
            });
            const ministryData = Object.entries(minMap).map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            // Staffing Gaps
            const detectedGaps = CRITICAL_MINISTRIES.filter(m => (minMap[m] || 0) < 5);

            // Journey Funnel (Pulse-driven)
            const pipelineFunnel = [
                { name: 'Visitors', value: profiles.filter(p => !p.membership_status || p.membership_status.toLowerCase() === 'visitor').length },
                { name: 'Salvations', value: pulse.total_salvations || 0 },
                { name: 'Foundations', value: pulse.foundations_complete || 0 },
                { name: 'Baptisms', value: pulse.total_baptisms || 0 },
                { name: 'Official Members', value: pulse.total_formal_members || 0 },
                { name: 'Leaders', value: ministryMembers.filter(m => m.is_leader).length }
            ];

            // Alerts Mapping
            const mappedAlerts = propheticInsights.map((i: any) => ({
                id: i.id,
                name: i.insight_title.replace('Disengagement Risk: ', '').split(' ')[0],
                email: '',
                days_inactive: i.metadata?.days_silent || 0,
                risk_level: i.risk_level || 'high',
                current_streak: 0
            }));

            // Skills Mapping
            const skillMap: Record<string, number> = {};
            (skillsRes.data || []).forEach((s: any) => {
                skillMap[s.skill_name] = (skillMap[s.skill_name] || 0) + 1;
            });
            const skillsData = Object.entries(skillMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Geo Mapping
            const geoMap: Record<string, number> = {};
            profiles.forEach(p => {
                const loc = p.ward || p.city || 'Unknown';
                if (loc !== 'Unknown') geoMap[loc] = (geoMap[loc] || 0) + 1;
            });
            const geoClusters = Object.entries(geoMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4);

            // Process Sentiment Data
            const sentimentMap: Record<string, number> = {};
            soupSentimentData.forEach((s: any) => {
                const cat = s.emotion_category || 'Neutral';
                sentimentMap[cat] = (sentimentMap[cat] || 0) + 1;
            });
            const sentimentColors: Record<string, string> = {
                'Hope': '#22d3ee', 'Anxiety': '#f87171', 'Repentance': '#a78bfa',
                'Gratitude': '#34d399', 'Confusion': '#fbbf24', 'Joy': '#60a5fa'
            };
            const liveSentiment = Object.entries(sentimentMap).map(([name, value]) => ({
                name, value, color: sentimentColors[name] || '#94a3b8'
            }));

            // Process Devotion Trend (Mock -> Real mapping placeholder based on actual recent days, we'll keep 14 days)
            const liveTrend = Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                const dayStr = format(d, 'MMM d');
                const entriesForDay = soapEntries.filter((se: any) => new Date(se.created_at).toDateString() === d.toDateString());
                const totalMems = profiles.length || 1;
                return {
                    day: dayStr,
                    completions: entriesForDay.length,
                    pct: Math.round((entriesForDay.length / totalMems) * 100)
                };
            });

            const pendingMembers = profiles.filter(p => p.membership_status === 'pending_approval');
            setMembershipRequests(pendingMembers);

            // Church Health Metrics
            const totalMinistryTouches = ministryAnalyticsData.reduce((sum: number, ma: any) => sum + ((ma.avg_attendance || 0) * (ma.total_reports || 0)), 0);
            const churchHealthScore = ministryAnalyticsData.length > 0
                ? Math.round(ministryAnalyticsData.reduce((sum: number, ma: any) => sum + (ma.health_score || 0), 0) / ministryAnalyticsData.length)
                : 0;
            const healthyMinistries = ministryAnalyticsData.filter((ma: any) => (ma.health_score || 0) >= 70).length;
            const atRiskMinistries = ministryAnalyticsData.filter((ma: any) => (ma.health_score || 0) < 40).length;
            const totalSalvations = ministryAnalyticsData.reduce((sum: number, ma: any) => sum + (ma.salvations || 0), 0);
            const totalVolunteers = ministryMembers.length;

            setData(prev => ({
                ...prev,
                totalMembers: profiles.length,
                newMembersThisMonth: newMembers,
                activeToday,
                avgStreak,
                lastSundayAttendance: recon?.total_physical || prev.lastSundayAttendance,
                weeklyAvgAttendance: Math.round((recon?.total_physical || prev.lastSundayAttendance) * 0.95),
                salvations: pulse.total_salvations,
                baptisms: pulse.total_baptisms,
                prayerActive: prayers.filter(p => p.status === 'Pending').length,
                prayerAnswered: prayers.filter(p => p.status === 'Answered').length,
                engagementScore: healthRes.data?.[0]?.score || prev.engagementScore,
                alertMembers: mappedAlerts.length > 0 ? mappedAlerts : prev.alertMembers,
                counselingQueue: pastoralNotes.map(n => ({
                    name: (n.member as any)?.name || 'Member',
                    category: n.category,
                    leader: 'Pastor',
                    date: format(new Date(n.created_at), 'MMM d'),
                    urgent: n.category === 'crisis'
                })),
                staffingGaps: detectedGaps,
                householdData: [{ month: format(now, 'MMM'), ...hhSplit }],
                ministryData: ministryData.length > 0 ? ministryData : prev.ministryData,
                evangelismFunnel: pipelineFunnel,
                discipleshipData: (pipelineFunnel || []).map(f => ({ label: f?.name, count: f?.value || 0 })),
                skillsData: skillsData.length > 0 ? skillsData : prev.skillsData,
                geoClusters: geoClusters.length > 0 ? geoClusters : prev.geoClusters,
                devotionTrend: liveTrend.length > 0 || soapEntries.length > 0 ? liveTrend : prev.devotionTrend,
                soapSentiment: liveSentiment.length > 0 ? liveSentiment : prev.soapSentiment,
                churchHealth: {
                    totalMinistryTouches,
                    churchHealthScore,
                    healthyMinistries,
                    atRiskMinistries,
                    totalSalvations,
                    overdueMinistries: 0,
                    totalVolunteers,
                }
            }));
        } catch (e) {
            console.error("Dashboard Load Error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const engagementRing = 2 * Math.PI * 40;

    return (
        <div className="space-y-10 pb-16">

            {/* ─── ROW 0: AI CHURCH HEALTH METRICS ─── */}
            {data.churchHealth && (
                <section>
                    <SectionHeader title="AI Church Health Summary" subtitle="Aggregated metadata computed across all ministries" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                        <MetricCard title="Touches" value={data.churchHealth.totalMinistryTouches} icon={Users} accentColor="cyan" />
                        <MetricCard title="Health Score" value={`${data.churchHealth.churchHealthScore}%`} icon={Heart} accentColor={data.churchHealth.churchHealthScore >= 70 ? 'emerald' : 'amber'} />
                        <MetricCard title="Healthy Min" value={data.churchHealth.healthyMinistries} icon={CheckCircle2} accentColor="emerald" />
                        <MetricCard title="At-Risk Min" value={data.churchHealth.atRiskMinistries} icon={AlertTriangle} accentColor="red" />
                        <MetricCard title="Salvations" value={data.churchHealth.totalSalvations} icon={Flame} accentColor="violet" />
                        <MetricCard title="Volunteers" value={data.churchHealth.totalVolunteers} icon={ShieldCheck} accentColor="blue" />
                    </div>
                </section>
            )}

            {/* ─── ROW 1: CORE METRICS ─── */}
            <section>
                <div className="flex items-center justify-between mb-5">
                    <SectionHeader title="Core Church Metrics" subtitle="Real-time congregational data — updated daily" />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowOnboarding(!showOnboarding)}
                            className={`bg-muted border-border text-foreground font-black rounded-xl h-12 px-6 ${showOnboarding ? 'bg-primary/20 border-primary' : ''}`}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {showOnboarding ? "CLOSE ONBOARDING" : "ONBOARD LEADERS"}
                        </Button>
                        <Button
                            onClick={runIntelligence}
                            disabled={runningAI}
                            variant="outline"
                            className="bg-muted border-border text-foreground font-black rounded-xl h-12 px-6"
                        >
                            {runningAI ? "PROCESSING..." : "ACTIVATE PI LAYER"}
                            <Flame className={`w-4 h-4 ml-2 text-amber-500 ${runningAI ? 'animate-pulse' : ''}`} />
                        </Button>
                        <UsherReportModal registeredCount={data.lastSundayAttendance} onReportSubmitted={loadData} />
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 mb-10">
                    {membershipRequests.length > 0 && (
                        <Card className="bg-card border-primary/30 flex-1 overflow-hidden">
                            <CardHeader className="bg-primary/10 border-b border-border py-3">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
                                    <span>New Membership Pipeline</span>
                                    <Badge className="bg-primary text-primary-foreground border-0">{membershipRequests.length} PENDING</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {membershipRequests.map(req => (
                                        <div key={req.id} className="p-4 flex items-center justify-between hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">
                                                    {req.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{req.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{req.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMembershipAction(req.id, 'member')}
                                                    className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px]"
                                                >
                                                    APPROVE
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleMembershipAction(req.id, 'visitor')}
                                                    className="h-8 rounded-lg text-muted-foreground hover:text-red-500 font-black text-[10px]"
                                                >
                                                    REJECT
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {showOnboarding && (
                        <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                            <MinistryOnboarding />
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <MetricCard title="Total Members" value={data.totalMembers}
                        sub={`+${data.newMembersThisMonth} this month`} trend="up" trendVal={`+${data.memberGrowthPct}%`}
                        icon={Users} accentColor="blue" />
                    <MetricCard title="Active Engagement" value={`${data.engagementScore}/100`}
                        sub={`Avg streak: ${data.avgStreak} days`} trend="up" trendVal="+6pts"
                        icon={Activity} accentColor="violet" />
                    <MetricCard title="Last Sunday Attendance" value={data.lastSundayAttendance}
                        sub={`Weekly avg: ${data.weeklyAvgAttendance}`} trend="up" trendVal="+7%"
                        icon={Calendar} accentColor="emerald" />
                    <MetricCard title="AI Alerts This Week" value={data.criticalAlerts}
                        sub={`${data.prayerActive} active prayer needs`} trend="down" trendVal="3 resolved"
                        icon={AlertTriangle} accentColor="red" />
                </div>
            </section>

            {/* ─── ENGAGEMENT SCORE GAUGE + ATTENDANCE TREND ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engagement Gauge */}
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Congregation Engagement Score</p>
                    <svg width="140" height="140" className="rotate-[-135deg]">
                        <circle cx="70" cy="70" r="55" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="12" className="text-foreground" />
                        <motion.circle cx="70" cy="70" r="55" fill="none" stroke="url(#engGrad)" strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(2 * Math.PI * 55) * 0.75}`}
                            initial={{ strokeDashoffset: (2 * Math.PI * 55) * 0.75 }}
                            animate={{ strokeDashoffset: (2 * Math.PI * 55) * 0.75 * (1 - (data.engagementScore / 100)) }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="engGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="-mt-16 text-center">
                        <p className="text-4xl font-black text-foreground">{data.engagementScore}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">/ 100</p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                        {[
                            { label: 'Devotion', pct: 30 },
                            { label: 'Attendance', pct: 25 },
                            { label: 'Ministry', pct: 25 },
                        ].map(f => (
                            <div key={f.label} className="text-center">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(data.engagementScore / 100) * f.pct * 3}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance Reconciliation Card (Integrated Digital Ministry Data) */}
                <AttendanceReconciliationCard />
            </div>

            {/* ─── ROW 2: SPIRITUAL HEALTH ANALYTICS ─── */}
            <section>
                <SectionHeader title="Spiritual Health Analytics" subtitle="Congregational Spiritual Pulse — AI-powered" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Devotion Heatmap */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Devotion Completion Heatmap</p>
                        <p className="text-[10px] text-muted-foreground/60 mb-4">Daily engagement — last 14 days</p>
                        <div className="space-y-1.5">
                            {data.devotionTrend.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <p className="text-[9px] text-muted-foreground/40 w-7 text-right font-mono">{d.day}</p>
                                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${d.pct}%` }}
                                            transition={{ delay: i * 0.03, duration: 0.6 }}
                                            className="h-full rounded-sm"
                                            style={{
                                                background: d.pct > 70 ? '#8b5cf6' : d.pct > 50 ? '#6d28d9' : '#4c1d95',
                                                opacity: 0.3 + (d.pct / 100) * 0.7
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/60 w-6 font-bold">{d.pct}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Completion Rate Bar */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Daily Completion Rate</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.devotionTrend} barSize={12}>
                                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                                <Bar dataKey="completions" name="Completions" radius={[4, 4, 0, 0]} fill="url(#devGrad)">
                                    <defs>
                                        <linearGradient id="devGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#4c1d95" />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* SOAP Sentiment */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">SOAP Sentiment Analysis</p>
                        <p className="text-[10px] text-muted-foreground/60 mb-3">Anonymized journal emotional themes</p>
                        <ResponsiveContainer width="100%" height={120}>
                            <PieChart>
                                <Pie data={data.soapSentiment} cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                                    dataKey="value" stroke="none">
                                    {data.soapSentiment.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} opacity={0.85} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE.contentStyle} itemStyle={CUSTOM_TOOLTIP_STYLE.itemStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {data.soapSentiment.map(s => (
                                <div key={s.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                                        <p className="text-[10px] text-muted-foreground font-medium">{s.name}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-foreground">{s?.value || 0}%</p>
                                </div>
                            ))}
                        </div>
                        {/* Word Cloud */}
                        <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Top Themes</p>
                            <div className="flex flex-wrap gap-1">
                                {data.wordCloud.slice(0, 10).map((w, i) => (
                                    <span key={w} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                        style={{
                                            background: `rgba(139,92,246,${0.1 + (i / 10) * 0.2})`,
                                            color: `rgba(167,139,250,${0.5 + (i / 10) * 0.5})`,
                                            fontSize: `${9 + (10 - i) * 0.6}px`
                                        }}>
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── GROWTH METRICS ROW ─── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'New Families', val: data.newFamilies, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'This month' },
                    { label: 'Salvations', val: data.salvations, icon: Flame, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: 'This month' },
                    { label: 'Baptisms', val: data.baptisms, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'This month' },
                ].map(g => (
                    <div key={g.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-12 h-12 rounded-2xl ${g.bg} flex items-center justify-center`}>
                            <g.icon className={`w-6 h-6 ${g.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground">{g.val}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{g.label} · {g.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── ROW 3: PASTORAL CARE INTELLIGENCE ─── */}
            <section>
                <SectionHeader title="Pastoral Care Command Center" subtitle="Crisis detection, prayer management, counseling queue" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Prayer Request Tracker */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Prayer Request Tracker</p>
                        <div className="flex items-center gap-4 mb-4">
                            <ResponsiveContainer width={100} height={100}>
                                <PieChart>
                                    <Pie data={data.prayerCategories} cx="50%" cy="50%" innerRadius={28} outerRadius={48}
                                        dataKey="value" stroke="none">
                                        {data.prayerCategories.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} opacity={0.85} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-foreground">{data.prayerActive}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Active</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-emerald-500 font-black">{data.prayerAnswered}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Answered</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {data.prayerCategories.map(cat => (
                                <div key={cat.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                    <p className="text-[10px] text-muted-foreground flex-1">{cat.name}</p>
                                    <p className="text-[10px] font-black text-foreground/60">{cat?.value || 0}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Member Care Alerts */}
                    <div className="bg-card border border-red-500/20 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black text-red-400 uppercase tracking-widest">Care Alerts</p>
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px] font-black">{data.alertMembers.length} FLAGGED</Badge>
                        </div>
                        <div className="space-y-2">
                            {data.alertMembers.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-xs font-black text-red-400 flex-shrink-0">
                                            {m.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground leading-none">{m.name}</p>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">
                                                {m.days_inactive}d inactive · Streak: {m.current_streak}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${m.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {m.risk_level}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Counseling Queue */}
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Counseling Queue</p>
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[9px]">LIVE</Badge>
                        </div>
                        <div className="space-y-3">
                            {data.counselingQueue.length > 0 ? data.counselingQueue.map((c, i) => (
                                <div key={i} className="flex items-start justify-between gap-2 pb-3 border-b border-border last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                                            {c.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                                        </div>
                                        <p className="text-[9px] text-primary font-bold">{c.category}</p>
                                        <p className="text-[9px] text-muted-foreground">→ {c.leader} · {c.date}</p>
                                    </div>
                                    <Button variant="ghost" className="h-7 px-2 text-[9px] font-black text-violet-400 hover:bg-violet-500/10 rounded-lg flex-shrink-0">
                                        FOLLOW UP
                                    </Button>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No active queue</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ROW 4: MINISTRY HEALTH ─── */}
            <section>
                <SectionHeader title="Ministry Engagement" subtitle="25 active ministry teams — staffing analysis" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Skills Heatmap (NEW) */}
                    <div className="bg-card border border-border rounded-2xl p-5 md:col-span-3 mb-4 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Congregational Skills Heatmap</p>
                                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase mt-1">Available talents for ministry placement</p>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black">{data.skillsData.length} SPECIALIZATIONS</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {data.skillsData.map((skill, i) => (
                                <motion.div
                                    key={skill.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center text-center group hover:bg-primary/5 hover:border-primary/20 transition-all cursor-default shadow-sm"
                                >
                                    <p className="text-[10px] font-black text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{skill.name}</p>
                                    <p className="text-xl font-black text-foreground mt-1">{skill.count}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Ministry Participation Bar */}
                    <div className="bg-card border border-border rounded-2xl p-5 md:col-span-2 shadow-sm">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Ministry Leadership Split</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data.ministryData} layout="vertical" barSize={10}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                                <Bar dataKey="count" name="Members" radius={[0, 4, 4, 0]} fill="url(#minGrad)">
                                    <defs>
                                        <linearGradient id="minGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#4c1d95" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Volunteer Pipeline Funnel */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Discipleship Pipeline</p>
                        <div className="space-y-3">
                            {data.discipleshipData.map(stage => (
                                <div key={stage.label} className="flex items-center gap-2">
                                    <p className="text-[9px] text-muted-foreground/60 w-20 text-right font-bold">{stage.label}</p>
                                    <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stage.count / (data.totalMembers || 1)) * 100}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                    <p className="text-[9px] font-black text-muted-foreground w-6">{stage.count}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border">
                            <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider mb-2">Staffing Gaps ⚠️</p>
                            {data.staffingGaps.length > 0 ? data.staffingGaps.map(m => (
                                <div key={m} className="flex items-center justify-between py-1">
                                    <p className="text-[10px] text-amber-400 font-medium">{m}</p>
                                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md">NEEDS TEAM</span>
                                </div>
                            )) : (
                                <p className="text-[9px] text-emerald-400/50 font-bold">All ministries healthy</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ROW 4.5: GEOGRAPHIC INTELLIGENCE ─── */}
            <section className="mb-8">
                <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden min-h-[350px] shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 relative z-10">Global Mission Coverage</p>
                    <div className="absolute inset-0 grayscale opacity-20 pointer-events-none"
                        style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {[
                            { name: 'CHIBA', lat: '35.6074 N', lon: '140.1063 E', active: 45 },
                            { name: 'KOBE', lat: '34.6901 N', lon: '135.1955 E', active: 22 },
                            { name: 'SAITAMA', lat: '35.8617 N', lon: '139.6455 E', active: 31 },
                            { name: 'GLOBAL', lat: 'ONLINE', lon: 'PORTAL', active: 56 },
                        ].map((loc, i) => (
                            <motion.div
                                key={loc.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-muted backdrop-blur-md p-5 rounded-2xl border border-border"
                            >
                                <p className="text-[10px] text-muted-foreground/60 font-black uppercase mb-1 tracking-widest">{loc.name}</p>
                                <p className="text-lg font-black text-foreground">{loc.active}</p>
                                <p className="text-[8px] text-muted-foreground/30 font-mono mt-1">{loc.lat} / {loc.lon}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="absolute bottom-8 right-8 z-10">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-border text-muted-foreground font-black hover:bg-muted">
                            <Globe className="w-4 h-4 mr-2" />
                            VIEW LIVE NETWORK MAP
                        </Button>
                    </div>
                </div>
            </section>

            {/* ─── ROW 5: GROWTH INTELLIGENCE ─── */}
            <section>
                <SectionHeader title="Growth Intelligence" subtitle="Church expansion analytics & evangelism pipeline" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Household Growth */}
                    <div className="bg-card border border-border rounded-2xl p-5 md:col-span-2">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Household Growth (6 Months)</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.householdData} barSize={14}>
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                                <Bar dataKey="families" name="Families" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="couples" name="Couples" stackId="a" fill="#06b6d4" />
                                <Bar dataKey="singles" name="Singles" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-3">
                            {[{ label: 'Families', color: '#8b5cf6' }, { label: 'Couples', color: '#06b6d4' }, { label: 'Singles', color: '#34d399' }].map(l => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                                    <p className="text-[9px] text-muted-foreground/30 font-bold">{l.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evangelism Pipeline */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Evangelism Pipeline</p>
                        <div className="space-y-2">
                            {data.evangelismFunnel.map((stage, i) => {
                                const firstVal = data?.evangelismFunnel?.[0]?.value || 1;
                                const pct = Math.round(((stage?.value || 0) / firstVal) * 100);
                                const prevVal = data?.evangelismFunnel?.[i - 1]?.value || stage?.value || 1;
                                const dropOff = i > 0 ? Math.round(((prevVal - (stage?.value || 0)) / prevVal) * 100) : 0;
                                return (
                                    <div key={stage.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[9px] text-muted-foreground/40 font-bold">{stage.name}</p>
                                            <div className="flex items-center gap-2">
                                                {dropOff > 0 && <span className="text-[8px] text-red-400 font-bold">-{dropOff}%</span>}
                                                <p className="text-[9px] font-black text-muted-foreground">{stage?.value || 0}</p>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-muted rounded-md overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: i * 0.1, duration: 0.8 }}
                                                className="h-full rounded-md"
                                                style={{
                                                    background: `linear-gradient(90deg, #8b5cf6, #06b6d4)`,
                                                    opacity: 1 - (i * 0.12)
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border">
                            <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-wider">Overall Conversion</p>
                            <p className="text-2xl font-black text-violet-400">
                                {data?.evangelismFunnel && data.evangelismFunnel.length > 0 ? Math.round(((data.evangelismFunnel[data.evangelismFunnel.length - 1]?.value || 0) / (data.evangelismFunnel[0]?.value || 1)) * 100) : 0}%
                            </p>
                            <p className="text-[9px] text-muted-foreground/30">Visitor → Membership rate</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── BOTTOM: GROWTH STATS + AI SUMMARY ─── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Church Growth Summary */}
                <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-6">
                    <p className="text-xs font-black text-violet-300 uppercase tracking-widest mb-4">Church Health Score Breakdown</p>
                    <div className="space-y-3">
                        {[
                            { label: 'Spiritual Engagement', score: 74, max: 100 },
                            { label: 'Attendance & Retention', score: 82, max: 100 },
                            { label: 'Ministry Participation', score: 61, max: 100 },
                            { label: 'Financial Stewardship', score: 68, max: 100 },
                            { label: 'Pastoral Care Load', score: 55, max: 100 },
                        ].map(f => (
                            <div key={f.label}>
                                <div className="flex justify-between mb-1">
                                    <p className="text-[10px] text-muted-foreground/80">{f.label}</p>
                                    <p className="text-[10px] font-black text-violet-300">{f.score}/100</p>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${f.score}%` }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-violet-500 rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Daily Summary */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Morning Pastor Briefing</p>
                    <div className="space-y-3">
                        {[
                            { q: "Who needs care now?", a: data.alertMembers.length > 0 ? `${data.alertMembers.length} members flagged for inactivity. ${data.prayerActive} crisis prayers unresolved.` : "All active members are engaged. No critical risks detected.", color: "text-red-400" },
                            { q: "Where is God moving?", a: `Youth attendance surged 24%. ${data.newMembersThisMonth} new arrivals this month.`, color: "text-emerald-400" },
                            { q: "Where must church go?", a: "Shinagawa area showing high density—consider new Circle. Media Ministry needs 2 volunteers.", color: "text-violet-400" },
                        ].map(b => (
                            <div key={b.q} className="p-3 bg-muted rounded-xl border border-border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1">{b.q}</p>
                                <p className={`text-xs font-semibold ${b.color}`}>{b.a}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex justify-between text-[9px] text-muted-foreground/30">
                        <span>AI Analysis · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        <span>JST +09:00</span>
                    </div>
                </div>
            </section>

            {/* ─── ROW 6: FINANCIAL STEWARDSHIP (NEW) ─── */}
            <section>
                <SectionHeader title="Financial Stewardship" subtitle="Giving trends & budget intelligence — confidential leadership view" />
                <div className="bg-card border border-border rounded-3xl p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                            <p className="text-4xl font-black text-foreground">¥ {(data.givingData[data.givingData.length - 1]?.amount || 0).toLocaleString()}</p>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-1">This Month's Tithes & Offerings</p>
                            <div className="mt-6 space-y-4">
                                <div className="p-4 rounded-2xl bg-muted border border-border">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase mb-1">Growth Index</p>
                                    <p className="text-lg font-black text-emerald-400">+12.4% <span className="text-[10px] text-muted-foreground/30 font-bold ml-1">vs Average</span></p>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted border border-border">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase mb-1">Projected March Total</p>
                                    <p className="text-lg font-black text-foreground">¥ 1,420,000</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.givingData} barSize={40}>
                                    <defs>
                                        <linearGradient id="giveGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#064e3b" />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                                    <Bar dataKey="amount" name="Giving (JPY)" radius={[8, 8, 0, 0]} fill="url(#giveGrad)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
