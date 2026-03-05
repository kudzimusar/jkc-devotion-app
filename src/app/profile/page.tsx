"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Auth } from "@/lib/auth";
import { supabase, ExtendedProfileService, AnalyticsService } from "@/lib/supabase";
import { SoapJournal } from "@/lib/soap-journal";
import {
    User as UserIcon, Users, Heart, Trophy, Shield,
    MessageCircle, AlertCircle, Plus, Save, Clock,
    Camera, MapPin, Globe, Milestone, Copy, LayoutDashboard, Settings, CheckCircle2, LogOut,
    Briefcase, Music, CalendarCheck, Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { basePath as BP } from "@/lib/utils";

const identitySchema = z.object({
    name: z.string().min(2, "Name is required"),
    gender: z.string().optional(),
    phone_number: z.string().optional(),
    birthdate: z.string().optional(),
    marital_status: z.string().optional(),
    wedding_anniversary: z.string().optional(),
    physical_address: z.string().optional(),
    city: z.string().optional(),
    ward: z.string().optional(),
    postal_code: z.string().optional(),
    country_of_origin: z.string().optional(),
    preferred_language: z.string().optional(),
    years_in_japan: z.coerce.number().optional(),
    occupation: z.string().optional(),
    education_level: z.string().optional()
});

type IdentityForm = z.infer<typeof identitySchema>;

const SIDEBAR_NAV = [
    { id: 'identity', label: 'Identity', icon: UserIcon },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'journey', label: 'Journey', icon: Milestone },
    { id: 'service', label: 'Service', icon: Heart },
    { id: 'care', label: 'Care', icon: MessageCircle },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'skills', label: 'Skills & Talents', icon: Briefcase },
    { id: 'community', label: 'Community', icon: Globe },
    { id: 'giving', label: 'Giving', icon: Coins }
];

const MINISTRY_OPTIONS = [
    "Worship Ministry", "Choir", "Media / Production", "Ushers", "Hospitality",
    "Children's Ministry", "Youth Ministry", "Young Adults", "Intercessory Prayer Team",
    "Evangelism Team", "Discipleship Team", "Marriage Ministry", "Men's Ministry",
    "Women's Ministry", "Counseling Ministry", "Protocol / Security", "Missions Team",
    "Administration", "Finance Team", "Technical Team", "Translation Team", "Community Outreach"
];

const PRAYER_CATEGORIES = [
    "Health", "Marriage", "Family", "Financial", "Career", "Immigration",
    "Education", "Spiritual Warfare", "Emotional Distress", "Salvation", "Other"
];

const SKILL_OPTIONS = [
    "Music", "Teaching", "Media", "Finance", "Administration", "Counseling",
    "Technology", "Hospitality", "Event Planning", "Language Translation", "Design", "Leadership"
];

