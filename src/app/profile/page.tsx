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
    Briefcase, Music, CalendarCheck, Coins, Activity, ChevronRight, Sparkles, XCircle,
    TrendingUp, Newspaper, ArrowUpRight
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
import { MINISTRY_OPTIONS, SKILL_OPTIONS, PRAYER_CATEGORIES } from "@/lib/constants";

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
    industry: z.string().optional(),
    education_level: z.string().optional(),
    church_background: z.string().optional(),
    salvation_date: z.string().optional(),
    baptism_status: z.string().optional(),
    baptism_date: z.string().optional(),
    invited_by_name: z.string().optional(),
    invite_method: z.string().optional()
});

type IdentityForm = z.infer<typeof identitySchema>;

const SIDEBAR_NAV = [
    { id: 'identity', label: 'Identity', icon: UserIcon },
    { id: 'family', label: 'Family & Households', icon: Users },
    { id: 'junior-church', label: 'Junior Church', icon: Sparkles },
    { id: 'journey', label: 'Spiritual Journey', icon: Milestone },
    { id: 'service', label: 'Ministry & Service', icon: Heart },
    { id: 'care', label: 'Pastoral Care', icon: MessageCircle },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'skills', label: 'Skills & Talents', icon: Briefcase },
    { id: 'community', label: 'Circle Community', icon: Globe },
    { id: 'giving', label: 'Giving & Tithe', icon: Coins }
];

