"use client";

import { useEffect, useState } from "react";
import {
    User as UserIcon,
    Users,
    Calendar,
    Heart,
    Trophy,
    Shield,
    CreditCard,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Plus,
    Save,
    Clock,
    MapPin,
    Globe,
    Milestone
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SoapJournal } from "@/lib/soap-journal";

interface ProfileData {
    id: string;
    name: string;
    email: string;
    birthdate?: string;
    wedding_anniversary?: string;
    physical_address?: string;
    phone_number?: string;
    country_of_origin?: string;
    preferred_language?: string;
}

export function ProfileView() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState({ completed: 0, streak: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileData) {
                setProfile({
                    id: authUser.id,
                    name: profileData.name || '',
                    email: authUser.email || '',
                    birthdate: profileData.birthdate,
                    wedding_anniversary: profileData.wedding_anniversary,
                    physical_address: profileData.physical_address,
                    phone_number: profileData.phone_number,
                    country_of_origin: profileData.country_of_origin,
                    preferred_language: profileData.preferred_language || 'EN',
                });
            }

            // Load Stats
            const journalStats = await SoapJournal.getStats();
            setStats({
                completed: journalStats.completed,
                streak: journalStats.streak
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateProfile() {
        if (!profile) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: profile.name,
                    birthdate: profile.birthdate,
                    wedding_anniversary: profile.wedding_anniversary,
                    physical_address: profile.physical_address,
                    phone_number: profile.phone_number,
                    country_of_origin: profile.country_of_origin,
                    preferred_language: profile.preferred_language,
                })
                .eq('id', profile.id);

            if (error) throw error;
            toast.success("Profile updated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Error updating profile");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-20 flex justify-center"><Clock className="w-8 h-8 animate-spin opacity-20" /></div>;
    }

    if (!profile) return <div>Please log in to view profile details.</div>;

    return (
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Main Info Card */}
                <Card className="glass border-white/20 flex-1 w-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-primary/10 border-b border-white/10 pb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                {profile.name[0]}
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black">{profile.name}</CardTitle>
                                <CardDescription className="font-medium opacity-60">Member since 2026 • {profile.country_of_origin || 'International'}</CardDescription>
                                <div className="flex gap-2 mt-3">
                                    <Badge className="bg-primary/20 text-primary border-primary/20">Active Member</Badge>
                                    <Badge variant="outline" className="border-white/20">{profile.preferred_language === 'JP' ? '日本語' : 'English'}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <Tabs defaultValue="identity" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 rounded-full bg-black/20 p-1 mb-8">
                                <TabsTrigger value="identity" className="rounded-full data-[state=active]:bg-primary">Identity</TabsTrigger>
                                <TabsTrigger value="family" className="rounded-full data-[state=active]:bg-primary">Family</TabsTrigger>
                                <TabsTrigger value="spiritual" className="rounded-full data-[state=active]:bg-primary">Journey</TabsTrigger>
                                <TabsTrigger value="church" className="rounded-full data-[state=active]:bg-primary">Service</TabsTrigger>
                                <TabsTrigger value="giving" className="rounded-full data-[state=active]:bg-primary md:hidden lg:inline-flex">Giving</TabsTrigger>
                                <TabsTrigger value="pastoral" className="rounded-full data-[state=active]:bg-primary">Care</TabsTrigger>
                            </TabsList>

                            {/* IDENTITY TAB */}
                            <TabsContent value="identity" className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Full Name</label>
                                        <Input
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Phone Number</label>
                                        <Input
                                            value={profile.phone_number || ''}
                                            onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12"
                                            placeholder="+81 000-0000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Birthdate</label>
                                        <Input
                                            type="date"
                                            value={profile.birthdate || ''}
                                            onChange={e => setProfile({ ...profile, birthdate: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12 text-white/60"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Wedding Anniversary</label>
                                        <Input
                                            type="date"
                                            value={profile.wedding_anniversary || ''}
                                            onChange={e => setProfile({ ...profile, wedding_anniversary: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12 text-white/60"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Physical Address</label>
                                        <Input
                                            value={profile.physical_address || ''}
                                            onChange={e => setProfile({ ...profile, physical_address: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12"
                                            placeholder="1-2-3 Minato-ku, Tokyo, Japan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Country of Origin</label>
                                        <Input
                                            value={profile.country_of_origin || ''}
                                            onChange={e => setProfile({ ...profile, country_of_origin: e.target.value })}
                                            className="glass border-white/10 rounded-2xl h-12"
                                            placeholder="e.g. Zimbabwe, USA, Japan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Preferred Language</label>
                                        <select
                                            value={profile.preferred_language}
                                            onChange={e => setProfile({ ...profile, preferred_language: e.target.value as 'EN' | 'JP' })}
                                            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 focus:ring-2 ring-primary/20 outline-none"
                                        >
                                            <option value="EN">English</option>
                                            <option value="JP">Japanese</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleUpdateProfile} disabled={saving} className="rounded-full bg-primary h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20">
                                        {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        SAVE CONNECTION CARD
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* FAMILY TAB */}
                            <TabsContent value="family" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Household Management
                                    </h3>
                                    <Button variant="ghost" className="glass rounded-full text-xs font-bold gap-2">
                                        <Plus className="w-4 h-4" /> LINK FAMILY
                                    </Button>
                                </div>

                                <div className="py-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                    <Users className="w-12 h-12 mb-3" />
                                    <p className="max-w-[200px] text-xs font-bold">No household members linked yet. Start building your family unit.</p>
                                </div>
                            </TabsContent>

                            {/* SPIRITUAL TAB */}
                            <TabsContent value="spiritual" className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <Card className="glass border-white/10 bg-black/20 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <Trophy className="w-8 h-8 text-amber-500 mb-2" />
                                        <div className="text-3xl font-black">{stats.streak}</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Day Streak</div>
                                    </Card>
                                    <Card className="glass border-white/10 bg-black/20 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <Heart className="w-8 h-8 text-red-500 mb-2" />
                                        <div className="text-3xl font-black">{stats.completed}</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Devotions Finished</div>
                                    </Card>
                                    <Card className="glass border-white/10 bg-black/20 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                        <div className="text-3xl font-black">74%</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Target Complete</div>
                                    </Card>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Spiritual Milestones</h4>
                                    <div className="space-y-3">
                                        <div className="glass border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                                    <Milestone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Faith Decision</p>
                                                    <p className="text-[10px] opacity-40 leading-none">Accepted Christ at JKC Service</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-mono opacity-60">2026-03-01</p>
                                        </div>
                                        <Button variant="outline" className="w-full border-dashed border-white/10 rounded-2xl h-12 font-bold opacity-40 hover:opacity-100 transition-all">
                                            <Plus className="w-4 h-4 mr-2" /> RECORD NEW MILESTONE
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* CHURCH TAB */}
                            <TabsContent value="church" className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Service & Volunteering</h4>
                                        <div className="space-y-3">
                                            <div className="glass border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                                <p className="font-bold text-primary">Media/Tech Team</p>
                                                <Badge className="bg-green-500/20 text-green-500 border-0">ACTIVE</Badge>
                                            </div>
                                            <div className="glass border-white/10 rounded-2xl p-4 flex items-center justify-between opacity-50">
                                                <p className="font-bold">Hospitality</p>
                                                <Badge variant="outline" className="border-white/20">PAST</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Attendance Pulse</h4>
                                        <div className="glass border-white/10 rounded-3xl p-6">
                                            <div className="flex justify-between items-end gap-1 h-20 mb-4">
                                                {[80, 100, 60, 40, 90, 100, 100].map((h, i) => (
                                                    <div key={i} className={`flex-1 rounded-t-sm transition-all ${h > 80 ? 'bg-primary' : 'bg-white/10'}`} style={{ height: `${h}%` }} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-center opacity-50 font-medium">Last 7 Sunday Services</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* GIVING TAB */}
                            <TabsContent value="giving" className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-[var(--primary)]" />
                                        Stewardship Log
                                    </h3>
                                    <Button className="rounded-full bg-indigo-600 font-bold gap-2">
                                        <Plus className="w-4 h-4" /> GIVE NOW
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="glass border-white/10 bg-white/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Total Tithing 2026</div>
                                            <div className="text-xl font-black">¥450,000</div>
                                        </Card>
                                        <Card className="glass border-white/10 bg-white/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Building Fund</div>
                                            <div className="text-xl font-black">¥10,000</div>
                                        </Card>
                                    </div>

                                    <div className="glass border-white/10 rounded-3xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 font-black uppercase tracking-widest opacity-40">
                                                <tr>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Fund</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                <tr>
                                                    <td className="p-4 opacity-60">2026-03-01</td>
                                                    <td className="p-4 font-bold">Tithe</td>
                                                    <td className="p-4 text-right font-black">¥50,000</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4 opacity-60">2026-02-01</td>
                                                    <td className="p-4 font-bold">Tithe</td>
                                                    <td className="p-4 text-right font-black">¥50,000</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* CARE TAB */}
                            <TabsContent value="pastoral" className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-red-500" />
                                        Pastoral Care Hub
                                    </h3>

                                    <Card className="glass border-red-500/20 bg-red-500/5 rounded-[2rem] p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <h4 className="font-bold text-red-400">Shepherd's Visibility</h4>
                                        </div>
                                        <p className="text-xs opacity-70 leading-relaxed">
                                            Your growth data and prayer requests are used by the Pastoral team to provide proactive care.
                                            Private journal notes are <strong>not</strong> visible to anyone but yourself.
                                        </p>
                                    </Card>

                                    <div className="space-y-3 pt-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Active Prayer Requests</h4>
                                        <div className="glass border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-sm">Wisdom for new career transition</p>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[8px] h-4 border-amber-500/50 text-amber-500">PENDING</Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-[10px] font-bold">MARK ANSWERED</Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                        </Tabs>
                    </CardContent>
                </Card>

                {/* Sidebar Sidebar Alerts */}
                <div className="w-full md:w-80 space-y-6 shrink-0">
                    <Card className="glass border-primary/20 bg-primary/5 rounded-[2rem] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-primary" />
                            <h4 className="font-black text-sm uppercase tracking-wider text-primary">Security Note</h4>
                        </div>
                        <p className="text-xs opacity-60 leading-relaxed font-medium">
                            Your Connection Card is an encrypted record used specifically for JKC spiritual oversight.
                            Manage your data privacy in settings.
                        </p>
                    </Card>

                    <Card className="glass border-white/10 bg-black/20 rounded-[2rem] p-6">
                        <div className="flex items-center gap-3 mb-4 text-white/40">
                            <Users className="w-6 h-6" />
                            <h4 className="font-black text-sm uppercase tracking-wider">Church Family</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                <div className="flex-1">
                                    <div className="h-2 w-24 bg-white/20 rounded mb-1" />
                                    <div className="h-2 w-16 bg-white/10 rounded" />
                                </div>
                            </div>
                            <Button variant="outline" className="w-full rounded-2xl h-10 text-xs font-bold border-white/10">SHARE APP WITH FAMILY</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    );
}