export default function ProfileHub() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('identity');
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ completed: 0, streak: 0 });

    // Forms
    const idForm = useForm<IdentityForm>({
        resolver: zodResolver(identitySchema) as any
    });
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic state
    const [household, setHousehold] = useState<any[]>([]);
    const [newHouseholdName, setNewHouseholdName] = useState("");
    const [newHouseholdRel, setNewHouseholdRel] = useState("Spouse");

    const [milestones, setMilestones] = useState<any>({});

    const [prayers, setPrayers] = useState<any[]>([]);
    const [newPrayerText, setNewPrayerText] = useState("");
    const [newPrayerCategory, setNewPrayerCategory] = useState("Health");
    const [newPrayerUrgency, setNewPrayerUrgency] = useState("normal");
    const [pastoralContact, setPastoralContact] = useState(false);

    const [ministryRoles, setMinistryRoles] = useState<any[]>([]);
    const [newMinistry, setNewMinistry] = useState(MINISTRY_OPTIONS[0]);
    const [newMinistryRoleTitle, setNewMinistryRoleTitle] = useState("");

    const [skills, setSkills] = useState<any[]>([]);
    const [newSkill, setNewSkill] = useState(SKILL_OPTIONS[0]);

    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [fellowshipGroups, setFellowshipGroups] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [givingData, setGivingData] = useState({ tithe_status: false, preferred_giving_method: 'Cash' });

    useEffect(() => {
        const init = async () => {
            const currentUser = await Auth.getCurrentUser();
            if (!currentUser) {
                window.location.href = BP || '/';
                return;
            }
            setUser(currentUser);
            await loadData(currentUser.id);
            setLoading(false);
        };
        init();
    }, []);

    async function loadData(userId: string) {
        try {
            // Profile
            const { data: pData } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (pData) {
                setProfile(pData);
                idForm.reset({
                    name: pData.name,
                    gender: pData.gender || '',
                    phone_number: pData.phone_number || '',
                    birthdate: pData.birthdate || '',
                    marital_status: pData.marital_status || '',
                    wedding_anniversary: pData.wedding_anniversary || '',
                    physical_address: pData.physical_address || '',
                    city: pData.city || '',
                    ward: pData.ward || '',
                    postal_code: pData.postal_code || '',
                    country_of_origin: pData.country_of_origin || '',
                    preferred_language: pData.preferred_language || '',
                    years_in_japan: pData.years_in_japan,
                    occupation: pData.occupation || '',
                    education_level: pData.education_level || ''
                });
                setGivingData({
                    tithe_status: pData.tithe_status || false,
                    preferred_giving_method: pData.preferred_giving_method || 'Cash'
                });
            }

            // Stats
            const journalStats = await SoapJournal.getStats();
            setStats(journalStats);

            // Household
            const { data: hhData } = await supabase.from('households').select('id, household_name').eq('head_id', userId).maybeSingle();
            if (hhData) {
                const { data: members } = await supabase.from('household_members').select('*').eq('household_id', hhData.id);
                setHousehold(members || []);
            } else {
                setHousehold([]);
            }

            // Milestones
            const { data: mData } = await supabase.from('member_milestones').select('*').eq('user_id', userId).maybeSingle();
            if (mData) setMilestones(mData);

            // Ministries
            const { data: roleData } = await supabase.from('member_roles').select('*').eq('user_id', userId);
            if (roleData) setMinistryRoles(roleData || []);

            // Prayers
            const { data: prayerData } = await supabase.from('prayer_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (prayerData) setPrayers(prayerData || []);

            // Skills
            const { data: skillData } = await supabase.from('member_skills').select('*').eq('user_id', userId);
            if (skillData) setSkills(skillData || []);

            // Attendance
            const { data: attData } = await supabase.from('service_attendance').select('*').eq('user_id', userId).order('service_date', { ascending: false }).limit(10);
            setAttendanceRecords(attData || []);

            // Fellowship
            const { data: groups } = await supabase.from('fellowship_groups').select('*').eq('is_active', true);
            setFellowshipGroups(groups || []);
            const { data: joined } = await supabase.from('fellowship_members').select('group_id').eq('user_id', userId);
            setUserGroups(joined?.map(j => j.group_id) || []);

        } catch (e) {
            console.error(e);
            toast.error("Failed to load profile data");
        }
    }

    const onIdentitySubmit = async (data: IdentityForm) => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Predict household type based on existing local household data
            // (If we had a remote households table, we'd query there)
            let household_type = 'Single';
            if (household.some(h => h.relationship === 'Spouse')) household_type = 'Couple';
            if (household.some(h => h.relationship === 'Child')) household_type = 'Family with Children';

            const cleanData = { ...data };
            if (cleanData.years_in_japan) {
                cleanData.years_in_japan = parseInt(cleanData.years_in_japan.toString()) || 0;
            }

            const { error } = await supabase.from('profiles').update({
                ...cleanData,
                household_type
            }).eq('id', user.id);

            if (error) throw error;
            toast.success("Identity updated successfully!");
        } catch (e) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddHousehold = async () => {
        if (!newHouseholdName || !user) return;
        try {
            // 1. Ensure household exists for head
            let { data: hh } = await supabase.from('households').select('id').eq('head_id', user.id).maybeSingle();
            if (!hh) {
                const { data: newHh, error: hhErr } = await supabase.from('households').insert([{
                    head_id: user.id,
                    household_name: `${user.name}'s Household`
                }]).select().single();
                if (hhErr) throw hhErr;
                hh = newHh;
            }

            // 2. Add member
            const { data: member, error: memErr } = await supabase.from('household_members').insert([{
                household_id: hh!.id,
                full_name: newHouseholdName,
                relationship: newHouseholdRel
            }]).select().single();
            if (memErr) throw memErr;

            const nh = [...household, member];
            setHousehold(nh);

            AnalyticsService.logEvent(user.id, 'household_member_added', { member: newHouseholdName });

            // 3. Update identity household_type abstractly
            let household_type = 'Single';
            if (nh.some(h => h.relationship === 'Spouse')) household_type = 'Couple';
            if (nh.some(h => h.relationship === 'Child')) household_type = 'Family with Children';
            await supabase.from('profiles').update({ household_type }).eq('id', user.id);

            setNewHouseholdName("");
            toast.success("Household updated!");
        } catch (e) {
            toast.error("Error updating household");
        }
    };

    const saveMilestones = async () => {
        if (!user) return;
        try {
            const { error } = await supabase.from('member_milestones').upsert({
                user_id: user.id,
                ...milestones,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            toast.success("Journey milestones saved!");
        } catch (e) {
            toast.error("Failed saving milestones");
        }
    };

    const handleAddPrayer = async () => {
        if (!newPrayerText || !user) return;
        try {
            const newRecord = {
                user_id: user.id,
                request_text: newPrayerText,
                category: newPrayerCategory,
                urgency: newPrayerUrgency,
                requires_pastoral_contact: pastoralContact,
                status: 'Pending'
            };
            const { data, error } = await supabase.from('prayer_requests').insert([newRecord]).select().single();
            if (error) throw error;

            setPrayers([data, ...prayers]);
            setNewPrayerText("");
            setPastoralContact(false);
            toast.success("Prayer request submitted to leadership.");
        } catch (e) {
            toast.error("Failed submitting prayer");
        }
    };

    const togglePrayer = async (id: string, currentStatus: string) => {
        if (!user) return;
        const newStatus = currentStatus === 'Pending' ? 'Answered' : 'Pending';
        try {
            await supabase.from('prayer_requests').update({ status: newStatus }).eq('id', id);
            setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
            toast.success("Prayer status updated");
        } catch (e) {
            toast.error("Failed to update");
        }
    };

    const handleAddMinistry = async () => {
        if (!newMinistry || !user) return;
        try {
            const rec = {
                user_id: user.id,
                ministry_name: newMinistry,
                role_title: newMinistryRoleTitle,
                active_status: true,
                start_date: new Date().toISOString().split('T')[0]
            };
            const { data, error } = await supabase.from('member_roles').insert([rec]).select().single();
            if (error) throw error;

            setMinistryRoles([...ministryRoles, data]);
            setNewMinistryRoleTitle("");
            toast.success("Ministry role linked!");
        } catch (e) {
            toast.error("Error linking role");
        }
    };

    const handleAddSkill = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('member_skills').insert([{ user_id: user.id, skill_name: newSkill }]).select().single();
            if (error) throw error;
            setSkills([...skills, data]);
            toast.success("Skill added!");
        } catch (e) {
            toast.error("Error adding skill (might already exist)");
        }
    }

    const handleJoinGroup = async (groupId: string) => {
        if (!user) return;
        const isJoined = userGroups.includes(groupId);
        try {
            if (isJoined) {
                await supabase.from('fellowship_members').delete().eq('user_id', user.id).eq('group_id', groupId);
                setUserGroups(userGroups.filter(id => id !== groupId));
                toast.success("Left group");
            } else {
                await supabase.from('fellowship_members').insert([{ user_id: user.id, group_id: groupId }]);
                setUserGroups([...userGroups, groupId]);
                toast.success("Joined group!");
            }
        } catch (e) {
            toast.error("Action failed");
        }
    };

    const saveGiving = async () => {
        if (!user) return;
        try {
            await supabase.from('profiles').update(givingData).eq('id', user.id);
            toast.success("Giving preferences saved");
        } catch (e) {
            toast.error("Error saving preferences");
        }
    }

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

            <div className="flex h-[calc(100vh-65px)]">

                {/* GLOBAL LEFT SIDEBAR */}
                <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r border-foreground/10 flex-col hidden md:flex shrink-0">
                    <div className="p-8">
                        <img src={`${BP}/church-logo.png`} alt="JKC" className="w-12 h-12 object-contain" />
                    </div>
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
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
                                <nav.icon className="w-4 h-4 shrink-0" /> {nav.label}
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
                                    <Button variant="outline" className="w-full py-6 rounded-xl font-bold border-foreground/10 hover:bg-foreground/5 text-foreground/80 cursor-default">
                                        Active Member
                                    </Button>
                                </div>
                            </div>

                            {/* RIGHT TABBED CONTENT */}
                            <div className="flex-1 bg-white dark:bg-[#111] rounded-[2rem] shadow-xl border border-foreground/10 overflow-hidden">
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
                                            {SIDEBAR_NAV.find(n => n.id === activeTab)?.label}
                                        </h3>
                                        <p className="text-sm text-foreground/50 font-medium mt-2">Manage your structured data for Church analytics.</p>
                                    </div>

                                    {/* IDENTITY TAB */}
                                    {activeTab === 'identity' && (
                                        <form onSubmit={idForm.handleSubmit(onIdentitySubmit)} className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Full Name</label>
                                                    <Input {...idForm.register("name")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Gender</label>
                                                    <select {...idForm.register("gender")} className="w-full h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 text-sm font-semibold outline-none focus:ring-[var(--primary)]">
                                                        <option value="">Select...</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Phone Number</label>
                                                    <Input {...idForm.register("phone_number")} placeholder="+81..." className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Date of Birth</label>
                                                    <Input type="date" {...idForm.register("birthdate")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Marital Status</label>
                                                    <select {...idForm.register("marital_status")} className="w-full h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 text-sm font-semibold outline-none focus:ring-[var(--primary)]">
                                                        <option value="">Select...</option>
                                                        <option value="Single">Single</option>
                                                        <option value="Married">Married</option>
                                                        <option value="Widowed">Widowed</option>
                                                        <option value="Divorced">Divorced</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Country of Origin</label>
                                                    <Input {...idForm.register("country_of_origin")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Preferred Language</label>
                                                    <select {...idForm.register("preferred_language")} className="w-full h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 text-sm font-semibold outline-none focus:ring-[var(--primary)]">
                                                        <option value="EN">English</option>
                                                        <option value="JP">Japanese</option>
                                                        <option value="BOTH">Bilingual</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Years in Japan</label>
                                                    <Input type="number" {...idForm.register("years_in_japan")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Occupation</label>
                                                    <Input {...idForm.register("occupation")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Education Level</label>
                                                    <Input {...idForm.register("education_level")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Home Address / Ward</label>
                                                    <Input {...idForm.register("physical_address")} className="h-14 rounded-2xl bg-foreground/5 border-foreground/10 px-4" />
                                                </div>
                                            </div>
                                            <Button type="submit" disabled={isSaving} className="w-full md:w-auto px-12 h-14 rounded-xl bg-[var(--primary)] text-white font-black">
                                                {isSaving ? "UPDATING..." : "UPDATE IDENTITY"}
                                            </Button>
                                        </form>
                                    )}

                                    {/* FAMILY TAB */}
                                    {activeTab === 'family' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Household Linkages</h4>
                                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                    <Input placeholder="Member Name" value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4 flex-1" />
                                                    <select value={newHouseholdRel} onChange={e => setNewHouseholdRel(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none w-full sm:w-48">
                                                        <option>Spouse</option>
                                                        <option>Child</option>
                                                        <option>Parent</option>
                                                        <option>Sibling</option>
                                                        <option>Dependent</option>
                                                    </select>
                                                    <Button onClick={handleAddHousehold} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Link</Button>
                                                </div>
                                                <div className="grid gap-3">
                                                    {household.map(h => (
                                                        <div key={h.id} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{h.full_name || h.name}</span>
                                                                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">{h.relationship}</span>
                                                            </div>
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* JOURNEY TAB */}
                                    {activeTab === 'journey' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">First Visit Date</label>
                                                    <Input type="date" value={milestones.first_visit_date || ''} onChange={e => setMilestones({ ...milestones, first_visit_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Salvation Decision Date</label>
                                                    <Input type="date" value={milestones.salvation_date || ''} onChange={e => setMilestones({ ...milestones, salvation_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Baptism Date</label>
                                                    <Input type="date" value={milestones.baptism_date || ''} onChange={e => setMilestones({ ...milestones, baptism_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Membership Date</label>
                                                    <Input type="date" value={milestones.membership_date || ''} onChange={e => setMilestones({ ...milestones, membership_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="col-span-full pt-4">
                                                    <Button onClick={saveMilestones} className="px-8 h-12 rounded-xl bg-emerald-500 text-white font-black shadow-lg">Save Milestones</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SERVICE TAB */}
                                    {activeTab === 'service' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <select value={newMinistry} onChange={e => setNewMinistry(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none w-full flex-1">
                                                        {MINISTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                    <Input placeholder="Role Title (e.g. Lead, Usher)" value={newMinistryRoleTitle} onChange={e => setNewMinistryRoleTitle(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4 w-full sm:w-1/3" />
                                                    <Button onClick={handleAddMinistry} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black">Add</Button>
                                                </div>
                                                <div className="grid gap-3">
                                                    {ministryRoles.map(m => (
                                                        <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl gap-4">
                                                            <div>
                                                                <h5 className="font-bold">{m.ministry_name}</h5>
                                                                <p className="text-xs text-foreground/60">{m.role_title || 'Member'}</p>
                                                            </div>
                                                            <div className="text-xs font-bold tracking-widest uppercase text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-center">ACTIVE</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CARE TAB */}
                                    {activeTab === 'care' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex flex-col gap-4">
                                                    <Input placeholder="My prayer is..." value={newPrayerText} onChange={e => setNewPrayerText(e.target.value)} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <select value={newPrayerCategory} onChange={e => setNewPrayerCategory(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none flex-1">
                                                            {PRAYER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                        <select value={newPrayerUrgency} onChange={e => setNewPrayerUrgency(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none w-full sm:w-48">
                                                            <option value="normal">Normal</option>
                                                            <option value="urgent">Urgent</option>
                                                            <option value="crisis">Crisis</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-red-500/10 text-red-600 p-4 rounded-xl border border-red-500/20">
                                                        <input type="checkbox" id="pastor_req" checked={pastoralContact} onChange={e => setPastoralContact(e.target.checked)} className="w-5 h-5 rounded" />
                                                        <label htmlFor="pastor_req" className="font-bold text-sm cursor-pointer">I require a Pastor or Leader to contact me directly.</label>
                                                    </div>
                                                    <Button onClick={handleAddPrayer} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black">Submit Prayer Request</Button>
                                                </div>
                                                <div className="space-y-3 mt-8">
                                                    {prayers.map(p => (
                                                        <div key={p.id} className="flex flex-col p-4 bg-background border border-foreground/10 rounded-2xl space-y-3">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <p className={`font-bold text-sm ${p.status === 'Answered' ? 'line-through opacity-50' : ''}`}>{p.request_text}</p>
                                                                <span className="text-xs shrink-0 bg-foreground/5 px-2 py-1 rounded-md font-semibold text-foreground/60">{p.category}</span>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <Button onClick={() => togglePrayer(p.id, p.status)} variant="outline" size="sm" className="text-xs font-bold h-8">
                                                                    {p.status === 'Pending' ? 'MARK ANSWERED' : 'MARK PENDING'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SKILLS TAB */}
                                    {activeTab === 'skills' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                                    <select value={newSkill} onChange={e => setNewSkill(e.target.value)} className="h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none flex-1">
                                                        {SKILL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                    <Button onClick={handleAddSkill} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Add Talent</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map(s => (
                                                        <span key={s.id} className="px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-sm border border-[var(--primary)]/20">
                                                            {s.skill_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* GIVING TAB */}
                                    {activeTab === 'giving' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex flex-col gap-6">
                                                    <div className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                        <div>
                                                            <h5 className="font-bold">I am a Tithing Member</h5>
                                                            <p className="text-xs text-foreground/60">Help leadership project church budgets</p>
                                                        </div>
                                                        <input type="checkbox" checked={givingData.tithe_status} onChange={e => setGivingData({ ...givingData, tithe_status: e.target.checked })} className="w-6 h-6 rounded" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 pl-1">Preferred Giving Method</label>
                                                        <select value={givingData.preferred_giving_method} onChange={e => setGivingData({ ...givingData, preferred_giving_method: e.target.value })} className="w-full h-14 rounded-2xl bg-background border border-foreground/10 px-4 text-sm font-semibold outline-none">
                                                            <option>Cash (Envelope)</option>
                                                            <option>Bank Transfer (Furikomi)</option>
                                                            <option>Credit Card (Online)</option>
                                                        </select>
                                                    </div>
                                                    <Button onClick={saveGiving} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black w-full sm:w-auto self-start">Save Preferences</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ATTENDANCE TAB */}
                                    {activeTab === 'attendance' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Recent Attendance</h4>
                                                <div className="grid gap-3">
                                                    {attendanceRecords.length > 0 ? attendanceRecords.map((r, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-background border border-foreground/10 rounded-2xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                                    <CalendarCheck className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold">{new Date(r.service_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                                                    <p className="text-xs text-foreground/50 uppercase font-black tracking-widest">{r.attendance_type}</p>
                                                                </div>
                                                            </div>
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-12 text-foreground/30 font-bold uppercase tracking-widest text-xs">No attendance recorded yet.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMMUNITY TAB */}
                                    {activeTab === 'community' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <h4 className="font-black text-lg pb-4 border-b border-foreground/10">Fellowship Circles</h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {fellowshipGroups.length > 0 ? fellowshipGroups.map(g => {
                                                        const joined = userGroups.includes(g.id);
                                                        return (
                                                            <div key={g.id} className="bg-background border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] font-black bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md uppercase tracking-widest">{g.meeting_frequency}</span>
                                                                        {joined && <Badge className="bg-emerald-500 text-white border-0">Joined</Badge>}
                                                                    </div>
                                                                    <h5 className="font-bold text-lg mb-1">{g.name}</h5>
                                                                    <p className="text-xs text-foreground/50 flex items-center gap-1 mb-4">
                                                                        <MapPin className="w-3 h-3" /> {g.location || 'Online / Various'}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleJoinGroup(g.id)}
                                                                    variant={joined ? "outline" : "default"}
                                                                    className={`w-full font-bold rounded-xl ${joined ? 'border-red-500/20 text-red-500 hover:bg-red-500/5' : 'bg-[var(--primary)] text-white'}`}
                                                                >
                                                                    {joined ? 'Leave Group' : 'Join Circle'}
                                                                </Button>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="col-span-full py-12 text-center text-foreground/30 font-bold uppercase tracking-widest text-xs">
                                                            No active fellowship groups available to join.
                                                        </div>
                                                    )}
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
