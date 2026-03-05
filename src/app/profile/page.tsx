"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Auth } from "@/lib/auth";
import { supabase, ExtendedProfileService, AnalyticsService } from "@/lib/supabase";
import { SoapJournal } from "@/lib/soap-journal";
import {
    User as UserIcon, Users, Heart, Trophy, Shield,
    CreditCard, MessageCircle, AlertCircle, Plus, Save, Clock,
    Camera, MapPin, Globe, Milestone, Copy, LayoutDashboard, Settings, CheckCircle2, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { basePath as BP } from "@/lib/utils";

const identitySchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone_number: z.string().optional(),
    birthdate: z.string().optional(),
    wedding_anniversary: z.string().optional(),
    physical_address: z.string().optional(),
    country_of_origin: z.string().optional(),
    preferred_language: z.string().optional(),
});

type IdentityForm = z.infer<typeof identitySchema>;

const SIDEBAR_NAV = [
    { id: 'identity', label: 'Identity', icon: UserIcon },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'journey', label: 'Journey', icon: Milestone },
    { id: 'service', label: 'Service', icon: Heart },
    { id: 'care', label: 'Care', icon: MessageCircle },
];

export default function ProfileHub() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('identity');
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ completed: 0, streak: 0 });

    // Forms
    const idForm = useForm<IdentityForm>({ resolver: zodResolver(identitySchema) });
    const [isSaving, setIsSaving] = useState(false);

    // Other Tabs state
    const [household, setHousehold] = useState<any[]>([]);
    const [newHouseholdName, setNewHouseholdName] = useState("");
    const [newHouseholdRel, setNewHouseholdRel] = useState("Spouse");

    const [prayers, setPrayers] = useState<any[]>([]);
    const [newPrayer, setNewPrayer] = useState("");

    const [ministryRoles, setMinistryRoles] = useState<any[]>([]);
    const [newMinistry, setNewMinistry] = useState("");
    const [stewardship, setStewardship] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            const currentUser = await Auth.getCurrentUser();
            if (!currentUser) {
                window.location.href = BP || '/';
                return;
            }
            setUser(currentUser);
            await loadProfileData(currentUser.id);
            setLoading(false);
        };
        init();
    }, []);

    async function loadProfileData(userId: string) {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (data) {
                setProfile(data);
                idForm.reset({
                    name: data.name,
                    phone_number: data.phone_number || '',
                    birthdate: data.birthdate || '',
                    wedding_anniversary: data.wedding_anniversary || '',
                    physical_address: data.physical_address || '',
                    country_of_origin: data.country_of_origin || '',
                    preferred_language: data.preferred_language || '',
                });
            }

            const journalStats = await SoapJournal.getStats();
            setStats(journalStats);

            setHousehold(await ExtendedProfileService.getLocal(`hh_${userId}`, []));
            setPrayers(await ExtendedProfileService.getLocal(`pr_${userId}`, []));
            setMinistryRoles(await ExtendedProfileService.getLocal(`mr_${userId}`, []));
        } catch (e) {
            console.error(e);
            toast.error("Failed to load profile data");
        }
    }

    const onIdentitySubmit = async (data: IdentityForm) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
            if (error) throw error;
            toast.success("Profile Successfully Saved!");
        } catch (e) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddHousehold = async () => {
        if (!newHouseholdName || !user) return;
        const nh = [...household, { id: Date.now(), name: newHouseholdName, relationship: newHouseholdRel }];
        setHousehold(nh);
        await ExtendedProfileService.saveLocal(`hh_${user.id}`, nh);
        AnalyticsService.logEvent(user.id, 'household_updated', { household: nh });
        setNewHouseholdName("");
        toast.success("Household updated!");
    };

    const handleAddPrayer = async () => {
        if (!newPrayer || !user) return;
        const np = [...prayers, { id: Date.now(), text: newPrayer, status: 'PENDING' }];
        setPrayers(np);
        await ExtendedProfileService.saveLocal(`pr_${user.id}`, np);
        AnalyticsService.logEvent(user.id, 'prayer_request_added', { request: newPrayer });
        setNewPrayer("");
        toast.success("Prayer request saved!");
    };

    const togglePrayer = async (id: number) => {
        if (!user) return;
        const np = prayers.map(p => p.id === id ? { ...p, status: p.status === 'PENDING' ? 'ANSWERED' : 'PENDING' } : p);
        setPrayers(np);
        await ExtendedProfileService.saveLocal(`pr_${user.id}`, np);
        toast.success("Status updated");
    };

    const handleAddMinistry = async () => {
        if (!newMinistry || !user) return;
        const nm = [...ministryRoles, { id: Date.now(), role: newMinistry, status: 'ACTIVE' }];
        setMinistryRoles(nm);
        await ExtendedProfileService.saveLocal(`mr_${user.id}`, nm);
        setNewMinistry("");
        toast.success("Service role added!");
    };

    if (loading) {
        return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><Clock className="w-8 h-8 animate-spin opacity-20" /></div>;
    }

    const handleLogout = async () => {
        try {
            await Auth.logout();
            window.location.href = BP || '/';
        } catch (error) {
            toast.error("Error logging out.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-black overflow-x-hidden pb-20">
            <TopNav user={user} />

            {/* Global Sidebar layout matched across app - optional if the user wanted left-most sidebar, but we stick to their requested "left sidebar" for Connection Card */}

            <div className="flex h-[calc(100vh-65px)]">

                {/* GLOBAL LEFT SIDEBAR (App-wide Navigation) */}
                <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r border-foreground/10 flex-col hidden md:flex shrink-0">
                    <div className="p-8">
                        <img src={`${BP}/church-logo.png`} alt="JKC" className="w-12 h-12 object-contain" />
                    </div>
                    <nav className="flex-1 px-4 space-y-2">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/5 font-semibold text-sm transition-all">
                            <LayoutDashboard className="w-4 h-4" /> Home
                        </Link>
                        <div className="pt-4 pb-2 px-4 text-xs font-black uppercase tracking-widest text-[var(--primary)] opacity-70">
                            Connection Card
                        </div>
                        {SIDEBAR_NAV.map(nav => (
                            <button
                                key={nav.id}
                                onClick={() => setActiveTab(nav.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === nav.id
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                                    }`}
                            >
                                <nav.icon className="w-4 h-4" /> {nav.label}
                            </button>
                        ))}
                        <div className="pt-8 w-full border-t border-foreground/5 mt-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto relative">
                    {/* Cover Header */}
                    <div className="h-64 md:h-80 bg-[var(--primary)] relative">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        <Button className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md rounded-xl font-bold">
                            <Camera className="w-4 h-4 mr-2" /> Change Cover
                        </Button>
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 pb-12">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                            {/* LEFT PROFILE CARD */}
                            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                                <div className="bg-white dark:bg-[#111] rounded-[2rem] shadow-xl border border-foreground/10 overflow-hidden relative p-8 flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-[#111] bg-[var(--primary)] text-white text-5xl font-black flex items-center justify-center relative shadow-xl z-10 mb-6">
                                        {profile?.name?.[0] || user?.name?.[0]}
                                        <button className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-foreground/10 text-[var(--primary)] rounded-full flex items-center justify-center shadow-lg hover:bg-foreground/5 transition-all">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h2 className="text-2xl font-black text-center">{profile?.name || user?.name}</h2>
                                    <p className="text-sm text-foreground/50 font-semibold mb-8 text-center">{profile?.country_of_origin || 'Local Assembly'}</p>

                                    <div className="w-full space-y-4 mb-8">
                                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-foreground/5">
                                            <span className="text-sm font-semibold text-foreground/70">Completed Days</span>
                                            <span className="text-[var(--primary)] font-black">{stats.completed}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-foreground/5">
                                            <span className="text-sm font-semibold text-foreground/70">Current Streak</span>
                                            <span className="text-amber-500 font-black">{stats.streak}</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="w-full py-6 rounded-xl font-bold border-foreground/10 mb-4 hover:bg-foreground/5 text-foreground/80">
                                        View Public Profile
                                    </Button>
                                    <div className="flex items-center gap-2 w-full p-3 rounded-xl bg-foreground/5 border border-foreground/10 text-xs text-foreground/50 cursor-pointer hover:bg-foreground/10 transition-all">
                                        <div className="truncate flex-1">https://jkc.app/p/{user?.id?.substring(0, 8)}</div>
                                        <Copy className="w-4 h-4 shrink-0" />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT TABBED CONTENT */}
                            <div className="flex-1 bg-white dark:bg-[#111] rounded-[2rem] shadow-xl border border-foreground/10 overflow-hidden">

                                {/* Mobile Tab Scroller (since sidebar is hidden on mobile) */}
                                <div className="flex md:hidden overflow-x-auto border-b border-foreground/10 custom-scrollbar">
                                    {SIDEBAR_NAV.map(nav => (
                                        <button
                                            key={nav.id}
                                            onClick={() => setActiveTab(nav.id)}
                                            className={`whitespace-nowrap px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === nav.id
                                                ? 'border-[var(--primary)] text-[var(--primary)]'
                                                : 'border-transparent text-foreground/50 hover:text-foreground'
                                                }`}
                                        >
                                            {nav.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 md:p-10 lg:p-12">
                                    <div className="pb-8 border-b border-foreground/10 mb-8">
                                        <h3 className="text-2xl font-black capitalize flex items-center gap-3">
                                            {(() => {
                                                const Icon = SIDEBAR_NAV.find(n => n.id === activeTab)?.icon;
                                                return Icon ? <Icon className="w-6 h-6 text-[var(--primary)]" /> : null;
                                            })()}
                                            {activeTab} Settings
                                        </h3>
                                        <p className="text-sm text-foreground/50 font-medium mt-2">Manage your connection card {activeTab} records here.</p>
                                    </div>

                                    {/* IDENTITY TAB */}
                                    {activeTab === 'identity' && (
                                        <form onSubmit={idForm.handleSubmit(onIdentitySubmit)} className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">First & Last Name</label>
                                                    <Input {...idForm.register("name")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4 text-base focus-visible:ring-[var(--primary)]" />
                                                    {idForm.formState.errors.name && <span className="text-xs text-red-500 px-2">{idForm.formState.errors.name.message}</span>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Phone Number</label>
                                                    <Input {...idForm.register("phone_number")} placeholder="+81 000-0000" className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4 text-base focus-visible:ring-[var(--primary)]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Birthdate</label>
                                                    <Input type="date" {...idForm.register("birthdate")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4 text-base focus-visible:ring-[var(--primary)]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Country of Origin</label>
                                                    <Input {...idForm.register("country_of_origin")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4 text-base focus-visible:ring-[var(--primary)]" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Physical Address</label>
                                                    <Input {...idForm.register("physical_address")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4 text-base focus-visible:ring-[var(--primary)]" />
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-foreground/10">
                                                <Button type="submit" disabled={isSaving} className="w-full md:w-auto px-12 h-14 rounded-xl bg-[var(--primary)] text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                                    {isSaving ? "UPDATING..." : "UPDATE PROFILE"}
                                                </Button>
                                            </div>
                                        </form>
                                    )}

                                    {/* FAMILY TAB */}
                                    {activeTab === 'family' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 md:gap-8 hover:bg-foreground/[0.02]">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Wedding Anniversary</label>
                                                    <div className="flex gap-2">
                                                        <Input type="date" value={profile?.wedding_anniversary || ''} onChange={(e) => setProfile({ ...profile, wedding_anniversary: e.target.value })} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                        <Button onClick={() => onIdentitySubmit({ ...profile, wedding_anniversary: profile.wedding_anniversary } as IdentityForm)} className="h-14 px-6 rounded-2xl bg-foreground/10 text-foreground">Save</Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Linked Household Members</h4>

                                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                    <Input placeholder="Member Name" value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4 flex-1" />
                                                    <select value={newHouseholdRel} onChange={e => setNewHouseholdRel(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none w-full sm:w-48 focus:ring-[var(--primary)]">
                                                        <option>Spouse</option>
                                                        <option>Child</option>
                                                        <option>Parent</option>
                                                    </select>
                                                    <Button onClick={handleAddHousehold} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Link</Button>
                                                </div>

                                                <div className="grid gap-3">
                                                    {household.map(h => (
                                                        <div key={h.id} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{h.name}</span>
                                                                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">{h.relationship}</span>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* JOURNEY TAB */}
                                    {activeTab === 'journey' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2rem] p-6">
                                                    <Trophy className="w-8 h-8 text-amber-500 mb-4" />
                                                    <h4 className="text-3xl font-black">{stats.completed} <span className="text-base text-foreground/50 tracking-normal font-semibold">days</span></h4>
                                                    <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest mt-2">Transformation Recorded</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[2rem] p-6">
                                                    <Milestone className="w-8 h-8 text-emerald-500 mb-4" />
                                                    <h4 className="text-3xl font-black text-emerald-500">Active</h4>
                                                    <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest mt-2">Baptism Status</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SERVICE TAB */}
                                    {activeTab === 'service' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Ministry Involvement</h4>
                                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                    <Input placeholder="e.g. Media Team, Choir..." value={newMinistry} onChange={e => setNewMinistry(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4 flex-1" />
                                                    <Button onClick={handleAddMinistry} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Link Role</Button>
                                                </div>
                                                <div className="grid gap-3">
                                                    {ministryRoles.map(m => (
                                                        <div key={m.id} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                            <div className="flex items-center gap-3">
                                                                <Heart className="w-5 h-5 text-[var(--primary)]" />
                                                                <span className="font-bold">{m.role}</span>
                                                            </div>
                                                            <div className="text-xs font-bold tracking-widest uppercase text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full">{m.status}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CARE TAB */}
                                    {activeTab === 'care' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex gap-4 text-red-600">
                                                <Shield className="w-6 h-6 shrink-0" />
                                                <div>
                                                    <h4 className="font-black mb-1">Confidential Zone</h4>
                                                    <p className="text-sm opacity-80 font-medium">Your prayer requests and pastoral care logs are strictly monitored by JKC leadership only.</p>
                                                </div>
                                            </div>

                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Prayer Requests</h4>
                                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                    <Input placeholder="My prayer is..." value={newPrayer} onChange={e => setNewPrayer(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4 flex-1" />
                                                    <Button onClick={handleAddPrayer} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Submit</Button>
                                                </div>
                                                <div className="space-y-3">
                                                    {prayers.map(p => (
                                                        <div key={p.id} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                            <div>
                                                                <p className={`font-bold text-sm ${p.status === 'ANSWERED' ? 'line-through opacity-50' : ''}`}>{p.text}</p>
                                                            </div>
                                                            <Button onClick={() => togglePrayer(p.id)} variant="ghost" size="sm" className="text-[10px] font-bold h-8">
                                                                {p.status === 'PENDING' ? 'MARK ANSWERED' : 'MARK PENDING'}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
