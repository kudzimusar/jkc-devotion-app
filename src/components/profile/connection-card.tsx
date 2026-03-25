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
    Trash2
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
}

interface ProfileViewProps {
    memberId?: string;
    isAdmin?: boolean;
}

export function ProfileView({ memberId, isAdmin }: ProfileViewProps = {}) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
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

    const [stewardship, setStewardship] = useState<any[]>([]);

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

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
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
                });
            }

            // Load household members from DB
            const { data: hhData } = await supabase.from('household_members').select('*').eq('user_id', targetId);
            setHousehold(hhData || []);

            // Load prayer requests from DB
            const { data: prData } = await supabase.from('prayer_requests').select('*').eq('user_id', targetId).order('created_at', { ascending: false });
            setPrayers((prData || []).map((p: any) => ({ id: p.id, text: p.request_text, status: p.status === 'answered' ? 'ANSWERED' : 'PENDING', category: p.category, urgency: p.urgency, dbId: p.id })));

            // Load ministry roles from DB
            const { data: mrData } = await supabase.from('ministry_members').select('*').eq('user_id', targetId);
            setMinistryRoles((mrData || []).map((m: any) => ({ id: m.id, role: m.ministry_name || m.ministry_role, status: m.is_active ? 'ACTIVE' : 'PAST' })));

            // Load financial records (giving/tithe) from DB
            const { data: frData } = await supabase.from('financial_records').select('*').eq('user_id', targetId).order('given_date', { ascending: false }).limit(12);
            setStewardship((frData || []).map((f: any) => ({ id: f.id, date: f.given_date, fund: f.record_type || 'Tithe', amount: f.amount || 0 })));

            // Load attendance records for the chart
            const { data: atData } = await supabase.from('attendance_records').select('attended').eq('user_id', targetId).order('event_date', { ascending: false }).limit(7);
            setAttendanceData((atData || []).map((a: any) => a.attended ? 100 : 20).reverse());

            // Load skills & talents from DB
            const { data: skData } = await supabase.from('member_skills').select('*').eq('user_id', targetId);
            setSkills(skData || []);

            // Load children (guardian_links) from DB
            const { data: kidData } = await supabase.from('guardian_links').select('*').eq('guardian_id', targetId);
            setChildren(kidData || []);

            // Load Stats
            let journalStats = { completed: 0, streak: 0 };
            if (!memberId || memberId === authUser?.id) {
                journalStats = await SoapJournal.getStats();
            } else {
                const { data: statsData } = await supabase.from('member_stats').select('*').eq('user_id', targetId).single();
                if (statsData) {
                    journalStats = { completed: statsData.completed_devotions || 0, streak: statsData.current_streak || 0 };
                }
            }

            setStats({
                completed: journalStats.completed,
                streak: journalStats.streak
            });

            if (isAdmin && targetId) {
                // To prevent 400 errors from strict RLS on client fetches, this query is currently disabled.
                // Replace with a Server Action proxy.
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
        if (!newHouseholdName || !profile) return;
        const newMember = { user_id: profile.id, full_name: newHouseholdName, relationship: newHouseholdRel };
        const { data, error } = await supabase.from('household_members').insert(newMember).select().single();
        if (error) { toast.error('Failed to add household member'); console.error(error); return; }
        setHousehold([...household, data || { id: Date.now(), ...newMember }]);
        AnalyticsService.logEvent(profile.id, 'household_updated', { name: newHouseholdName });
        setNewHouseholdName("");
        toast.success('Household member added!');
    }

    const handleAddPrayer = async () => {
        if (!newPrayer || !profile) return;
        const payload = { user_id: profile.id, request_text: newPrayer, category: 'General', urgency: 'normal', status: 'active' };
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

    const handleAddMinistry = async () => {
        if (!newMinistry || !profile) return;
        const payload = { user_id: profile.id, ministry_name: newMinistry, ministry_role: 'Volunteer', is_active: true };
        const { data, error } = await supabase.from('ministry_members').insert(payload).select().single();
        if (error) { toast.error('Failed to add ministry role'); console.error(error); return; }
        setMinistryRoles([...ministryRoles, { id: data?.id || Date.now(), role: newMinistry, status: 'ACTIVE' }]);
        AnalyticsService.logEvent(profile.id, 'ministry_role_updated', { ministry: newMinistry });
        setNewMinistry("");
        toast.success('Ministry role added!');
    }

    const handleAddSkill = async () => {
        if (!newSkillName || !profile) return;
        const payload = { user_id: profile.id, skill_name: newSkillName, skill_category: newSkillCategory, skill_level: newSkillLevel, years_experience: 0 };
        const { data, error } = await supabase.from('member_skills').insert(payload).select().single();
        if (error) { toast.error('Failed to add skill'); console.error(error); return; }
        setSkills([...skills, data || { id: Date.now(), ...payload }]);
        AnalyticsService.logEvent(profile.id, 'skill_added', { skill: newSkillName });
        setNewSkillName("");
        toast.success('Skill added!');
    }

    const handleRemoveSkill = async (skillId: string) => {
        const { error } = await supabase.from('member_skills').delete().eq('id', skillId);
        if (error) { toast.error('Failed to remove skill'); return; }
        setSkills(skills.filter(s => s.id !== skillId));
    }

    const handleAddChild = async () => {
        if (!newChildName || !profile) return;
        const payload = { guardian_id: profile.id, child_name: newChildName, child_birthdate: newChildBirthdate || null, medical_notes: newChildMedical || null, relationship: 'Parent' };
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
        const { error } = await supabase.from('guardian_links').delete().eq('id', childId);
        if (error) { toast.error('Failed to remove child'); return; }
        setChildren(children.filter(c => c.id !== childId));
    }

    async function handleSavePastoralNotes() {
        if (!profile || !isAdmin) return;
        try {
            setSavingNotes(true);
            const { error } = await supabase
                .from('pastoral_notes')
                .upsert({ 
                    member_user_id: profile.id, 
                    note: pastoralNotes, 
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
                                    <Card className="glass border-foreground/10 bg-foreground/5 rounded-3xl p-6 flex flex-col items-center text-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                        <div className="text-3xl font-black">74%</div>
                                        <div className="text-[10px] font-bold uppercase opacity-40">Target Complete</div>
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
                                                    <p className="text-[10px] opacity-40 leading-none">Accepted Christ at JKC Service</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-mono opacity-60">2026-03-01</p>
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
                                        <div className="flex gap-2 mb-4">
                                            <Input placeholder="Role (e.g. Greeter)" value={newMinistry} onChange={e => setNewMinistry(e.target.value)} className="glass border-foreground/10 rounded-2xl h-10" />
                                            <Button onClick={handleAddMinistry} size="sm" className="rounded-2xl bg-[var(--primary)] font-bold px-4 text-white"><Plus className="w-4 h-4" /></Button>
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
                                    <Button className="rounded-full bg-indigo-600 font-bold gap-2">
                                        <Plus className="w-4 h-4" /> GIVE NOW
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="glass border-foreground/10 bg-foreground/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Total Tithing 2026</div>
                                            <div className="text-xl font-black">¥450,000</div>
                                        </Card>
                                        <Card className="glass border-foreground/10 bg-foreground/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-black uppercase opacity-40">Building Fund</div>
                                            <div className="text-xl font-black">¥10,000</div>
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
                            Your Connection Card is an encrypted record used specifically for JKC spiritual oversight.
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
