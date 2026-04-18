"use client";
/**
 * AdminSettingsPanel — shared settings component for Pastor HQ and Mission Control.
 * Accepts a `surface` prop to control which sections are visible.
 * All data logic, permissions logic, and profile rendering live here.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminAuth, ROLE_HIERARCHY, ADMIN_ROLES, AdminRole } from "@/lib/admin-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Mail, Plus, Trash2, CheckCircle2, AlertCircle,
    Crown, User, Loader2, Copy, Share2, ShieldCheck, BanIcon
} from "lucide-react";
import { toast } from "sonner";
import { basePath as BP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ────────────────────────────────────────────────────────────────────

export type SettingsSurface = 'mission-control' | 'pastor-hq';

interface AdminSettingsPanelProps {
    surface: SettingsSurface;
    role: string;
    userName: string;
    userId: string;
    orgId: string;
}

// ── Role metadata ─────────────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<string, string> = {
    super_admin:     'Full platform authority. Manages all tenants and global configurations.',
    pastor:          'Lead pastor with full visibility across all church operations and spiritual data.',
    owner:           'Church owner with full organisational authority and unrestricted dashboard access.',
    admin:           'Administrative access to church operations and team management.',
    shepherd:        'Pastoral oversight. Access to member care, discipleship, and team management.',
    elder:           'Senior advisory role. Provides governance and spiritual counsel.',
    deacon:          'Service-oriented leadership. Assists with ministry operations.',
    ministry_lead:   'Ministry-level leadership for a specific department.',
    ministry_leader: 'Ministry-level leadership for a specific department.',
    member:          'Standard member access to personal profile and spiritual journey.',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin:     ['all'],
    pastor:          ['all'],
    owner:           ['all'],
    admin:           ['user_view', 'user_manage'],
    shepherd:        ['user_view', 'user_manage'],
    elder:           ['user_view'],
    deacon:          ['user_view'],
    ministry_lead:   ['user_view'],
    ministry_leader: ['user_view'],
    member:          [],
};

const ROLE_COLORS: Record<string, string> = {
    super_admin:     'text-amber-400 bg-amber-500/20',
    pastor:          'text-violet-400 bg-violet-500/20',
    owner:           'text-indigo-400 bg-indigo-500/20',
    shepherd:        'text-blue-400 bg-blue-500/20',
    admin:           'text-emerald-400 bg-emerald-500/20',
    ministry_lead:   'text-cyan-400 bg-cyan-500/20',
    ministry_leader: 'text-cyan-400 bg-cyan-500/20',
};

// Roles that get full capabilities without needing a user_roles record
const HIGH_AUTH = ['pastor', 'owner', 'super_admin'];

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminSettingsPanel({ surface, role: myRole, userName, userId, orgId }: AdminSettingsPanelProps) {
    const searchParams = useSearchParams();
    const mfaRequired = searchParams.get('mfa_required') === 'true';

    const [tab, setTab]               = useState<'profile' | 'team' | 'invitations'>('profile');
    const [loading, setLoading]       = useState(true);
    const [team, setTeam]             = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [myRoles, setMyRoles]       = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
    const [inviting, setInviting]     = useState(false);

    const [mfaEnrollment, setMfaEnrollment] = useState<any>(null);
    const [mfaCode, setMfaCode]       = useState("");
    const [isEnrollingMFA, setIsEnrollingMFA] = useState(false);
    const [isMFAVerified, setIsMFAVerified] = useState(false);

    // Fix 7 — correctly split guards
    const canManageTeam = AdminAuth.can(myRole, 'pastor');   // pastor, owner, super_admin
    const isSuperAdmin  = myRole === 'super_admin';           // exclusive corporate-level only

    useEffect(() => { if (orgId) loadData(); }, [orgId]);

    async function loadData() {
        setLoading(true);
        const currentUser = (await supabase.auth.getUser()).data.user;

        const [teamRes, invRes, myMemberRes, activityRes, mfaRes] = await Promise.all([
            supabase.from('org_members')
                .select('*, profiles(name, email, membership_status, growth_stage, created_at)')
                .eq('org_id', orgId),
            supabase.from('org_members')
                .select('*, profiles(name, email), ministries:ministry_id(name)')
                .not('invitation_token', 'is', null)
                .eq('org_id', orgId),
            // Fix 2 — read from org_members, not user_roles
            supabase.from('org_members')
                .select('id, role')
                .eq('user_id', currentUser?.id)
                .eq('org_id', orgId),
            // Fix 5 — live activity feed from admin_audit_logs
            supabase.from('admin_audit_logs')
                .select('id, activity_type, metadata, created_at, gateway')
                .eq('user_id', currentUser?.id)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        ]);

        // Fix 2 — shape org_members role into display format
        const shapedRoles = (myMemberRes.data || []).map(m => ({
            id: m.id,
            role_name: m.role,
            roles: {
                level:       ROLE_HIERARCHY[m.role as AdminRole] ?? 0,
                description: ROLE_DESCRIPTIONS[m.role] ?? `${m.role.replace(/_/g, ' ')} access.`,
                permissions: ROLE_PERMISSIONS[m.role] ?? [],
            }
        }));

        setTeam(teamRes.data || []);
        setInvitations(invRes.data || []);
        setMyRoles(shapedRoles);
        setRecentActivity(activityRes.data || []);

        if (mfaRes.data?.currentLevel === 'aal2') setIsMFAVerified(true);
        setLoading(false);
    }

    // ── Team actions ───────────────────────────────────────────────────────────

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
                data: { role: inviteRole, invited_by: userName }
            });
            if (error) {
                if (error.message.includes('already been registered')) {
                    const { data: existing } = await supabase.from('profiles').select('id').eq('email', inviteEmail).single();
                    if (existing) {
                        const token = crypto.randomUUID();
                        await supabase.from('org_members').upsert({
                            user_id: existing.id, role: inviteRole, org_id: orgId,
                            invitation_token: token, invitation_status: 'pending'
                        });
                        toast.success(`${inviteEmail} promoted! Invitation link generated.`);
                        setInviteEmail(""); setShowInvite(false); loadData(); return;
                    }
                }
                throw error;
            }
            if (data.user) {
                await supabase.from('org_members').upsert({ user_id: data.user.id, role: inviteRole, org_id: orgId });
            }
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail(""); setShowInvite(false); loadData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    // Fix 6 — suspend vs revoke
    const handleSuspend = async (memberId: string, memberName: string) => {
        if (!confirm(`Suspend ${memberName}? Their record is preserved but they cannot log in.`)) return;
        await supabase.from('org_members').update({ invitation_status: 'suspended' }).eq('id', memberId);
        loadData();
        toast.success(`${memberName} suspended`);
    };

    const handleRevoke = async (memberId: string, memberName: string) => {
        if (!confirm(`Permanently remove ${memberName} from admin access? This cannot be undone.`)) return;
        await supabase.from('org_members').delete().eq('id', memberId);
        loadData();
        toast.success(`${memberName} access revoked`);
    };

    const copyLink = (token: string) => {
        const url = `${window.location.origin}${BP}/shepherd/onboarding?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied!");
    };
    const shareWhatsApp = (inv: any) => {
        const url = `${window.location.origin}${BP}/shepherd/onboarding?token=${inv.invitation_token}`;
        const text = `Hi ${inv.profiles?.name}, join the Church OS team as a ${inv.role}: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // ── MFA enrollment ─────────────────────────────────────────────────────────

    const startMFAEnrollment = async () => {
        setIsEnrollingMFA(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Church OS', friendlyName: userName });
            if (error) throw error;
            setMfaEnrollment(data);
            toast.success("Ready to scan!");
        } catch (err: any) {
            toast.error(err.message || "Failed to start enrollment");
        } finally { setIsEnrollingMFA(false); }
    };

    const verifyMFA = async () => {
        if (mfaCode.length !== 6) return;
        setIsEnrollingMFA(true);
        try {
            const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollment.id });
            if (cErr) throw cErr;
            const { error: vErr } = await supabase.auth.mfa.verify({ factorId: mfaEnrollment.id, challengeId: challenge.id, code: mfaCode });
            if (vErr) throw vErr;
            setIsMFAVerified(true);
            toast.success("MFA Successfully Enrolled!");
            setTimeout(() => {
                const target = surface === 'pastor-hq' ? '/pastor-hq/' : '/shepherd/dashboard/';
                window.location.href = `${BP}${target}`;
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || "Verification failed");
        } finally { setIsEnrollingMFA(false); }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    const myProfile = team.find(m => m.user_id === userId);

    // Fix 4 — deduplicate badges; for shepherd+ replace growth_stage with role badge
    const profileBadges = (() => {
        const badges: { label: string; className: string }[] = [];
        const isHighRole = ROLE_HIERARCHY[myRole as AdminRole] >= ROLE_HIERARCHY['shepherd'];

        const statusVal = myProfile?.profiles?.membership_status?.toUpperCase();
        if (statusVal) badges.push({ label: statusVal, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' });

        if (isHighRole) {
            // Show actual role name instead of growth_stage discipleship metric
            badges.push({ label: myRole.replace(/_/g, ' ').toUpperCase(), className: ROLE_COLORS[myRole] || 'bg-muted text-muted-foreground/40' });
        } else {
            const stageVal = myProfile?.profiles?.growth_stage?.toUpperCase();
            if (stageVal && stageVal !== statusVal) {
                badges.push({ label: stageVal, className: 'bg-primary/10 text-primary border-primary/20' });
            }
        }

        if (myProfile?.profiles?.created_at) {
            badges.push({ label: `JOINED ${new Date(myProfile.profiles.created_at).toLocaleDateString()}`, className: 'bg-muted text-muted-foreground/40 border-border' });
        }
        if (isMFAVerified) {
            badges.push({ label: 'VERIFIED', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' });
        }
        return badges;
    })();

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6 text-center md:text-left">
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Settings & Team</h1>
                <p className="text-[10px] font-black text-muted-foreground/40 mt-0.5 tracking-widest uppercase">
                    Profile · Team Management · Admin Access Control
                </p>
            </div>

            <div className="flex justify-center md:justify-start gap-1 p-1 bg-muted/50 rounded-2xl border border-border w-fit mb-8">
                {(['profile', 'team', 'invitations'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            ) : (
                <AnimatePresence mode="wait">

                    {/* ── PROFILE TAB ─────────────────────────────────────────────── */}
                    {tab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl">

                            {/* Fix 9 — MFA block: exempt high-authority roles */}
                            {mfaRequired && !isMFAVerified && !HIGH_AUTH.includes(myRole) && (
                                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-6 flex flex-col items-center justify-between gap-6 shadow-xl shadow-primary/5">
                                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Multi-Factor Authentication Required</h3>
                                                <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium leading-relaxed">
                                                    Your role requires an extra layer of security to access {surface === 'pastor-hq' ? 'Pastor HQ' : 'Mission Control'}.
                                                </p>
                                            </div>
                                        </div>
                                        {!mfaEnrollment ? (
                                            <Button onClick={startMFAEnrollment} disabled={isEnrollingMFA}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-xl shrink-0">
                                                {isEnrollingMFA ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Enroll Now
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col md:flex-row items-center gap-6 bg-card/50 p-6 rounded-2xl border border-border w-full md:w-auto animate-in zoom-in-95 duration-300">
                                                <div className="bg-white p-2 rounded-xl shadow-inner shrink-0 border-4 border-primary/20">
                                                    <img src={mfaEnrollment.totp.qr_code} alt="QR Code" className="w-32 h-32" />
                                                </div>
                                                <div className="space-y-4 flex-1 min-w-[200px]">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Enter 6-Digit Code</p>
                                                    <div className="flex gap-2">
                                                        <Input value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                                                            placeholder="000 000" maxLength={6}
                                                            className="h-12 bg-muted/50 border-border rounded-xl px-4 font-black text-center tracking-[0.5em] text-lg" />
                                                        <Button onClick={verifyMFA} disabled={isEnrollingMFA || mfaCode.length !== 6}
                                                            className="h-12 px-6 bg-primary font-black rounded-xl uppercase tracking-widest text-[10px]">
                                                            {isEnrollingMFA ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                                        </Button>
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground/40 leading-tight">Scan with Google Authenticator or Authy, then enter the code above.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isMFAVerified && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-6 shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top-4 duration-500">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Account Secured</h3>
                                        <p className="text-[10px] text-emerald-600/60 mt-0.5 font-medium">MFA enrollment complete. Redirecting...</p>
                                    </div>
                                </div>
                            )}

                            {/* Identity Overview */}
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-primary/20 border-4 border-white/5">
                                        {userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="text-center md:text-left space-y-2">
                                        <h2 className="text-3xl font-black text-foreground tracking-tight">{userName}</h2>
                                        <p className="text-muted-foreground/60 font-medium">{myProfile?.profiles?.email || 'Admin User'}</p>
                                        {/* Fix 4 — deduplicated, role-aware badges */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {profileBadges.map((b, i) => (
                                                <Badge key={i} className={`px-3 py-1 font-black uppercase tracking-widest text-[9px] border ${b.className}`}>
                                                    {b.label === 'VERIFIED' && <ShieldCheck className="w-3 h-3 mr-1" />}
                                                    {b.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Fix 2+3 — Active Permissions Matrix */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Active Permissions Matrix</p>
                                        <div className="space-y-3">
                                            {myRoles.length === 0 ? (
                                                <div className="p-4 bg-muted/30 rounded-2xl border border-border text-muted-foreground/30 text-xs text-center italic">
                                                    No administrative roles detected
                                                </div>
                                            ) : (
                                                myRoles.map(ur => (
                                                    <div key={ur.id} className="p-5 bg-muted/30 rounded-3xl border border-border transition-all hover:bg-muted/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-black text-foreground uppercase tracking-wider text-xs">{ur.role_name.replace(/_/g, ' ')}</p>
                                                            <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">LVL {ur.roles?.level}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">{ur.roles?.description}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-muted/30 p-6 rounded-3xl border border-border space-y-6">
                                            {/* Fix 3 — Capabilities Index with role-based override */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Capabilities Index</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'System Governance',  key: 'all' },
                                                        { label: 'Member Data Access', key: 'user_view' },
                                                        { label: 'Role Assignment',     key: 'user_manage' },
                                                        { label: 'Financial Auditing',  key: 'financials' },
                                                    ].map(p => {
                                                        // High-authority roles get all capabilities; others rely on role permissions
                                                        const hasCap =
                                                            HIGH_AUTH.includes(myRole) ||
                                                            myRoles.some(r =>
                                                                r.roles?.permissions?.includes('all') ||
                                                                r.roles?.permissions?.includes(p.key)
                                                            );
                                                        return (
                                                            <div key={p.key} className="flex items-center justify-between p-3 px-4 rounded-xl bg-muted/50 border border-border">
                                                                <span className="text-[10px] font-bold text-muted-foreground/60">{p.label}</span>
                                                                {hasCap
                                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                                    : <AlertCircle  className="w-3.5 h-3.5 text-muted-foreground/10" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Authority Level */}
                                            <div className="space-y-3 pt-2">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Authority Level</p>
                                                    <p className="text-sm font-black text-primary">{ROLE_HIERARCHY[myRole as AdminRole] ?? 0}% Clearance</p>
                                                </div>
                                                <div className="w-full bg-muted/50 h-3 rounded-full overflow-hidden border border-border p-0.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${ROLE_HIERARCHY[myRole as AdminRole] ?? 0}%` }}
                                                        className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full shadow-lg shadow-primary/50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Email Accounts link — Part G */}
                                        <a
                                            href={surface === 'pastor-hq'
                                                ? '/pastor-hq/settings/email-accounts'
                                                : '/shepherd/dashboard/settings/email-accounts'}
                                            className="flex items-center justify-between w-full px-5 py-4 rounded-[1.25rem] border border-border bg-muted/30 hover:bg-muted/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                                    <Mail className="w-4 h-4 text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-foreground uppercase tracking-wider">Email Accounts</p>
                                                    <p className="text-[10px] text-muted-foreground">Connect Gmail, Outlook, IMAP</p>
                                                </div>
                                            </div>
                                            <span className="text-muted-foreground/30 group-hover:text-muted-foreground text-sm transition-colors">→</span>
                                        </a>

                                        <Button onClick={() => AdminAuth.logoutAdmin()} variant="outline"
                                            className="w-full h-16 border-red-500/20 text-red-500 font-black rounded-[1.25rem] hover:bg-red-500/10 uppercase tracking-[0.2em] text-xs transition-all">
                                            Sign Out of {surface === 'pastor-hq' ? 'Pastor HQ' : 'Mission Control'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Constraints + Fix 5 — Live Activity Feed */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Operational Constraints</p>
                                    <ul className="space-y-3">
                                        {[
                                            'Cannot bypass dual-authorization for large financial transfers',
                                            'Cannot modify system audit logs (Hard-coded immutability)',
                                            'Cannot override Super Admin global configurations',
                                        ].map((text, i) => (
                                            <li key={i} className="flex gap-3 text-[10px] text-muted-foreground/60 leading-relaxed">
                                                <Shield className="w-4 h-4 text-primary shrink-0" />
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Fix 5 — Live recent activity */}
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Recent Activity Chain</p>
                                    {recentActivity.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/20 text-[10px] font-bold uppercase tracking-widest">
                                            No recent actions logged
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {recentActivity.map(a => (
                                                <li key={a.id} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">
                                                            {(a.activity_type ?? 'action').replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/40 font-medium">
                                                            {new Date(a.created_at).toLocaleString()} {a.gateway ? `· ${a.gateway}` : ''}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── TEAM TAB ─────────────────────────────────────────────────── */}
                    {tab === 'team' && (
                        <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{team.length} Staff Members</p>
                                {/* Fix 7 — use canManageTeam for invite button */}
                                {canManageTeam && (
                                    <Button onClick={() => setShowInvite(s => !s)}
                                        className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" /> Invite Admin
                                    </Button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showInvite && (
                                    <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        onSubmit={handleInvite}
                                        className="bg-card border border-primary/20 rounded-3xl p-6 mb-8 space-y-4 overflow-hidden shadow-xl shadow-primary/5">
                                        <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="h-14 bg-muted/50 border-border rounded-2xl px-6 font-bold" required />
                                        <div className="flex gap-4">
                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}
                                                className="flex-1 h-14 bg-muted/50 border-border rounded-2xl px-6 text-foreground font-bold outline-none focus:ring-2 focus:ring-primary transition-all">
                                                {ADMIN_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                            </select>
                                            <Button type="submit" disabled={inviting}
                                                className="h-14 px-8 bg-primary font-black rounded-2xl uppercase tracking-widest text-primary-foreground">
                                                {inviting ? "SENDING..." : "SEND INVITE"}
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Fix 6 — three states: Active, Suspended, Revoked */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {team.map(m => {
                                    const name   = m.profiles?.name || 'Unknown User';
                                    const status: 'active' | 'suspended' = m.invitation_status === 'suspended' ? 'suspended' : 'active';
                                    const canAct = canManageTeam && m.role !== 'super_admin';
                                    return (
                                        <div key={m.id} className={`bg-card border rounded-3xl p-6 relative group overflow-hidden shadow-sm transition-all ${status === 'suspended' ? 'border-amber-500/30 opacity-60' : 'border-border'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary border border-primary/20 shadow-sm">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-foreground font-black truncate">{name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest inline-block ${ROLE_COLORS[m.role] || 'bg-muted text-muted-foreground/40'}`}>
                                                            {m.role?.replace(/_/g, ' ')}
                                                        </span>
                                                        {status === 'suspended' && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest bg-amber-500/20 text-amber-500">
                                                                Suspended
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {canAct && (
                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {status === 'active' && (
                                                        <button onClick={() => handleSuspend(m.id, name)}
                                                            title="Suspend"
                                                            className="p-2 text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors">
                                                            <BanIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleRevoke(m.id, name)}
                                                        title="Revoke permanently"
                                                        className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ── INVITATIONS TAB ──────────────────────────────────────────── */}
                    {tab === 'invitations' && (
                        <motion.div key="invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{invitations.length} Pending Invitations</p>
                            {invitations.length === 0 ? (
                                <div className="bg-card border border-border rounded-[2.5rem] p-20 text-center space-y-4 shadow-sm">
                                    <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto border border-border shadow-sm">
                                        <Mail className="w-6 h-6 text-muted-foreground/20" />
                                    </div>
                                    <p className="text-muted-foreground/40 font-black uppercase text-[10px] tracking-widest">No pending invitations found</p>
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border shadow-sm">
                                    {invitations.map(inv => (
                                        <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                                    <Mail className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-foreground font-black">{inv.profiles?.name || 'Assigned Leader'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black px-2 py-0.5 bg-primary text-primary-foreground rounded-lg uppercase tracking-widest">{inv.role?.replace(/_/g, ' ')}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{inv.ministries?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button onClick={() => copyLink(inv.invitation_token)}
                                                    className="h-10 bg-muted/50 text-muted-foreground/60 border-border hover:bg-muted font-bold rounded-xl text-[10px] tracking-widest px-4 shadow-sm transition-all border">
                                                    <Copy className="w-3.5 h-3.5 mr-2" /> COPY LINK
                                                </Button>
                                                <Button onClick={() => shareWhatsApp(inv)}
                                                    className="h-10 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20 font-bold rounded-xl text-[10px] tracking-widest px-4 shadow-sm transition-all border">
                                                    <Share2 className="w-3.5 h-3.5 mr-2" /> WHATSAPP
                                                </Button>
                                                <button onClick={() => supabase.from('org_members').delete().eq('id', inv.id).then(() => loadData())}
                                                    className="p-2 text-white/10 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            )}
        </div>
    );
}