// Options now imported from @/lib/constants

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
    const [newSkillLevel, setNewSkillLevel] = useState("Intermediate");
    const [newSkillExp, setNewSkillExp] = useState(1);
    const [newSkillCat, setNewSkillCat] = useState("Technology");

    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [children, setChildren] = useState<any[]>([]);
    const [givingHistory, setGivingHistory] = useState<any[]>([]);
    const [fellowshipGroups, setFellowshipGroups] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [givingData, setGivingData] = useState({ tithe_status: false, preferred_giving_method: 'Cash' });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [propheticInsight, setPropheticInsight] = useState<any>(null);
    const [upcomingAttendance, setUpcomingAttendance] = useState<string | null>(null);
    const [churchImpact, setChurchImpact] = useState({
        memberGrowth: 0,
        totalSalvations: 0,
        missionProgress: 0,
        latestNewsletter: null as any
    });
    const [membershipRequest, setMembershipRequest] = useState<any>(null);

    const handleAcceptInvitation = async (notif: any) => {
        try {
            await supabase.from('ministry_members')
                .update({ status: 'active' })
                .eq('user_id', user.id)
                .eq('status', 'pending_invitation');

            await supabase.from('member_notifications').update({ is_read: true }).eq('id', notif.id);
            setNotifications(notifications.filter(n => n.id !== notif.id));
            toast.success("Welcome to the team!");
            loadData(user.id);
        } catch (e) {
            toast.error("Acceptance failed");
        }
    };

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
                    physical_address: pData.physical_address || pData.address || '',
                    city: pData.city || '',
                    ward: pData.ward || '',
                    postal_code: pData.postal_code || '',
                    country_of_origin: pData.country_of_origin || '',
                    preferred_language: pData.preferred_language || '',
                    years_in_japan: pData.years_in_japan,
                    occupation: pData.occupation || '',
                    education_level: pData.education_level || '',
                    invited_by_name: pData.invited_by_name || '',
                    invite_method: pData.invite_method || ''
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
            const { data: roleData } = await supabase.from('ministry_members').select('*').eq('user_id', userId);
            if (roleData) setMinistryRoles(roleData || []);

            // Prayers
            const { data: prayerData } = await supabase.from('prayer_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (prayerData) setPrayers(prayerData || []);

            // Skills
            const { data: skillData } = await supabase.from('member_skills').select('*').eq('user_id', userId);
            if (skillData) setSkills(skillData || []);

            // Notifications
            const { data: notifData } = await supabase.from('member_notifications').select('*').eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false });
            if (notifData) setNotifications(notifData);

            // Attendance
            const { data: attData } = await supabase.from('attendance_records').select('*').eq('user_id', userId).order('event_date', { ascending: false }).limit(10);
            setAttendanceRecords(attData || []);

            // Prophetic Intelligence (PIL)
            const { data: pilData } = await supabase.from('prophetic_insights').select('*').eq('subject_id', userId).eq('is_acknowledged', false).maybeSingle();
            if (pilData) setPropheticInsight(pilData);

            // Junior Church
            const { data: juniorData } = await supabase.from('guardian_links').select('*').eq('guardian_id', userId);
            setChildren(juniorData || []);

            // Giving History
            const { data: gHistory } = await supabase.from('financial_records').select('*').eq('user_id', userId).order('given_date', { ascending: false });
            setGivingHistory(gHistory || []);

            // Fellowship
            const { data: groups } = await supabase.from('fellowship_groups').select('*').eq('is_active', true);
            setFellowshipGroups(groups || []);
            const { data: joined } = await supabase.from('fellowship_members').select('group_id').eq('user_id', userId);
            setUserGroups(joined?.map(j => j.group_id) || []);

            // Attendance Logs (Intent)
            const today = new Date().toISOString().split('T')[0];
            const { data: intentData } = await supabase.from('attendance_logs').select('status').eq('user_id', userId).eq('service_date', today).maybeSingle();
            if (intentData) setUpcomingAttendance(intentData.status);

            // Church Impact Aggregates
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const { count: recentMembers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', monthAgo.toISOString());

            const { data: latestNewsletter } = await supabase.from('newsletters').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(1).maybeSingle();

            const impact = {
                memberGrowth: recentMembers || 0,
                totalSalvations: 12,
                missionProgress: 65,
                latestNewsletter: latestNewsletter
            };

            if (latestNewsletter?.content?.impact_metrics) {
                impact.totalSalvations = latestNewsletter.content.impact_metrics.salvations || impact.totalSalvations;
                impact.missionProgress = latestNewsletter.content.impact_metrics.mission_progress || impact.missionProgress;
                impact.memberGrowth = latestNewsletter.content.impact_metrics.growth || impact.memberGrowth;
            }
            setChurchImpact(impact);

            // Membership Request
            const { data: mrData } = await supabase.from('membership_requests').select('*').eq('user_id', userId).maybeSingle();
            setMembershipRequest(mrData);

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
                name: cleanData.name,
                phone: cleanData.phone_number,
                gender: cleanData.gender,
                date_of_birth: cleanData.birthdate,
                marital_status: cleanData.marital_status,
                wedding_anniversary: cleanData.wedding_anniversary,
                full_address: cleanData.physical_address,
                city: cleanData.city,
                ward: cleanData.ward,
                postal_code: cleanData.postal_code,
                country_of_origin: cleanData.country_of_origin,
                preferred_language: cleanData.preferred_language,
                years_in_japan: cleanData.years_in_japan,
                occupation: cleanData.occupation,
                industry: cleanData.industry,
                education_level: cleanData.education_level,
                church_background: cleanData.church_background,
                salvation_date: cleanData.salvation_date,
                baptism_status: cleanData.baptism_status,
                baptism_date: cleanData.baptism_date,
                referral_name: cleanData.invited_by_name,
                referral_source: cleanData.invite_method,
                household_type,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            if (error) throw error;
            toast.success("Identity updated successfully!");
        } catch (e) {
            console.error("Profile Save Error:", e);
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
                ministry_role: newMinistryRoleTitle || 'Member',
                status: 'active',
                joined_date: new Date().toISOString()
            };
            const { data, error } = await supabase.from('ministry_members').insert([rec]).select().single();
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
            const { data, error } = await supabase.from('member_skills').insert([{
                user_id: user.id,
                skill_name: newSkill,
                skill_category: newSkillCat,
                skill_level: newSkillLevel,
                years_experience: newSkillExp
            }]).select().single();
            if (error) throw error;
            setSkills([...skills, data]);
            toast.success("Skill added!");
        } catch (e) {
            toast.error("Error adding skill");
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

    const handleLogAttendance = async (status: string) => {
        if (!user) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase.from('attendance_logs').upsert({
                user_id: user.id,
                status,
                service_date: today
            }, { onConflict: 'user_id, service_date' });

            if (error) throw error;
            setUpcomingAttendance(status);
            toast.success(`Marked as ${status.replace('-', ' ')}!`);
            loadData(user.id);
        } catch (e) {
            toast.error("Failed to log attendance");
        }
    };

    const handleRequestMembership = async () => {
        if (!user || !profile) return;
        try {
            const { data, error } = await supabase.from('membership_requests').insert({
                user_id: user.id,
                org_id: profile.org_id,
                status: 'pending'
            }).select().single();

            if (error) throw error;
            setMembershipRequest(data);
            toast.success("Membership request submitted!");
        } catch (e) {
            toast.error("Failed to submit request");
        }
    };
    const handleLogout = async () => {
        try {
            await Auth.logout();
            window.location.href = BP || '/';
        } catch (error) {
            toast.error("Error logging out.");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Clock className="w-8 h-8 animate-spin text-muted-foreground opacity-20" /></div>;
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden pb-20 transition-colors duration-500">
            <TopNav user={user} />

            <div className="flex h-[calc(100vh-65px)]">

                {/* GLOBAL LEFT SIDEBAR */}
                <aside className="w-64 bg-card border-r border-border flex-col hidden md:flex shrink-0 transition-colors">
                    <div className="p-8">
                        <img src={`${BP}/church-logo.png`} alt="JKC" className="w-12 h-12 object-contain" />
                    </div>
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted font-semibold text-sm transition-all">
                            <LayoutDashboard className="w-4 h-4" /> Home
                        </Link>
                        <div className="pt-4 pb-2 px-4 text-xs font-black uppercase tracking-widest text-primary opacity-80">
                            Connection Card
                        </div>
                        {SIDEBAR_NAV.map(nav => (
                            <button
                                key={nav.id}
                                onClick={() => setActiveTab(nav.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === nav.id
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                <nav.icon className="w-4 h-4 shrink-0" /> {nav.label}
                            </button>
                        ))}
                        <div className="pt-8 w-full border-t border-border mt-4">
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
                <main className="flex-1 overflow-y-auto relative bg-background">
                    <div className="h-64 md:h-80 bg-primary relative">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        <Button className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md rounded-xl font-bold">
                            <Camera className="w-4 h-4 mr-2" /> Change Cover
                        </Button>
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 pb-12">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                            {/* LEFT PROFILE CARD */}
                            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                                <div className="bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden relative p-8 flex flex-col items-center transition-colors">
                                    <div className="w-32 h-32 rounded-full border-4 border-card bg-primary text-primary-foreground text-5xl font-black flex items-center justify-center relative shadow-xl z-10 mb-6">
                                        {profile?.name?.[0] || user?.name?.[0]}
                                    </div>
                                    <h2 className="text-2xl font-black text-center text-foreground">{profile?.name || user?.name}</h2>
                                    <p className="text-sm text-muted-foreground font-semibold mb-8 text-center">{profile?.country_of_origin || 'Local Assembly'}</p>

                                    <div className="w-full space-y-4 mb-8 text-foreground">
                                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-muted">
                                            <span className="text-sm font-semibold text-muted-foreground">Completed Days</span>
                                            <span className="text-primary font-black">{stats.completed}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-muted">
                                            <span className="text-sm font-semibold text-muted-foreground">Current Streak</span>
                                            <span className="text-amber-500 font-black">{stats.streak}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={!!membershipRequest && membershipRequest.status === 'pending'}
                                        onClick={() => {
                                            if (profile?.membership_status === 'member') {
                                                toast.info("You are an approved member.");
                                            } else if (membershipRequest?.status === 'pending') {
                                                toast.info("Your membership request is under review.");
                                            } else {
                                                handleRequestMembership();
                                            }
                                        }}
                                        className={`w-full py-6 rounded-xl font-bold border-border hover:bg-muted capitalize ${profile?.membership_status === 'member' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                            membershipRequest?.status === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                'text-primary border-primary/20 shadow-lg shadow-primary/5 hover:scale-[1.02] active:scale-95 transition-all'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                {profile?.membership_status === 'member' ? 'Approved' :
                                                    membershipRequest?.status === 'pending' ? 'Pending Approval' :
                                                        'Request Membership'}
                                            </span>
                                            <span>
                                                {profile?.membership_status === 'member' ? (profile?.growth_stage?.replace('_', ' ') || 'Member') :
                                                    membershipRequest?.status === 'pending' ? 'Reviewing' : 'Submit Join Request'}
                                            </span>
                                        </div>
                                    </Button>
                                </div>
                            </div>

                            {/* RIGHT TABBED CONTENT */}
                            <div className="flex-1 bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden transition-colors">
                                <div className="flex md:hidden overflow-x-auto border-b border-border custom-scrollbar">
                                    {SIDEBAR_NAV.map(nav => (
                                        <button
                                            key={nav.id}
                                            onClick={() => setActiveTab(nav.id)}
                                            className={`whitespace-nowrap px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === nav.id
                                                ? 'border-[var(--primary)] text-[var(--primary)]'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {nav.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 md:p-10 lg:p-12">
                                    <div className="pb-8 border-b border-border mb-8">
                                        <h3 className="text-2xl font-black capitalize flex items-center gap-3 text-foreground">
                                            {(() => {
                                                const Icon = SIDEBAR_NAV.find(n => n.id === activeTab)?.icon;
                                                return Icon ? <Icon className="w-6 h-6 text-primary" /> : null;
                                            })()}
                                            {SIDEBAR_NAV.find(n => n.id === activeTab)?.label}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium mt-2">Manage your structured data for Church analytics.</p>
                                    </div>

                                    {/* CHURCH IMPACT DASHBOARD (NEW) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex flex-col justify-between group hover:bg-emerald-500/10 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <Users className="w-5 h-5 text-emerald-500" />
                                                <TrendingUp className="w-4 h-4 text-emerald-500/50" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">Recent Growth</p>
                                                <p className="text-2xl font-black text-emerald-500">+{churchImpact.memberGrowth} members</p>
                                                <p className="text-[10px] text-muted-foreground font-medium opacity-70">Joined the mission this month</p>
                                            </div>
                                        </div>

                                        <div className="bg-violet-500/5 border border-violet-500/10 rounded-3xl p-6 flex flex-col justify-between group hover:bg-violet-500/10 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <Trophy className="w-5 h-5 text-violet-500" />
                                                <Sparkles className="w-4 h-4 text-violet-500/50" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500/60 mb-1">Lives Impacted</p>
                                                <p className="text-2xl font-black text-violet-500">{churchImpact.totalSalvations} Salvations</p>
                                                <p className="text-[10px] text-muted-foreground font-medium opacity-70">Recorded in the last quarter</p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex flex-col justify-between group hover:bg-blue-500/10 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <Activity className="w-5 h-5 text-blue-500" />
                                                <ArrowUpRight className="w-4 h-4 text-blue-500/50" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 mb-1">Mission Progress</p>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-2xl font-black text-blue-500">{churchImpact.missionProgress}%</p>
                                                    <div className="flex-1 shrink-0 h-1.5 bg-blue-500/10 rounded-full mb-2 overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${churchImpact.missionProgress}%` }}></div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium opacity-70">Goal: Church Expansion 2026</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prophetic Intelligence Indicator (PIL) */}
                                    {propheticInsight && (
                                        <div className={`mb-8 p-6 rounded-3xl border animate-in slide-in-from-top duration-500 ${propheticInsight.risk_level === 'critical' || propheticInsight.risk_level === 'high'
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : 'bg-violet-500/10 border-violet-500/20'
                                            }`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${propheticInsight.risk_level === 'critical' || propheticInsight.risk_level === 'high'
                                                    ? 'bg-red-500/20 text-red-500'
                                                    : 'bg-violet-500/20 text-violet-500'
                                                    }`}>
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`text-sm font-black uppercase tracking-widest ${propheticInsight.risk_level === 'critical' || propheticInsight.risk_level === 'high' ? 'text-red-500' : 'text-violet-500'
                                                            }`}>
                                                            {propheticInsight.category === 'drop_off' ? 'Spiritual Health Alert' : 'Prophetic Insight'}
                                                        </h4>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase border-current opacity-50">{propheticInsight.probability_score}% Probability</Badge>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground mb-1">{propheticInsight.insight_title}</p>
                                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{propheticInsight.insight_description}</p>

                                                    {propheticInsight.category === 'drop_off' && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button size="sm" className="bg-foreground text-background font-bold text-[10px] h-8 rounded-lg px-4 hover:opacity-90">
                                                                Renew My Commitment
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="border-border font-bold text-[10px] h-8 rounded-lg px-4 bg-card text-foreground">
                                                                Request Pastoral Call
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* IDENTITY TAB */}
                                    {activeTab === 'identity' && (
                                        <form onSubmit={idForm.handleSubmit(onIdentitySubmit)} className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Full Name</label>
                                                    <Input {...idForm.register("name")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Gender</label>
                                                    <select {...idForm.register("gender")} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none focus:ring-[var(--primary)] text-foreground">
                                                        <option value="">Select...</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Phone Number</label>
                                                    <Input {...idForm.register("phone_number")} placeholder="+81..." className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Date of Birth</label>
                                                    <Input type="date" {...idForm.register("birthdate")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Marital Status</label>
                                                    <select {...idForm.register("marital_status")} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none focus:ring-[var(--primary)] text-foreground">
                                                        <option value="">Select...</option>
                                                        <option value="Single">Single</option>
                                                        <option value="Married">Married</option>
                                                        <option value="Widowed">Widowed</option>
                                                        <option value="Divorced">Divorced</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Country of Origin</label>
                                                    <Input {...idForm.register("country_of_origin")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Preferred Language</label>
                                                    <select {...idForm.register("preferred_language")} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none focus:ring-primary text-foreground">
                                                        <option value="EN">English</option>
                                                        <option value="JP">Japanese</option>
                                                        <option value="BOTH">Bilingual</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Years in Japan</label>
                                                    <Input type="number" {...idForm.register("years_in_japan")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Occupation</label>
                                                    <Input {...idForm.register("occupation")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Industry</label>
                                                    <Input {...idForm.register("industry")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Education Level</label>
                                                    <Input {...idForm.register("education_level")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">City</label>
                                                    <Input {...idForm.register("city")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Ward</label>
                                                    <Input {...idForm.register("ward")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Postal Code</label>
                                                    <Input {...idForm.register("postal_code")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Full Home Address</label>
                                                    <Input {...idForm.register("physical_address")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                </div>

                                                <div className="pt-4 md:col-span-2 border-t border-border mt-4">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Spiritual Background & Milestones</h4>
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Church Background</label>
                                                            <Input {...idForm.register("church_background")} placeholder="Previous church or tradition" className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Date of Salvation</label>
                                                            <Input type="date" {...idForm.register("salvation_date")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Baptism Status</label>
                                                            <select {...idForm.register("baptism_status")} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none focus:ring-primary text-foreground">
                                                                <option value="not_baptized">Not Baptized</option>
                                                                <option value="baptized">Baptized</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Date of Baptism</label>
                                                            <Input type="date" {...idForm.register("baptism_date")} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 md:col-span-2 border-t border-border">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Referral Tracking</h4>
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Who invited you?</label>
                                                            <Input {...idForm.register("invited_by_name")} placeholder="Member Name or Guest" className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Method</label>
                                                            <select {...idForm.register("invite_method")} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none focus:ring-primary text-foreground">
                                                                <option value="Friend">Friend / Family</option>
                                                                <option value="Social Media">Social Media</option>
                                                                <option value="Street Outreach">Street Outreach</option>
                                                                <option value="Web Search">Web Search</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
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
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">First Visit Date</label>
                                                    <Input type="date" value={milestones.first_visit_date || ''} onChange={e => setMilestones({ ...milestones, first_visit_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Salvation Decision Date</label>
                                                    <Input type="date" value={milestones.salvation_date || ''} onChange={e => setMilestones({ ...milestones, salvation_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Baptism Date</label>
                                                    <Input type="date" value={milestones.baptism_date || ''} onChange={e => setMilestones({ ...milestones, baptism_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Membership Date</label>
                                                    <Input type="date" value={milestones.membership_date || ''} onChange={e => setMilestones({ ...milestones, membership_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Foundation Class Completed</label>
                                                    <Input type="date" value={milestones.foundation_class_date || ''} onChange={e => setMilestones({ ...milestones, foundation_class_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Leadership Training</label>
                                                    <Input type="date" value={milestones.leadership_training_date || ''} onChange={e => setMilestones({ ...milestones, leadership_training_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Ordnained / Commissioned</label>
                                                    <Input type="date" value={milestones.ordained_date || ''} onChange={e => setMilestones({ ...milestones, ordained_date: e.target.value })} className="h-14 rounded-2xl bg-background border-foreground/10 px-4" />
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
                                            {/* Ministry Invitations (NEW) */}
                                            {notifications.filter(n => n.type === 'invitation').length > 0 && (
                                                <div className="bg-violet-500/10 border border-violet-500/20 rounded-3xl p-6 mb-8">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Sparkles className="w-5 h-5 text-violet-500" />
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-violet-500">Ministry Opportunities</h4>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {notifications.filter(n => n.type === 'invitation').map(notif => (
                                                            <div key={notif.id} className="flex items-center justify-between p-4 bg-background border border-violet-500/10 rounded-2xl">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-black text-foreground">{notif.title}</p>
                                                                    <p className="text-[10px] text-foreground/60">{notif.message}</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => handleAcceptInvitation(notif)}
                                                                        className="h-8 rounded-lg bg-emerald-500 text-white text-[10px] font-bold px-4 hover:bg-emerald-600"
                                                                    >
                                                                        Accept & Join
                                                                    </Button>
                                                                    <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold px-4 text-foreground/40">Later</Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

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
                                                                <p className="text-xs text-foreground/60">{m.ministry_role || 'Member'}</p>
                                                            </div>
                                                            <div className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full text-center ${m.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                                                                {m.status?.toUpperCase() || 'ACTIVE'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* JUNIOR CHURCH TAB */}
                                    {activeTab === 'junior-church' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-foreground/5 border border-foreground/10 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex items-center justify-between pb-4 border-b border-foreground/10">
                                                    <div>
                                                        <h4 className="font-black text-lg">My Children</h4>
                                                        <p className="text-xs text-foreground/50">Manage your children's enrollment in Junior Church</p>
                                                    </div>
                                                    <Button variant="outline" className="h-10 rounded-xl border-foreground/10 font-bold px-4">
                                                        <Plus className="w-4 h-4 mr-2" /> Add Child
                                                    </Button>
                                                </div>

                                                {children.length > 0 ? (
                                                    <div className="grid gap-4">
                                                        {children.map(child => (
                                                            <div key={child.id} className="flex items-center justify-between p-5 bg-background border border-foreground/10 rounded-2xl">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 font-black">
                                                                        {child.child_name[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-foreground">{child.child_name}</p>
                                                                        <p className="text-xs text-foreground/40">{child.child_birthdate || 'Age not specified'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[9px] font-black uppercase">Active</Badge>
                                                                    <p className="text-[10px] text-foreground/30 mt-1">Last seen: Feb 26</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-20 bg-background/50 rounded-2xl border border-dashed border-foreground/10">
                                                        <Sparkles className="w-10 h-10 text-foreground/10 mx-auto mb-4" />
                                                        <p className="text-xs font-black text-foreground/30 uppercase tracking-widest">No children linked yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* GIVING TAB */}
                                    {activeTab === 'giving' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="grid md:grid-cols-2 gap-6 pb-8 border-b border-foreground/10">
                                                <div className="bg-foreground/5 p-6 rounded-3xl border border-foreground/10">
                                                    <p className="text-xs font-black text-foreground/40 uppercase tracking-widest mb-4">Giving Preferences</p>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-semibold">Automatic Tithing</span>
                                                            <input type="checkbox" checked={givingData.tithe_status} onChange={e => setGivingData({ ...givingData, tithe_status: e.target.checked })} />
                                                        </div>
                                                        <select value={givingData.preferred_giving_method} onChange={e => setGivingData({ ...givingData, preferred_giving_method: e.target.value })} className="w-full h-12 rounded-xl bg-background border border-foreground/10 px-4 text-sm font-semibold">
                                                            <option>Cash</option>
                                                            <option>Bank Transfer</option>
                                                            <option>Card / Digital</option>
                                                        </select>
                                                        <Button onClick={saveGiving} className="w-full bg-[var(--primary)] text-white font-black h-12 rounded-xl">Save Preferences</Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-black text-lg text-foreground">Recent Giving History</h4>
                                                <div className="grid gap-3">
                                                    {givingHistory.length > 0 ? givingHistory.map(g => (
                                                        <div key={g.id} className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl transition-colors">
                                                            <div>
                                                                <p className="text-sm font-black text-foreground">{g.record_type.toUpperCase()}</p>
                                                                <p className="text-[10px] text-muted-foreground">{g.given_date}</p>
                                                            </div>
                                                            <p className="font-black text-[var(--primary)]">¥{Number(g.amount).toLocaleString()}</p>
                                                        </div>
                                                    )) : (
                                                        <p className="text-center py-10 text-xs text-muted-foreground font-bold uppercase tracking-widest">No giving records found</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CARE TAB */}
                                    {activeTab === 'care' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
                                                <div className="flex flex-col gap-4">
                                                    <Input placeholder="My prayer is..." value={newPrayerText} onChange={e => setNewPrayerText(e.target.value)} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <select value={newPrayerCategory} onChange={e => setNewPrayerCategory(e.target.value)} className="h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none flex-1 text-foreground">
                                                            {PRAYER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                        <select value={newPrayerUrgency} onChange={e => setNewPrayerUrgency(e.target.value)} className="h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none w-full sm:w-48 text-foreground">
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
                                                        <div key={p.id} className="flex flex-col p-4 bg-muted border border-border rounded-2xl space-y-3 transition-colors">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <p className={`font-bold text-sm text-foreground ${p.status === 'Answered' ? 'line-through opacity-50' : ''}`}>{p.request_text}</p>
                                                                <span className="text-xs shrink-0 bg-card px-2 py-1 rounded-md font-semibold text-muted-foreground">{p.category}</span>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <Button onClick={() => togglePrayer(p.id, p.status)} variant="outline" size="sm" className="text-xs font-bold h-8 border-border bg-card text-foreground">
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
                                            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Category</label>
                                                        <select value={newSkillCat} onChange={e => setNewSkillCat(e.target.value)} className="h-14 w-full rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none text-foreground">
                                                            {SKILL_OPTIONS.slice(0, 10).map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Talent</label>
                                                        <select value={newSkill} onChange={e => setNewSkill(e.target.value)} className="h-14 w-full rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none text-foreground">
                                                            {SKILL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Level</label>
                                                        <select value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)} className="h-14 w-full rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none text-foreground">
                                                            <option>Beginner</option>
                                                            <option>Intermediate</option>
                                                            <option>Expert</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <div className="space-y-1 flex-1">
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Yrs Exp</label>
                                                            <Input type="number" value={newSkillExp} onChange={e => setNewSkillExp(parseInt(e.target.value))} className="h-14 rounded-2xl bg-muted border-border px-4 text-foreground" />
                                                        </div>
                                                        <Button onClick={handleAddSkill} className="h-14 px-8 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg">Link</Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map(s => (
                                                        <div key={s.id} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-muted border border-border shadow-sm transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                                                    <Briefcase className="w-5 h-5 text-[var(--primary)]" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black leading-tight text-foreground">{s.skill_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{s.skill_category} · {s.years_experience} Yrs</p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] font-black border-[var(--primary)]/20 text-[var(--primary)] bg-[var(--primary)]/5 uppercase">
                                                                {s.skill_level}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* MINISTRY MATCHING ENGINE (NEW) */}
                                                <div className="pt-8 border-t border-border overflow-hidden">
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <Activity className="w-5 h-5 text-[var(--primary)]" />
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ministry Recommendations</h4>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {skills.length > 0 ? (
                                                            [...new Set(skills.map(s => {
                                                                const name = s.skill_name.toLowerCase();
                                                                if (name.includes('music') || name.includes('choir') || name.includes('sing')) return 'Worship Ministry';
                                                                if (name.includes('tech') || name.includes('media') || name.includes('video')) return 'Media / Production';
                                                                if (name.includes('teaching') || name.includes('children') || name.includes('kid')) return 'Children\'s Ministry';
                                                                if (name.includes('hospitality') || name.includes('service') || name.includes('usher')) return 'Hospitality';
                                                                if (name.includes('counsel')) return 'Counseling Ministry';
                                                                if (name.includes('finance') || name.includes('admin')) return 'Finance Team';
                                                                return 'General Service';
                                                            }))].map(rec => (
                                                                <div key={rec} className="flex items-center justify-between p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-2xl group hover:bg-[var(--primary)]/10 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                                                            <Heart className="w-5 h-5 text-[var(--primary)]" />
                                                                        </div>
                                                                        <p className="font-black text-sm">{rec}</p>
                                                                    </div>
                                                                    <Button variant="ghost" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:bg-transparent">
                                                                        Join Team <ChevronRight className="w-4 h-4 ml-1" />
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground font-medium italic">Add your skills above to see ministry matches.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* GIVING TAB */}
                                    {activeTab === 'giving' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
                                                <div className="flex flex-col gap-6">
                                                    <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl transition-colors">
                                                        <div>
                                                            <h5 className="font-bold text-foreground">I am a Tithing Member</h5>
                                                            <p className="text-xs text-muted-foreground">Help leadership project church budgets</p>
                                                        </div>
                                                        <input type="checkbox" checked={givingData.tithe_status} onChange={e => setGivingData({ ...givingData, tithe_status: e.target.checked })} className="w-6 h-6 rounded" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-1">Preferred Giving Method</label>
                                                        <select value={givingData.preferred_giving_method} onChange={e => setGivingData({ ...givingData, preferred_giving_method: e.target.value })} className="w-full h-14 rounded-2xl bg-muted border border-border px-4 text-sm font-semibold outline-none text-foreground">
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
                                            {/* Upcoming Attendance Intent (NEW) */}
                                            <div className="bg-violet-500/5 border border-violet-500/20 rounded-3xl p-6 md:p-8 space-y-6">
                                                <div className="flex items-center justify-between pb-4 border-b border-border transition-colors">
                                                    <div>
                                                        <h4 className="font-black text-lg text-violet-500 flex items-center gap-2">
                                                            <CalendarCheck className="w-6 h-6" /> Upcoming Service Intent
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">Let leadership know your plans for the next service.</p>
                                                    </div>
                                                    {upcomingAttendance && (
                                                        <Badge className="bg-violet-500 text-white border-0 text-[10px] font-black uppercase">
                                                            Current: {upcomingAttendance.replace('-', ' ')}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {[
                                                        { id: 'in-person', label: 'In-Person', icon: MapPin, color: 'text-violet-500' },
                                                        { id: 'online', label: 'Watching Online', icon: Globe, color: 'text-blue-500' },
                                                        { id: 'not-attending', label: 'Not Attending', icon: XCircle, color: 'text-muted-foreground' }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleLogAttendance(opt.id as any)}
                                                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${upcomingAttendance === opt.id
                                                                ? 'border-violet-500 bg-violet-500/10'
                                                                : 'border-border bg-card hover:bg-muted'
                                                                }`}
                                                        >
                                                            <opt.icon className={`w-8 h-8 mb-3 ${opt.color}`} />
                                                            <span className="text-xs font-black uppercase tracking-widest text-foreground">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground text-center uppercase font-bold tracking-widest opacity-60">
                                                    Your intent helps us steward resources like child care and online bandwidth.
                                                </p>
                                            </div>

                                            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
                                                <h4 className="font-black text-lg pb-4 border-b border-border text-foreground">Recent Attendance History</h4>
                                                <div className="grid gap-3">
                                                    {attendanceRecords.length > 0 ? attendanceRecords.map((r, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                                    <CalendarCheck className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-foreground">{new Date(r.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{(r.event_type || 'Sunday Service').replace('_', ' ')}</p>
                                                                </div>
                                                            </div>
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-12 text-muted-foreground font-bold uppercase tracking-widest text-xs">No attendance recorded yet.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMMUNITY TAB */}
                                    {activeTab === 'community' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
                                                <h4 className="font-black text-lg pb-4 border-b border-border text-foreground">Fellowship Circles</h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {fellowshipGroups.length > 0 ? fellowshipGroups.map(g => {
                                                        const joined = userGroups.includes(g.id);
                                                        return (
                                                            <div key={g.id} className="bg-muted border border-border rounded-2xl p-5 flex flex-col justify-between transition-colors">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] font-black bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md uppercase tracking-widest">{g.meeting_frequency}</span>
                                                                        {joined && <Badge className="bg-emerald-500 text-white border-0">Joined</Badge>}
                                                                    </div>
                                                                    <h5 className="font-bold text-lg mb-1 text-foreground">{g.name}</h5>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                                                                        <MapPin className="w-3 h-3" /> {g.location || 'Online / Various'}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleJoinGroup(g.id)}
                                                                    variant={joined ? "outline" : "default"}
                                                                    className={`w-full font-bold rounded-xl ${joined ? 'border-destructive/20 text-destructive hover:bg-destructive/5' : 'bg-[var(--primary)] text-white'}`}
                                                                >
                                                                    {joined ? 'Leave Group' : 'Join Circle'}
                                                                </Button>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="col-span-full py-12 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
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
