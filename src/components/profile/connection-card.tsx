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
    Milestone,
    Sparkles,
    Baby,
    Trash2,
    BookOpen,
    ShoppingBag,
    LogOut
} from "lucide-react";
import { supabase, AnalyticsService } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SoapJournal } from "@/lib/soap-journal";

import { mapProfileFromDB, mapProfileToDB } from "@/lib/profileFieldMap";

interface ProfileData {
    id: string;
    name: string;
    email: string;
    birthdate?: string;
    wedding_anniversary?: string;
    physical_address?: string;
    phone_number?: string;
    nationality?: string;
    preferred_language?: string;
    salvation_date?: string;
    org_id?: string;
}

interface ProfileViewProps {
    memberId?: string;
    isAdmin?: boolean;
}

export function ProfileView({ memberId, isAdmin }: ProfileViewProps = {}) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [stats, setStats] = useState({ completed: 0, streak: 0 });
    const [saving, setSaving] = useState(false);
    const [pastoralNotes, setPastoralNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    // New Module States
    const [household, setHousehold] = useState<any[]>([]);
    const [newHouseholdName, setNewHouseholdName] = useState("");
    const [newHouseholdRel, setNewHouseholdRel] = useState("Spouse");

    const [prayers, setPrayers] = useState<any[]>([]);
    const [newPrayer, setNewPrayer] = useState("");

    const [ministryRoles, setMinistryRoles] = useState<any[]>([]);
    const [newMinistry, setNewMinistry] = useState("");
    const [newMinistryId, setNewMinistryId] = useState<string | null>(null);
    const [newMinistryRole, setNewMinistryRole] = useState("member");
    const [ministrySearchQuery, setMinistrySearchQuery] = useState('');
    const [ministrySearchResults, setMinistrySearchResults] = useState<any[]>([]);
    const [showMinistryDropdown, setShowMinistryDropdown] = useState(false);

    const [stewardship, setStewardship] = useState<any[]>([]);
    const [showGivingForm, setShowGivingForm] = useState(false);
    const [givingAmount, setGivingAmount] = useState('');
    const [givingFund, setGivingFund] = useState('tithe');
    const [givingLoading, setGivingLoading] = useState(false);
    const [showRecurring, setShowRecurring] = useState(false);
    const [recurringAmount, setRecurringAmount] = useState('');
    const [recurringFund, setRecurringFund] = useState('tithe');
    const [recurringInterval, setRecurringInterval] = useState('month');
    const [recurringPledges, setRecurringPledges] = useState<any[]>([]);
    const [recurringLoading, setRecurringLoading] = useState(false);

    const [attendanceData, setAttendanceData] = useState<number[]>([]);

    // Skills & Talents
    const [skills, setSkills] = useState<any[]>([]);
    const [newSkillName, setNewSkillName] = useState("");
    const [newSkillCategory, setNewSkillCategory] = useState("Technical");
    const [newSkillLevel, setNewSkillLevel] = useState("Beginner");

    // Junior Church (Children)
    const [children, setChildren] = useState<any[]>([]);
    const [newChildName, setNewChildName] = useState("");
    const [newChildBirthdate, setNewChildBirthdate] = useState("");
    const [newChildMedical, setNewChildMedical] = useState("");

    // Bible Study Groups
    const [myGroups, setMyGroups] = useState<any[]>([]);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);

    // Merchandise Orders
    const [merchOrders, setMerchOrders] = useState<any[]>([]);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) setUser({ id: authUser.id });
            const targetId = memberId || authUser?.id;

            if (!targetId) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();

            if (profileData) {
                const mapped = mapProfileFromDB(profileData);
                setProfile({
                    id: targetId,
                    name: mapped.name || '',
                    email: authUser?.email || '',
                    birthdate: mapped.birthdate,
                    wedding_anniversary: mapped.wedding_anniversary,
                    physical_address: mapped.physical_address,
                    phone_number: mapped.phone_number,
                    nationality: mapped.nationality,
                    preferred_language: mapped.preferred_language || 'EN',
                    org_id: profileData.org_id
                });
            } else if (authUser && !memberId) {
                setProfile({
                    id: targetId,
                    name: authUser?.user_metadata?.full_name || '',
                    email: authUser?.email || '',
                    birthdate: '',
                    physical_address: '',
                    phone_number: '',
                    nationality: '',
                    preferred_language: 'EN',
                    org_id: authUser?.user_metadata?.org_id
                });
            }

            // Load household members from DB
            const { data: hhData } = await supabase.from('household_members').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            setHousehold(hhData || []);

            // Load prayer requests from DB
            const { data: prData } = await supabase.from('prayer_requests').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id)
                .order('created_at', { ascending: false });
            setPrayers((prData || []).map((p: any) => ({ id: p.id, text: p.request_text, status: p.status === 'answered' ? 'ANSWERED' : 'PENDING', category: p.category, urgency: p.urgency, dbId: p.id })));

            // Load ministry roles from DB
            const { data: mrData } = await supabase.from('ministry_members').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            setMinistryRoles((mrData || []).map((m: any) => ({ id: m.id, role: m.ministry_name || m.ministry_role, status: m.is_active ? 'ACTIVE' : 'PAST' })));

            // Load financial records (giving/tithe) from DB
            const { data: frData } = await supabase.from('financial_records').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id)
                .order('given_date', { ascending: false }).limit(12);
            setStewardship((frData || []).map((f: any) => ({ id: f.id, date: f.given_date, fund: f.record_type || 'Tithe', amount: f.amount || 0 })));

            // Load recurring pledges
            const { data: pledgesData } = await supabase.functions.invoke('recurring-giving', {
                body: {
                    action: 'list',
                    org_id: profileData?.org_id || authUser?.user_metadata?.org_id,
                    user_id: targetId,
                }
            });
            setRecurringPledges(pledgesData?.pledges || []);

            // Load attendance records for the chart
            const { data: atData } = await supabase.from('attendance_records').select('attended')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id)
                .order('event_date', { ascending: false }).limit(7);
            setAttendanceData((atData || []).map((a: any) => a.attended ? 100 : 20).reverse());

            // Load skills & talents from DB
            const { data: skData } = await supabase.from('member_skills').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            setSkills(skData || []);

            // Load children (guardian_links) from DB
            const { data: kidData } = await supabase.from('guardian_links').select('*')
                .eq('guardian_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            setChildren(kidData || []);

            // Load Bible Study Group memberships
            const { data: bgData } = await supabase.from('bible_study_group_members').select('*, bible_study_groups(*)')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            setMyGroups((bgData || []).map((r: any) => ({ ...r.bible_study_groups, membership_id: r.id })));

            // Load available groups for self-enrollment
            const { data: allGroups } = await supabase.from('bible_study_groups').select('id, name, location, meeting_day, meeting_time')
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id);
            const myGroupIds = (bgData || []).map((r: any) => r.group_id);
            setAvailableGroups((allGroups || []).filter((g: any) => !myGroupIds.includes(g.id)));

            // Load merchandise orders
            const { data: moData } = await supabase.from('merchandise_orders').select('*')
                .eq('user_id', targetId)
                .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id)
                .order('created_at', { ascending: false }).limit(10);
            setMerchOrders(moData || []);

            // Load Stats
            let journalStats = { completed: 0, streak: 0 };
            if (!memberId || memberId === authUser?.id) {
                journalStats = await SoapJournal.getStats(profileData?.org_id || authUser?.user_metadata?.org_id);
            } else {
                const { data: statsData } = await supabase.from('member_stats').select('*')
                    .eq('user_id', targetId)
                    .eq('org_id', profileData?.org_id || authUser?.user_metadata?.org_id)
                    .single();
                if (statsData) {
                    journalStats = { completed: statsData.completed_devotions || 0, streak: statsData.current_streak || 0 };
                }
            }

            setStats({
                completed: journalStats.completed,
                streak: journalStats.streak
            });

            if (isAdmin && targetId) {
                const { data: noteData } = await supabase
                    .from('pastoral_notes')
                    .select('note')
                    .eq('member_user_id', targetId)
                    .eq('org_id', profile?.org_id)
                    .eq('category', 'general')
                    .maybeSingle();
                if (noteData?.note) setPastoralNotes(noteData.note);
            }

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
            const updatePayload = mapProfileToDB({
                name: profile.name,
                birthdate: profile.birthdate,
                wedding_anniversary: profile.wedding_anniversary,
                physical_address: profile.physical_address,
                phone_number: profile.phone_number,
                nationality: profile.nationality,
                preferred_language: profile.preferred_language,
            });

            const { error } = await supabase
                .from('profiles')
                .update(updatePayload)
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

    const handleAddHousehold = async () => {
        if (!newHouseholdName || !profile || !profile.org_id) return;
        const newMember = { 
            user_id: profile.id, 
            org_id: profile.org_id,
            full_name: newHouseholdName, 
            relationship: newHouseholdRel 
        };
        const { data, error } = await supabase.from('household_members').insert(newMember).select().single();
        if (error) { toast.error('Failed to add household member'); console.error(error); return; }
        setHousehold([...household, data || { id: Date.now(), ...newMember }]);
        AnalyticsService.logEvent(profile.id, 'household_updated', { name: newHouseholdName });
        setNewHouseholdName("");
        toast.success('Household member added!');
    }

    const handleAddPrayer = async () => {
        if (!newPrayer || !profile || !profile.org_id) return;
        const payload = { 
            user_id: profile.id, 
            org_id: profile.org_id,
            request_text: newPrayer, 
            category: 'General', 
            urgency: 'normal', 
            status: 'active' 
        };
        const { data, error } = await supabase.from('prayer_requests').insert(payload).select().single();
        if (error) { toast.error('Failed to submit prayer request'); console.error(error); return; }
        setPrayers([...prayers, { id: data?.id || Date.now(), text: newPrayer, status: 'PENDING', dbId: data?.id }]);
        AnalyticsService.logEvent(profile.id, 'prayer_request_added', { request: newPrayer });
        setNewPrayer("");
        toast.success('Prayer request submitted!');
    }

    const handleTogglePrayer = async (id: number) => {
        const prayer = prayers.find(p => p.id === id);
        if (!prayer) return;
        const newStatus = prayer.status === 'PENDING' ? 'ANSWERED' : 'PENDING';
        const dbStatus = newStatus === 'ANSWERED' ? 'answered' : 'active';
        if (prayer.dbId) {
            await supabase.from('prayer_requests').update({ status: dbStatus, answered_date: newStatus === 'ANSWERED' ? new Date().toISOString() : null }).eq('id', prayer.dbId);
        }
        setPrayers(prayers.map(p => p.id === id ? { ...p, status: newStatus } : p));
        if (profile) AnalyticsService.logEvent(profile.id, 'prayer_status_changed', { id });
    }

    const handleMinistrySearch = async (query: string) => {
        setMinistrySearchQuery(query);
        if (!query.trim() || !profile?.org_id) { setMinistrySearchResults([]); return; }
        const { data } = await supabase
            .from('vw_ministry_directory')
            .select('id, name, category')
            .eq('org_id', profile.org_id)
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(8);
        setMinistrySearchResults(data || []);
        setShowMinistryDropdown(true);
    };

    const handleAddMinistry = async () => {
        if (!newMinistry || !newMinistryId || !profile || !profile.org_id) return;
        const payload = { 
            user_id: profile.id, 
            org_id: profile.org_id,
            ministry_id: newMinistryId,
            ministry_name: newMinistry, 
            ministry_role: newMinistryRole, 
            is_active: true 
        };
        const { data, error } = await supabase.from('ministry_members').insert(payload).select().single();
        if (error) { toast.error('Failed to add ministry role'); console.error(error); return; }
        setMinistryRoles([...ministryRoles, { id: data?.id || Date.now(), role: newMinistry, status: 'ACTIVE' }]);
        AnalyticsService.logEvent(profile.id, 'ministry_role_updated', { ministry: newMinistry });
        setNewMinistry("");
        setNewMinistryId(null);
        toast.success('Ministry role added!');
    }

    const handleAddSkill = async () => {
        if (!newSkillName || !profile || !profile.org_id) return;
        const payload = { 
            user_id: profile.id, 
            org_id: profile.org_id,
            skill_name: newSkillName, 
            skill_category: newSkillCategory, 
            skill_level: newSkillLevel, 
            years_experience: 0 
        };
        const { data, error } = await supabase.from('member_skills').insert(payload).select().single();
        if (error) { toast.error('Failed to add skill'); console.error(error); return; }
        setSkills([...skills, data || { id: Date.now(), ...payload }]);
        AnalyticsService.logEvent(profile.id, 'skill_added', { skill: newSkillName });
        setNewSkillName("");
        toast.success('Skill added!');
    }

    const handleRemoveSkill = async (skillId: string) => {
        if (!profile || !profile.org_id) return;
        const { error } = await supabase
            .from('member_skills')
            .delete()
            .eq('id', skillId)
            .eq('org_id', profile.org_id);
        if (error) { toast.error('Failed to remove skill'); return; }
        setSkills(skills.filter(s => s.id !== skillId));
    }

    const handleAddChild = async () => {
        if (!newChildName || !profile || !profile.org_id) return;
        const payload = { 
            guardian_id: profile.id, 
            org_id: profile.org_id,
            child_name: newChildName, 
            child_birthdate: newChildBirthdate || null, 
            medical_notes: newChildMedical || null, 
            relationship: 'Parent' 
        };
        const { data, error } = await supabase.from('guardian_links').insert(payload).select().single();
        if (error) { toast.error('Failed to add child'); console.error(error); return; }
        setChildren([...children, data || { id: Date.now(), ...payload }]);
        AnalyticsService.logEvent(profile.id, 'child_added', { name: newChildName });
        setNewChildName("");
        setNewChildBirthdate("");
        setNewChildMedical("");
        toast.success('Child registered!');
    }

    const handleRemoveChild = async (childId: string) => {
        if (!profile || !profile.org_id) return;
        const { error } = await supabase
            .from('guardian_links')
            .delete()
            .eq('id', childId)
            .eq('org_id', profile.org_id);
        if (error) { toast.error('Failed to remove child'); return; }
        setChildren(children.filter(c => c.id !== childId));
    }

    const handleJoinBibleGroup = async (groupId: string) => {
        if (!profile || !profile.org_id) return;
        const payload = { user_id: profile.id, org_id: profile.org_id, group_id: groupId };
        const { data, error } = await supabase.from('bible_study_group_members').insert(payload).select().single();
        if (error) { toast.error('Failed to join group'); console.error(error); return; }
        // Move from available to my groups
        const joined = availableGroups.find(g => g.id === groupId);
        if (joined) {
            setMyGroups([...myGroups, { ...joined, membership_id: data?.id }]);
            setAvailableGroups(availableGroups.filter(g => g.id !== groupId));
        }
        AnalyticsService.logEvent(profile.id, 'bible_group_joined', { groupId });
        toast.success('Joined Bible Study Group!');
    }

    const handleLeaveBibleGroup = async (membershipId: string, groupId: string) => {
        if (!profile || !profile.org_id) return;
        const { error } = await supabase
            .from('bible_study_group_members')
            .delete()
            .eq('id', membershipId)
            .eq('org_id', profile.org_id);
        if (error) { toast.error('Failed to leave group'); return; }
        const left = myGroups.find(g => g.id === groupId);
        if (left) {
            setAvailableGroups([...availableGroups, left]);
            setMyGroups(myGroups.filter(g => g.id !== groupId));
        }
    }

    async function handleSavePastoralNotes() {
        if (!profile || !isAdmin) return;
        try {
            setSavingNotes(true);
            const { error } = await supabase
                .from('pastoral_notes')
                .upsert({ 
                    member_user_id: profile.id, 
                    org_id: profile.org_id,
                    note: pastoralNotes, 
                    category: 'general',
                    is_resolved: false,
                    updated_at: new Date().toISOString() 
                }, { onConflict: 'member_user_id,category,is_resolved' });

            if (error) throw error;
            toast.success("Pastoral notes saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Error saving pastoral notes");
        } finally {
            setSavingNotes(false);
        }
    }

    const handleCancelPledge = async (subscriptionId: string) => {
        setRecurringLoading(true);
        try {
            const { error } = await supabase.functions.invoke('recurring-giving', {
                body: { action: 'cancel', subscription_id: subscriptionId, org_id: profile?.org_id, user_id: user?.id }
            });
            if (error) throw error;
            setRecurringPledges(prev => prev.map(p => p.stripe_subscription_id === subscriptionId ? { ...p, status: 'cancelled' } : p));
            toast.success('Recurring pledge cancelled.');
        } catch (err: any) {
            toast.error('Failed to cancel pledge: ' + err.message);
        } finally {
            setRecurringLoading(false);
        }
    };

    const handleGiveNow = async () => {
        if (!givingAmount || Number(givingAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setGivingLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('stripe-checkout', {
                body: {
                    type: 'giving',
                    amount: Number(givingAmount),
                    fund_designation: givingFund,
                    fund_name: givingFund.charAt(0).toUpperCase() + givingFund.slice(1),
                    currency: 'JPY',
                    org_id: profile?.org_id,
                    user_id: user?.id,
                    given_by_name: profile?.name,
                    given_by_email: profile?.email,
                    customer_email: profile?.email,
                    success_url: window.location.href + '?giving=success',
                    cancel_url: window.location.href,
                }
            });
            if (error) throw error;
            if (data?.url) window.location.href = data.url;
        } catch (err: any) {
            toast.error('Payment setup failed: ' + err.message);
        } finally {
            setGivingLoading(false);
        }
    };

    if (loading) {
        return <div className="p-20 flex justify-center"><Clock className="w-8 h-8 animate-spin opacity-20" /></div>;
    }

    if (!profile) return <div>Please log in to view profile details.</div>;

    return (
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Main Info Card */}
                <Card className="glass border-foreground/10 flex-1 w-full bg-background/50 rounded-[2.5rem] shadow-xl backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-primary/10 border-b border-foreground/10 pb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                {profile.name[0]}
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black">{profile.name}</CardTitle>
                                <CardDescription className="font-medium opacity-60">Member since 2026 • {profile.nationality || 'International'}</CardDescription>
                                <div className="flex gap-2 mt-3">
                                    <Badge className="bg-primary/20 text-primary border-primary/20">Active Member</Badge>
                                    <Badge variant="outline" className="border-foreground/20">{(profile.preferred_language || 'EN') === 'JP' ? '日本語' : 'English'}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <div className="w-full space-y-16">
                            {/* IDENTITY SECTION */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold border-b border-foreground/10 pb-4 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-[var(--primary)]" />
                                    Identity Details
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Full Name</label>
                                        <Input
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Phone Number</label>
                                        <Input
                                            value={profile.phone_number || ''}
                                            onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12"
                                            placeholder="+81 000-0000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Birthdate</label>
                                        <Input
                                            type="date"
                                            value={profile.birthdate || ''}
                                            onChange={e => setProfile({ ...profile, birthdate: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12 text-foreground/60"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Wedding Anniversary</label>
                                        <Input
                                            type="date"
                                            value={profile.wedding_anniversary || ''}
                                            onChange={e => setProfile({ ...profile, wedding_anniversary: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12 text-foreground/60"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Physical Address</label>
                                        <Input
                                            value={profile.physical_address || ''}
                                            onChange={e => setProfile({ ...profile, physical_address: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12"
                                            placeholder="1-2-3 Minato-ku, Tokyo, Japan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Country of Origin</label>
                                        <Input
                                            value={profile.nationality || ''}
                                            onChange={e => setProfile({ ...profile, nationality: e.target.value })}
                                            className="glass border-foreground/10 rounded-2xl h-12"
                                            placeholder="e.g. Zimbabwe, USA, Japan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Preferred Language</label>
                                        <select
                                            value={profile.preferred_language}
                                            onChange={e => setProfile({ ...profile, preferred_language: e.target.value as 'EN' | 'JP' })}
                                            className="w-full h-12 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 focus:ring-2 ring-primary/20 outline-none"
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
                            </div>

                            {/* FAMILY SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[var(--primary)]" />
                                        Household Management
                                    </h3>
                                </div>

                                <div className="flex gap-2">
                                    <Input placeholder="Name..." value={newHouseholdName} onChange={e => setNewHouseholdName(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12" />
                                    <select value={newHouseholdRel} onChange={e => setNewHouseholdRel(e.target.value)} className="w-32 h-12 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 focus:ring-2 ring-[var(--primary)]/20 outline-none">
                                        <option value="Spouse">Spouse</option>
                                        <option value="Child">Child</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <Button onClick={handleAddHousehold} className="rounded-2xl bg-[var(--primary)] h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20 shrink-0">
                                        <Plus className="w-4 h-4" /> LINK
                                    </Button>
                                </div>

                                {household.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                        <Users className="w-12 h-12 mb-3" />
                                        <p className="max-w-[200px] text-xs font-bold">No household members linked yet. Start building your family unit.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-4">
                                        {household.map((h: any, i: number) => (
                                            <div key={h.id || i} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold">{h.full_name || h.name}</p>
                                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{h.relationship}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SPIRITUAL SECTION */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold border-b border-foreground/10 pb-4 flex items-center gap-2">
                                    <Milestone className="w-5 h-5 text-[var(--primary)]" />
                                    Spiritual Journey
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <Card className="glass border-foreground/10 bg-foreground/5 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <Trophy className="w-8 h-8 text-amber-500 mb-2" />
                                        <div className="text-3xl font-black">{stats.streak}</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Day Streak</div>
                                    </Card>
                                    <Card className="glass border-foreground/10 bg-foreground/5 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <Heart className="w-8 h-8 text-red-500 mb-2" />
                                        <div className="text-3xl font-black">{stats.completed}</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Devotions Finished</div>
                                    </Card>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Spiritual Milestones</h4>
                                    <div className="space-y-3">
                                        <div className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                                    <Milestone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Faith Decision</p>
                                                    <p className="text-[10px] opacity-40 leading-none">Accepted Christ at Church Service</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-mono opacity-60">{profile?.salvation_date ?? 'Not recorded'}</p>
                                        </div>
                                        <Button variant="outline" className="w-full border-dashed border-foreground/10 rounded-2xl h-12 font-bold opacity-40 hover:opacity-100 transition-all">
                                            <Plus className="w-4 h-4 mr-2" /> RECORD NEW MILESTONE
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* JUNIOR CHURCH SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Baby className="w-5 h-5 text-pink-500" />
                                        Junior Church (Children)
                                    </h3>
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                    <Input placeholder="Child's name..." value={newChildName} onChange={e => setNewChildName(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12" />
                                    <Input type="date" placeholder="Birthdate" value={newChildBirthdate} onChange={e => setNewChildBirthdate(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12 text-foreground/60" />
                                    <Input placeholder="Medical / allergy notes" value={newChildMedical} onChange={e => setNewChildMedical(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12" />
                                </div>
                                <Button onClick={handleAddChild} className="rounded-2xl bg-pink-600 hover:bg-pink-500 h-12 px-6 font-bold gap-2 shadow-lg shadow-pink-500/20 text-white">
                                    <Plus className="w-4 h-4" /> REGISTER CHILD
                                </Button>

                                {children.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                        <Baby className="w-12 h-12 mb-3" />
                                        <p className="max-w-[200px] text-xs font-bold">No children registered. Add your children for Junior Church check-in.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {children.map((c: any) => (
                                            <div key={c.id} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold">{c.child_name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        {c.child_birthdate && <p className="text-[10px] opacity-40 uppercase tracking-widest">Born: {c.child_birthdate}</p>}
                                                        {c.medical_notes && <Badge variant="outline" className="text-[8px] h-4 border-red-500/30 text-red-400">{c.medical_notes}</Badge>}
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleRemoveChild(c.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SKILLS & TALENTS SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-teal-500" />
                                        Skills & Talents
                                    </h3>
                                </div>

                                <div className="grid md:grid-cols-3 gap-3">
                                    <Input placeholder="Skill (e.g. Video Editing)" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12" />
                                    <select value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)} className="w-full h-12 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 focus:ring-2 ring-teal-500/20 outline-none">
                                        <option value="Technical">Technical</option>
                                        <option value="Creative">Creative</option>
                                        <option value="Teaching">Teaching</option>
                                        <option value="Music">Music</option>
                                        <option value="Service">Service</option>
                                        <option value="Leadership">Leadership</option>
                                        <option value="Administration">Administration</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <select value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)} className="w-full h-12 rounded-2xl bg-foreground/5 border border-foreground/10 px-4 focus:ring-2 ring-teal-500/20 outline-none">
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                                <Button onClick={handleAddSkill} className="rounded-2xl bg-teal-600 hover:bg-teal-500 h-12 px-6 font-bold gap-2 shadow-lg shadow-teal-500/20 text-white">
                                    <Plus className="w-4 h-4" /> ADD SKILL
                                </Button>

                                {skills.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                        <Sparkles className="w-12 h-12 mb-3" />
                                        <p className="max-w-[200px] text-xs font-bold">No skills added yet. Your talents help us match you to the right ministry.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {skills.map((s: any) => (
                                            <div key={s.id} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-teal-400">{s.skill_name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        <Badge variant="outline" className="text-[8px] h-4 border-teal-500/30 text-teal-400">{s.skill_category}</Badge>
                                                        <Badge variant="outline" className="text-[8px] h-4 border-foreground/20">{s.skill_level}</Badge>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleRemoveSkill(s.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CHURCH SECTION */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold border-b border-foreground/10 pb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-[var(--primary)]" />
                                    Service & Ministry
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Service & Volunteering</h4>
                                        <div className="relative mb-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search ministries..."
                                                    value={ministrySearchQuery}
                                                    onChange={e => handleMinistrySearch(e.target.value)}
                                                    onFocus={() => ministrySearchResults.length > 0 && setShowMinistryDropdown(true)}
                                                    className="flex-1 glass border border-foreground/10 rounded-2xl h-10 px-4 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                                                />
                                                <select
                                                    value={newMinistryRole}
                                                    onChange={e => setNewMinistryRole(e.target.value)}
                                                    className="w-28 h-10 rounded-2xl bg-foreground/5 border border-foreground/10 px-2 text-sm focus:ring-2 ring-[var(--primary)]/20 outline-none"
                                                >
                                                    <option value="leader">Leader</option>
                                                    <option value="assistant">Assistant</option>
                                                    <option value="volunteer">Volunteer</option>
                                                    <option value="member">Member</option>
                                                </select>
                                                <Button
                                                    onClick={handleAddMinistry}
                                                    size="sm"
                                                    disabled={!newMinistry}
                                                    className="rounded-2xl bg-[var(--primary)] font-bold px-4 text-white"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {showMinistryDropdown && ministrySearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-foreground/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                                                    {ministrySearchResults.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewMinistry(m.name);
                                                                setNewMinistryId(m.id);
                                                                setMinistrySearchQuery(m.name);
                                                                setShowMinistryDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-foreground/5 transition-colors"
                                                        >
                                                            <p className="text-sm font-bold">{m.name}</p>
                                                            <p className="text-[10px] text-foreground/40 capitalize">{m.category}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {ministryRoles.map(m => (
                                                <div key={m.id} className={`glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between ${m.status !== 'ACTIVE' ? 'opacity-50' : ''}`}>
                                                    <p className="font-bold">{m.status === 'ACTIVE' ? <span className="text-[var(--primary)]">{m.role}</span> : m.role}</p>
                                                    <Badge variant={m.status === 'ACTIVE' ? 'default' : 'outline'} className={m.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500 border-0' : 'border-foreground/20'}>{m.status}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">Attendance Pulse</h4>
                                        <div className="glass border-foreground/10 rounded-3xl p-6">
                                            <div className="flex justify-between items-end gap-1 h-20 mb-4">
                                                {(attendanceData.length > 0 ? attendanceData : [50, 50, 50, 50, 50, 50, 50]).map((h, i) => (
                                                    <div key={i} className={`flex-1 rounded-t-sm transition-all ${h > 80 ? 'bg-primary' : 'bg-foreground/10'}`} style={{ height: `${h}%` }} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-center opacity-50 font-medium">Last 7 Sunday Services</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GIVING SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4 mb-2">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-[var(--primary)]" />
                                        Stewardship Log
                                    </h3>
                                    {!showGivingForm ? (
                                        <Button onClick={() => setShowGivingForm(true)} className="rounded-full bg-indigo-600 font-bold gap-2">
                                            <Plus className="w-4 h-4" /> GIVE NOW
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Input
                                                type="number"
                                                placeholder="Amount (JPY)"
                                                value={givingAmount}
                                                onChange={(e) => setGivingAmount(e.target.value)}
                                                className="w-32 h-9 rounded-full text-sm"
                                            />
                                            <select
                                                value={givingFund}
                                                onChange={(e) => setGivingFund(e.target.value)}
                                                className="h-9 rounded-full px-3 text-sm bg-background border border-foreground/20"
                                            >
                                                <option value="tithe">Tithe</option>
                                                <option value="offering">Offering</option>
                                                <option value="missions">Missions</option>
                                                <option value="building">Building</option>
                                            </select>
                                            <Button onClick={handleGiveNow} disabled={givingLoading} className="rounded-full bg-indigo-600 font-bold h-9 px-4 text-sm">
                                                {givingLoading ? 'Processing...' : 'Give'}
                                            </Button>
                                            <Button onClick={() => setShowGivingForm(false)} variant="ghost" className="rounded-full h-9 px-3 text-sm opacity-60">
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Recurring Giving Section */}
                                <div className="glass border-foreground/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Monthly Giving Pledges</p>
                                        <Button
                                            onClick={() => setShowRecurring(!showRecurring)}
                                            variant="ghost"
                                            className="h-7 px-3 text-[10px] rounded-full font-black opacity-60"
                                        >
                                            {showRecurring ? 'Hide' : 'Manage'}
                                        </Button>
                                    </div>

                                    {/* Active pledges list */}
                                    {recurringPledges.filter(p => p.status === 'active').length > 0 ? (
                                        <div className="space-y-2">
                                            {recurringPledges.filter(p => p.status === 'active').map((p: any) => (
                                                <div key={p.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                                                    <div>
                                                        <p className="text-xs font-bold capitalize">{p.fund_designation} — ¥{Number(p.amount).toLocaleString()}/{p.interval}</p>
                                                        <p className="text-[10px] opacity-50">Next: {p.next_billing_date || '—'}</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleCancelPledge(p.stripe_subscription_id)}
                                                        disabled={recurringLoading}
                                                        variant="ghost"
                                                        className="h-7 px-3 text-[10px] rounded-full text-red-400 hover:text-red-300 font-black"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] opacity-40">No active recurring pledges.</p>
                                    )}

                                    {/* Set up new pledge form */}
                                    {showRecurring && (
                                        <div className="pt-2 border-t border-foreground/10 space-y-3">
                                            <p className="text-[10px] opacity-60 leading-relaxed">
                                                Monthly giving requires Stripe setup — contact your church finance team to set up your first pledge, or use the form below to log a manual recurring pledge.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Amount (JPY)"
                                                    value={recurringAmount}
                                                    onChange={(e) => setRecurringAmount(e.target.value)}
                                                    className="w-32 h-8 rounded-full text-xs"
                                                />
                                                <select
                                                    value={recurringFund}
                                                    onChange={(e) => setRecurringFund(e.target.value)}
                                                    className="h-8 rounded-full px-3 text-xs bg-background border border-foreground/20"
                                                >
                                                    <option value="tithe">Tithe</option>
                                                    <option value="offering">Offering</option>
                                                    <option value="missions">Missions</option>
                                                    <option value="building">Building</option>
                                                </select>
                                                <select
                                                    value={recurringInterval}
                                                    onChange={(e) => setRecurringInterval(e.target.value)}
                                                    className="h-8 rounded-full px-3 text-xs bg-background border border-foreground/20"
                                                >
                                                    <option value="week">Weekly</option>
                                                    <option value="month">Monthly</option>
                                                    <option value="year">Yearly</option>
                                                </select>
                                            </div>
                                            <p className="text-[9px] opacity-40 italic">Your card will be charged automatically on the selected interval.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="glass border-foreground/10 bg-foreground/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Total Giving 2026</div>
                                            <div className="text-xl font-black">¥{stewardship.reduce((sum: number, s: any) => sum + (s.amount || 0), 0).toLocaleString()}</div>
                                        </Card>
                                        <Card className="glass border-foreground/10 bg-foreground/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Records</div>
                                            <div className="text-xl font-black">{stewardship.length}</div>
                                        </Card>
                                    </div>

                                    <div className="glass border-foreground/10 rounded-3xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-foreground/5 font-black uppercase tracking-widest opacity-40">
                                                <tr>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Fund</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {stewardship.map(s => (
                                                    <tr key={s.id}>
                                                        <td className="p-4 opacity-60">{s.date}</td>
                                                        <td className="p-4 font-bold">{s.fund}</td>
                                                        <td className="p-4 text-right font-black">¥{s.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* CARE SECTION */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b border-foreground/10 pb-4 flex items-center gap-2">
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
                                        <div className="flex gap-2 mb-4">
                                            <Input placeholder="My prayer is..." value={newPrayer} onChange={e => setNewPrayer(e.target.value)} className="glass border-foreground/10 rounded-2xl h-12" />
                                            <Button onClick={handleAddPrayer} className="rounded-2xl bg-[var(--primary)] h-12 px-6 font-bold shadow-lg shadow-primary/20 shrink-0 text-white">
                                                ADD
                                            </Button>
                                        </div>
                                        {prayers.length === 0 && <p className="text-xs opacity-50 text-center py-4">No active requests.</p>}
                                        {prayers.map(p => (
                                            <div key={p.id} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className={`font-bold text-sm ${p.status === 'ANSWERED' ? 'line-through opacity-50' : ''}`}>{p.text}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className={`text-[8px] h-4 ${p.status === 'PENDING' ? 'border-amber-500/50 text-amber-500' : 'border-green-500/50 text-green-500'}`}>{p.status}</Badge>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleTogglePrayer(p.id)} variant="ghost" size="sm" className="text-[10px] font-bold">
                                                    {p.status === 'PENDING' ? 'MARK ANSWERED' : 'MARK PENDING'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {isAdmin && (
                                        <div className="space-y-4 pt-6 border-t border-foreground/10">
                                            <h4 className="text-sm font-black uppercase text-amber-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Admin Only: Pastoral Notes
                                            </h4>
                                            <p className="text-xs opacity-60">
                                                These notes are strictly confidential and visible only to leadership. Use this area for counseling logs, discipleship tracking, and follow-up flags.
                                            </p>
                                            <div className="space-y-3">
                                                <textarea
                                                    className="w-full h-40 glass bg-foreground/5 border border-amber-500/20 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none placeholder:text-foreground/20"
                                                    placeholder="Enter counseling notes or follow-up insights..."
                                                    value={pastoralNotes}
                                                    onChange={(e) => setPastoralNotes(e.target.value)}
                                                />
                                                <div className="flex justify-end">
                                                    <Button
                                                        onClick={handleSavePastoralNotes}
                                                        disabled={savingNotes}
                                                        className="rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-10 px-6 gap-2"
                                                    >
                                                        {savingNotes ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        SAVE SECURE LOG
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* BIBLE STUDY GROUPS SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-orange-500" />
                                        Bible Study Groups
                                    </h3>
                                </div>

                                {myGroups.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40">My Groups</h4>
                                        {myGroups.map((g: any) => (
                                            <div key={g.id} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-orange-400">{g.name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        {g.location && <Badge variant="outline" className="text-[8px] h-4 border-orange-500/30 text-orange-400">{g.location}</Badge>}
                                                        {g.meeting_day && <p className="text-[10px] opacity-40">{g.meeting_day} {g.meeting_time || ''}</p>}
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleLeaveBibleGroup(g.membership_id, g.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                                    <LogOut className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {availableGroups.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Available Groups</h4>
                                        {availableGroups.map((g: any) => (
                                            <div key={g.id} className="glass border-foreground/10 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold">{g.name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        {g.location && <p className="text-[10px] opacity-40">{g.location}</p>}
                                                        {g.meeting_day && <p className="text-[10px] opacity-40">{g.meeting_day} {g.meeting_time || ''}</p>}
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleJoinBibleGroup(g.id)} size="sm" className="rounded-2xl bg-orange-600 hover:bg-orange-500 font-bold px-4 text-white">
                                                    <Plus className="w-4 h-4 mr-1" /> JOIN
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {myGroups.length === 0 && availableGroups.length === 0 && (
                                    <div className="py-12 border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                        <BookOpen className="w-12 h-12 mb-3" />
                                        <p className="max-w-[200px] text-xs font-bold">No Bible Study Groups available yet. Check back soon!</p>
                                    </div>
                                )}
                            </div>

                            {/* MERCHANDISE ORDERS SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <ShoppingBag className="w-5 h-5 text-violet-500" />
                                        Merchandise Orders
                                    </h3>
                                </div>

                                {merchOrders.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-foreground/10 rounded-3xl flex flex-col items-center justify-center opacity-40 text-center">
                                        <ShoppingBag className="w-12 h-12 mb-3" />
                                        <p className="max-w-[200px] text-xs font-bold">No orders yet. Visit the Store to browse.</p>
                                    </div>
                                ) : (
                                    <div className="glass border-foreground/10 rounded-3xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-foreground/5 font-black uppercase tracking-widest opacity-40">
                                                <tr>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {merchOrders.map((o: any) => (
                                                    <tr key={o.id}>
                                                        <td className="p-4 opacity-60">{o.created_at?.slice(0, 10)}</td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className={`text-[8px] h-4 ${
                                                                o.payment_status === 'paid' ? 'border-green-500/30 text-green-400' :
                                                                o.payment_status === 'pending' ? 'border-amber-500/30 text-amber-400' :
                                                                'border-foreground/20'
                                                            }`}>{o.payment_status || o.status}</Badge>
                                                        </td>
                                                        <td className="p-4 text-right font-black">¥{(o.total_amount || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        </div>
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
                            Your Connection Card is an encrypted record used specifically for your church's spiritual oversight.
                            Manage your data privacy in settings.
                        </p>
                    </Card>

                    <Card className="glass border-foreground/10 bg-foreground/5 rounded-[2rem] p-6">
                        <div className="flex items-center gap-3 mb-4 text-foreground/70">
                            <Users className="w-6 h-6" />
                            <h4 className="font-black text-sm uppercase tracking-wider">Church Family</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-foreground/10" />
                                <div className="flex-1">
                                    <div className="h-2 w-24 bg-foreground/20 rounded mb-1" />
                                    <div className="h-2 w-16 bg-foreground/10 rounded" />
                                </div>
                            </div>
                            <Button variant="outline" className="w-full rounded-2xl h-10 text-xs font-bold border-foreground/10">SHARE APP WITH FAMILY</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    );
}
