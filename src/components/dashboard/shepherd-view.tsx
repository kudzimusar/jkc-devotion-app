"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    Heart,
    MessageSquare,
    TrendingUp,
    Users,
    Globe,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    User,
    ChevronRight,
    Milestone,
    CreditCard,
    Plus,
    X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProfileView } from "@/components/profile/connection-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ShepherdStats {
    totalMembers: number;
    activeToday: number;
    completionRate: number;
    alertsCount: number;
}

interface Member {
    id: string;
    name: string;
    email: string;
    lastActive: string;
    streak: number;
    completion: number;
    risk: 'low' | 'medium' | 'high';
}

interface PrayerHubRequest {
    id: string;
    userName: string;
    text: string;
    status: 'Received' | 'Assigned' | 'Answered';
    date: string;
}

export function ShepherdView({ lang = 'EN' }: { lang: 'EN' | 'JP' }) {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const t = {
        pulse: lang === 'EN' ? 'Transformation Pulse' : '変革の鼓動',
        active: lang === 'EN' ? 'Active Members' : '活動中のメンバー',
        alerts: lang === 'EN' ? 'Shepherd Alerts' : '羊飼いのアラート',
        prayer: lang === 'EN' ? 'Prayer Needs' : '祈りの必要',
    };

    const [stats, setStats] = useState<ShepherdStats>({
        totalMembers: 0,
        activeToday: 0,
        completionRate: 0,
        alertsCount: 0
    });

    const [members, setMembers] = useState<Member[]>([]);
    const [prayerRequests, setPrayerRequests] = useState<PrayerHubRequest[]>([]);
    const [anonymizedTopics, setAnonymizedTopics] = useState<string[]>(['Faith', 'Japan', 'Youth', 'Family', 'Peace', 'Identity', 'Grace']);
    const [worshipTeamCount, setWorshipTeamCount] = useState<number>(0);
    const [totalGiving, setTotalGiving] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();

        // Real-time listener for profiles/journals
        const profilesSub = supabase.channel('profiles-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                loadDashboardData(); // Refresh on changes
            })
            .subscribe();

        const statsSub = supabase.channel('stats-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'member_stats' }, payload => {
                loadDashboardData(); // Refresh on changes
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profilesSub);
            supabase.removeChannel(statsSub);
        };
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const { data: profiles } = await supabase.from('profiles').select('*');
            const { data: statsData } = await supabase.from('member_stats').select('*');
            const { data: pastoralNotes } = await supabase.from('pastoral_notes').select('*');
            const { data: journals } = await supabase.from('journals').select('observation, prayer, created_at');

            // Process members
            if (profiles) {
                const processedMembers = profiles.map(p => {
                    const mStats = statsData?.find(s => s.user_id === p.id);
                    const streak = mStats?.current_streak || 0;
                    const completion = mStats?.completed_devations || mStats?.completed_devotions || 0;

                    const lastActiveDate = mStats?.last_devotion_date || p.created_at;
                    const daysSinceActive = Math.floor((new Date().getTime() - new Date(lastActiveDate).getTime()) / (1000 * 3600 * 24));

                    let risk: 'low' | 'medium' | 'high' = 'low';
                    if (daysSinceActive >= 3 || streak === 0 && completion > 0) risk = 'high';
                    else if (daysSinceActive === 2) risk = 'medium';

                    return {
                        id: p.id,
                        name: p.name || 'Anonymous',
                        email: p.email || '',
                        lastActive: new Date(lastActiveDate).toISOString().split('T')[0],
                        streak,
                        completion: completion * 10, // Mock percentage
                        risk
                    };
                });
                setMembers(processedMembers);

                const totalMembers = profiles.length;
                const activeToday = statsData?.filter(s => {
                    const d = new Date(s.last_devotion_date);
                    const today = new Date();
                    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                }).length || 0;
                const alertsCount = processedMembers.filter(m => m.risk === 'high').length;
                const avgCompletion = processedMembers.length > 0 ? processedMembers.reduce((acc, m) => acc + m.completion, 0) / processedMembers.length : 0;

                setStats({
                    totalMembers,
                    activeToday,
                    completionRate: Math.round(avgCompletion),
                    alertsCount
                });
            }

            // Since Ministry Roles and Stewardship might be stored in separate tables or local storage (as done in connection-card.tsx by ExtendedProfileService),
            // We will mock the aggregation across the congregation. In a real scenario, this would be a DB aggregation query.
            setWorshipTeamCount(Math.floor(Math.random() * 10) + 10); // Example: 10 to 20
            setTotalGiving(Math.floor(Math.random() * 500000) + 500000); // Example: 500k to 1M Yen

            // Process journals for anonymized topics
            if (journals && journals.length > 0) {
                const text = journals.map(j => (j.observation || '') + ' ' + (j.prayer || '')).join(' ').toLowerCase();
                const words = text.split(/\s+/).filter(w => w.length > 4);
                // Simple frequency extraction (simulated API/AI processing)
                const freq: Record<string, number> = {};
                words.forEach(w => freq[w] = (freq[w] || 0) + 1);
                const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
                if (topWords.length > 0) {
                    // Capitalize first letter
                    setAnonymizedTopics(topWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)));
                }
            }

            // Mock prayer requests fallback since there is no prayer_requests table mentioned, using local storage or mock
            const prsStr = localStorage.getItem('mock_global_prayer_requests');
            if (prsStr) {
                setPrayerRequests(JSON.parse(prsStr));
            } else {
                setPrayerRequests([
                    { id: '1', userName: 'Anonymous', text: 'Pray for my family back home.', status: 'Received', date: '2026-03-04' },
                ]);
            }

        } catch (e) {
            console.error("Dashboard data load error", e);
        } finally {
            setLoading(false);
        }
    }

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <Tabs defaultValue="overview" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <TabsList className="bg-black/20 p-1 rounded-full h-12">
                        <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-primary">Pulse Overview</TabsTrigger>
                        <TabsTrigger value="directory" className="rounded-full px-6 data-[state=active]:bg-primary">Member Directory</TabsTrigger>
                        <TabsTrigger value="care" className="rounded-full px-6 data-[state=active]:bg-primary">Care Hub</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <Button variant="outline" className="glass rounded-full text-xs font-black gap-2 h-10 border-white/10">
                            <Download className="w-3 h-3" /> EXPORT REPORT
                        </Button>
                        <Button className="bg-primary rounded-full text-xs font-black gap-2 h-10 shadow-lg shadow-primary/20">
                            <Plus className="w-3 h-3" /> ADD MEMBER
                        </Button>
                    </div>
                </div>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                    {/* Header Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="glass border-white/10 bg-white/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-40">{t.pulse}</CardTitle>
                                <Activity className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{stats.completionRate}%</div>
                                <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">Church Journey Progress</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-white/10 bg-white/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-40">{t.active}</CardTitle>
                                <Users className="h-4 w-4 text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{stats.activeToday}</div>
                                <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">Devotions Read Today</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-red-500/20 bg-red-500/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-red-400">{t.alerts}</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-red-500">{stats.alertsCount}</div>
                                <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">Inactive 3+ Days</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-white/10 bg-white/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-40">{t.prayer}</CardTitle>
                                <Heart className="h-4 w-4 text-pink-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{prayerRequests.filter(r => r.status !== 'Answered').length}</div>
                                <p className="text-[10px] font-bold opacity-40 mt-1 uppercase tracking-wider">Unresolved Needs</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Spiritual Health Trend
                                    </CardTitle>
                                    <CardDescription>Engagement frequency across the current week.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64 flex items-end gap-2 pt-10">
                                        {Array.from({ length: 14 }).map((_, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.random() * 60 + 20}%` }}
                                                    className={`w-full ${Math.random() > 0.8 ? 'bg-primary' : 'bg-primary/20'} rounded-t-xl`}
                                                />
                                                <span className="text-[9px] font-black opacity-30">D{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                                    <CardHeader><CardTitle className="text-sm">Ministry & Stewardship</CardTitle></CardHeader>
                                    <CardContent className="space-y-6 pt-2">
                                        <div className="flex items-center justify-between p-4 glass bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Worship Team</p>
                                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Active Members</p>
                                                </div>
                                            </div>
                                            <div className="text-xl font-black">{worshipTeamCount}</div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 glass bg-white/5 border border-white/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Total Giving</p>
                                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">This Month</p>
                                                </div>
                                            </div>
                                            <div className="text-xl font-black">¥{totalGiving.toLocaleString()}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                                    <CardHeader><CardTitle className="text-sm">Anonymized SOAP Topics</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {anonymizedTopics.map((w, i) => (
                                                <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-0 rounded-full px-4 text-xs">
                                                    {w}
                                                </Badge>
                                            ))}
                                        </div>
                                        <p className="text-[10px] mt-6 italic opacity-50">Extracted from community observations and prayers.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Card className="glass border-red-500/20 bg-red-500/5 rounded-[2rem]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase text-red-500">Urgent Focus</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {members.filter(m => m.risk === 'high').map(m => (
                                        <div key={m.id} className="flex items-center justify-between p-4 glass bg-white/5 rounded-2xl">
                                            <div>
                                                <p className="font-bold text-sm">{m.name}</p>
                                                <p className="text-[10px] opacity-50 uppercase">Inactive {m.lastActive}</p>
                                            </div>
                                            <Button size="sm" className="rounded-full bg-red-500 h-8 text-[10px] font-bold">REACH OUT</Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="directory" className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                    <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                        <CardHeader className="pb-0">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl font-black">Member Directory</CardTitle>
                                    <CardDescription>Comprehensive list of all congregants and their digital connection cards.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-12 rounded-full glass border-white/10"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 mt-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-40">
                                        <tr>
                                            <th className="p-6">Member</th>
                                            <th className="p-6">Progress</th>
                                            <th className="p-6">Streak</th>
                                            <th className="p-6">Last Active</th>
                                            <th className="p-6">Status</th>
                                            <th className="p-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMembers.map(member => (
                                            <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                                                            {member.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{member.name}</p>
                                                            <p className="text-[10px] opacity-40">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${member.completion}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold">{member.completion}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-bold text-sm">
                                                    {member.streak} Days
                                                </td>
                                                <td className="p-6 text-xs opacity-60">
                                                    {member.lastActive}
                                                </td>
                                                <td className="p-6">
                                                    <Badge className={`rounded-full px-3 py-1 text-[9px] border-0 font-bold ${member.risk === 'high' ? 'bg-red-500/20 text-red-500' :
                                                        member.risk === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                                                            'bg-green-500/20 text-green-500'
                                                        }`}>
                                                        {member.risk === 'high' ? 'RISK' : member.risk === 'medium' ? 'DRIFTING' : 'ENGAGED'}
                                                    </Badge>
                                                </td>
                                                <td className="p-6">
                                                    <Button variant="ghost" className="rounded-full h-8 text-[10px] font-black gap-2 hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedMember(member)}>
                                                        VIEW CARD <ChevronRight className="w-3 h-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="care" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Prayer Hub */}
                        <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-pink-400" />
                                    Integrated Prayer Hub
                                </CardTitle>
                                <CardDescription>Consolidated needs from across the congregation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {prayerRequests.map(req => (
                                    <div key={req.id} className="p-4 glass bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                                                <div>
                                                    <p className="font-bold text-sm">{req.userName}</p>
                                                    <p className="text-[10px] opacity-40">{req.date}</p>
                                                </div>
                                            </div>
                                            <Badge className={`text-[9px] uppercase font-bold border-0 ${req.status === 'Answered' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                {req.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm opacity-80 leading-relaxed italic">"{req.text}"</p>
                                        <div className="flex justify-end pt-2 border-t border-white/5">
                                            <Button variant="ghost" className="h-8 text-[10px] font-bold">MARK AS UPDATED</Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Pastoral Notes Placeholder */}
                        <Card className="glass border-white/10 bg-white/5 rounded-[2rem]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Pastoral Oversight Logs
                                </CardTitle>
                                <CardDescription>Private notes on counseling and member interactions.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center text-center opacity-40">
                                    <ShieldCheck className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-bold">Select a member to view private pastoral logs.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Connection Card Dialog for Shepard Oversight */}
            <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto rounded-[3rem] glass p-0 border-0">
                    <div className="sticky top-0 z-[100] bg-black/40 backdrop-blur-3xl px-8 py-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-black text-white">{selectedMember?.name[0]}</div>
                            <div>
                                <h2 className="font-black text-xl">{selectedMember?.name}</h2>
                                <p className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Member Connection Card (Leadership View)</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)} className="rounded-full">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                    <div className="p-8">
                        <ProfileView memberId={selectedMember?.id} isAdmin={true} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Download(props: any) {
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    )
}

function ShieldCheck(props: any) {
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
