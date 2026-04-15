"use client";

import { usePastorCtx } from "./pastor-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { basePath as BP } from "@/lib/utils";
import {
    Users, TrendingUp, DollarSign, Activity,
    ArrowUpRight, ArrowDownRight, MessageSquare,
    ShieldAlert, Mail, Calendar, Sparkles,
    BarChart3, PieChart, LineChart, Loader2,
    UserPlus, Clock, Edit3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getPastorDashboardData } from "@/lib/pastor-hq-actions";
import { withRoleGuard } from "@/components/auth/withRoleGuard";
import { PendingActionsCard } from "./components/PendingActionsCard";
import { EmailComposer } from "./components/EmailComposer";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function PastorHQDashboard() {
    const { userName, orgId } = usePastorCtx();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showComposer, setShowComposer] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const dashboardData = await getPastorDashboardData(orgId);
                setData(dashboardData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        if (orgId) loadData();
    }, [orgId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Synchronizing Intelligence</p>
            </div>
        );
    }

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-12"
        >
            {/* Header / Welcome */}
            <header className="flex flex-col gap-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase transition-colors">
                    Good Morning, <span className="text-violet-600">{userName || "Pastor"}</span>
                </h2>
                <div className="flex items-center gap-2">
                    <p className="text-muted-foreground font-medium tracking-wide">
                        The spiritual and strategic climate of this church is categorized as
                    </p>
                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10">
                        {data?.climate?.theme || "Vibrant"}
                    </span>
                </div>
            </header>

            {/* Compose Broadcast */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowComposer(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/25 transition-all"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    Compose Broadcast
                </button>
            </div>

            {/* Panel 1: Church Pulse */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Church Pulse</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Real-time Engagement & Growth</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <PulseCard
                        label="Members"
                        value={data?.pulse.totalMembers.toLocaleString()}
                        trend={`+${data?.pulse.trends.members}`}
                        icon={Users}
                        trendUp={true}
                    />
                    <PulseCard
                        label="Visitors"
                        value={data?.pulse.newSeekers}
                        trend={`+${data?.pulse.trends.seekers}`}
                        icon={Sparkles}
                        trendUp={true}
                    />
                    <PulseCard
                        label="Pending"
                        value={data?.pulse.pendingMembers}
                        trend="applications"
                        icon={Clock}
                        trendUp={false}
                    />
                    <PulseCard
                        label="Volunteers"
                        value={data?.pulse.volunteerApplications}
                        trend="awaiting approval"
                        icon={UserPlus}
                        trendUp={false}
                    />
                    <PulseCard
                        label="Weekly Attendance"
                        value={data?.pulse.weeklyAttendance}
                        trend={`${data?.pulse.trends.attendance}%`}
                        icon={Activity}
                        trendUp={data?.pulse.trends.attendance > 0}
                    />
                    <PulseCard
                        label="Retention"
                        value={`${data?.pulse.retentionRate}%`}
                        trend={`+${data?.pulse.trends.retention}%`}
                        icon={TrendingUp}
                        trendUp={true}
                    />
                </div>
            </section>

            {/* Pending Actions */}
            {orgId && (
                <section className="space-y-4">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Pending Actions</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Items Requiring Attention</p>
                    </div>
                    <PendingActionsCard orgId={orgId} />
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel 2: Financial Stewardship */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Financial Stewardship</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Provision & Trends</p>
                        </div>
                        <button className="text-xs font-black text-violet-500 uppercase tracking-widest">View Giving Log</button>
                    </div>

                    <Card className="rounded-[2rem] border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-border">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Monthly Income</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black tracking-tighter">¥{data?.finance.monthlyIncome.toLocaleString()}</p>
                                        <span className="text-xs font-bold text-emerald-500">+{data?.finance.incomeTrend}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Budget Performance</p>
                                    <p className="text-3xl font-black tracking-tighter text-violet-500">{data?.finance.budgetPerformance}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Top Giving Ministry</p>
                                    <p className="text-3xl font-black tracking-tighter uppercase">{data?.finance.topMinistry}</p>
                                </div>
                            </div>
                            
                            {data?.finance?.monthlyBreakdown?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.finance.monthlyBreakdown} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                                        <XAxis
                                            dataKey="month_start"
                                            tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={52}
                                        />
                                        <Tooltip
                                            formatter={(v: any) => [`¥${Number(v ?? 0).toLocaleString()}`, 'Giving']}
                                            labelFormatter={(l) => new Date(l).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem', fontSize: 11 }}
                                        />
                                        <Bar dataKey="total_amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                            {(data.finance.monthlyBreakdown as any[]).map((_: any, i: number) => (
                                                <Cell key={i} fill={i === data.finance.monthlyBreakdown.length - 1 ? '#8b5cf6' : '#8b5cf640'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-border rounded-3xl">
                                    <div className="text-center space-y-2 opacity-40">
                                        <DollarSign className="w-10 h-10 mx-auto text-violet-500" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No giving data yet</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Panel 5: Correspondence Hub */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Correspondence Hub</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Direct Access Channels</p>
                        </div>
                    </div>

                    <Card className="rounded-[2.5rem] border-border bg-card/40 backdrop-blur-sm h-full overflow-hidden">
                        <CardContent className="p-0">
                            {[
                                { label: "Prayer Requests", count: data?.correspondence.memberMessages, icon: MessageSquare, color: "bg-violet-500", href: "/pastor-hq/prayer-requests" },
                                { label: "Website Inquiries", count: data?.correspondence.websiteInquiries, icon: Mail, color: "bg-blue-500", href: "/pastor-hq/inquiries" },
                                { label: "Admin Direct", count: data?.correspondence.adminDirect, icon: Activity, color: "bg-emerald-500", href: "/pastor-hq/inquiries" },
                                { label: "Email Campaigns", count: data?.correspondence.externalGmail, icon: Mail, color: "bg-red-500", href: "/shepherd/dashboard/campaigns/" },
                            ].map((channel, i) => (
                                <Link
                                    key={channel.label}
                                    href={channel.href.startsWith('http') ? channel.href : `${BP}${channel.href}`}
                                    className={`w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-all border-b border-border last:border-0 ${i === 0 ? 'bg-muted/30' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${channel.color}/20 flex items-center justify-center`}>
                                            <channel.icon className={`w-5 h-5 text-current opacity-80`} style={{ color: channel.color.replace('bg-', '') }} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-tight">{channel.label}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tap to view stream</p>
                                        </div>
                                    </div>
                                    {channel.count > 0 && (
                                        <div className={`${channel.color} text-white text-[10px] font-black px-2 py-0.5 rounded-full`}>
                                            {channel.count}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel 3: Ministry Health Monitor */}
                <section className="space-y-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Ministry Health Monitor</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Operational Scores</p>
                    </div>
                    
                    <Card className="rounded-[2.5rem] border-border overflow-hidden">
                        <div className="p-8 space-y-6">
                            {data?.ministriesHealth.map((m: any, i: number) => (
                                <MinistryHealthRow key={i} label={m.name} score={m.score} status={m.status} color={m.color} />
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Panel 4: Congregational Care Alerts */}
                <section className="space-y-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Congregational Care Alerts</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">AI-Detected Priority Intervention</p>
                    </div>

                    <Card className="rounded-[2.5rem] border-violet-500/20 bg-violet-500/5 overflow-hidden">
                        <div className="p-8 space-y-4">
                            {data?.careAlerts.map((alert: any, i: number) => (
                                <CareAlertRow 
                                    key={i} 
                                    name={alert.name} 
                                    issue={alert.issue} 
                                    urgency={alert.urgency} 
                                    action={alert.action} 
                                />
                            ))}
                        </div>
                    </Card>
                </section>
            </div>
            {showComposer && orgId && (
                <EmailComposer orgId={orgId} onClose={() => setShowComposer(false)} />
            )}
        </motion.div>
    );
}

function PulseCard({ label, value, trend, icon: Icon, trendUp }: any) {
    return (
        <motion.div variants={item}>
            <Card className="rounded-[1.5rem] border-border bg-card/60 hover:border-violet-500 transition-all duration-300">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className={`flex items-center text-[10px] font-black ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black tracking-tighter">{value}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function MinistryHealthRow({ label, score, status, color }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex flex-col">
                <p className="text-sm font-black uppercase tracking-tight">{label}</p>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${color}`}>{status}</span>
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full bg-current ${color}`} style={{ width: `${score}%` }} />
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-black tracking-tighter">{score}%</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Activity Score</p>
            </div>
        </div>
    );
}

function CareAlertRow({ name, issue, urgency, action }: any) {
    return (
        <div className="p-4 rounded-2xl bg-background/60 border border-violet-500/10 flex items-center justify-between group hover:border-violet-500/40 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/10 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-tight">{name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">{issue}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{action}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Suggested Action</p>
                </div>
                <button className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}


export default withRoleGuard(PastorHQDashboard, ['pastor', 'super_admin', 'owner']);
