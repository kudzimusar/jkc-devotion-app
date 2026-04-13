"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { usePastorCtx } from "../pastor-context";
import { AdminAuth, ADMIN_ROLES, ROLE_HIERARCHY, AdminRole } from "@/lib/admin-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Users, Shield, Mail, Plus, Trash2, CheckCircle2, AlertCircle, Crown, User, Loader2, Copy, Share2, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { basePath as BP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_ICONS: Record<string, any> = { super_admin: Crown, owner: Shield, shepherd: Shield, admin: User, ministry_lead: User };
const ROLE_COLORS: Record<string, string> = {
    super_admin: 'text-amber-400 bg-amber-500/20',
    owner: 'text-violet-400 bg-violet-500/20',
    shepherd: 'text-blue-400 bg-blue-500/20',
    admin: 'text-emerald-400 bg-emerald-500/20',
    ministry_lead: 'text-cyan-400 bg-cyan-500/20',
};

export default function SettingsPage() {
    const { role: myRole, userName, userId, orgId } = usePastorCtx() as any;
    const [team, setTeam] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
    const [inviting, setInviting] = useState(false);
    const [myRoles, setMyRoles] = useState<any[]>([]);
    const [tab, setTab] = useState<'profile' | 'team' | 'invitations'>('profile');
    const searchParams = useSearchParams();
    const mfaRequired = searchParams.get('mfa_required') === 'true';

    // MFA Enrollment State
    const [mfaEnrollment, setMfaEnrollment] = useState<any>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [isEnrollingMFA, setIsEnrollingMFA] = useState(false);
    const [isMFAVerified, setIsMFAVerified] = useState(false);

    const isSuperAdmin = AdminAuth.can(myRole, 'owner');

    useEffect(() => {
        loadData();
    }, [orgId]);

    async function loadData() {
        setLoading(true);
        const [teamRes, invRes, rolesRes] = await Promise.all([
            supabase.from('org_members').select('*, profiles(name, email, membership_status, growth_stage, created_at)').eq('org_id', orgId),
            supabase.from('org_members')
                .select('*, profiles(name, email), ministries:ministry_id(name)')
                .not('invitation_token', 'is', null)
                .eq('org_id', orgId),
            supabase.from('user_roles')
                .select('*, roles(*)')
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                .eq('org_id', orgId)
        ]);

        console.log("Team Data (Admin):", teamRes.data);
        console.log("Invitation Data (Admin):", invRes.data);
        console.log("My Roles:", rolesRes.data);

        setTeam(teamRes.data || []);
        setInvitations(invRes.data || []);
        setMyRoles(rolesRes.data || []);
        
        // Check MFA Status
        const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mfaData?.currentLevel === 'aal2') {
            setIsMFAVerified(true);
        }

        setLoading(false);
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);

        try {
            const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
                data: { role: inviteRole, invited_by: userName }
            });

            if (error) {
                // Handle existing user promotion
                if (error.message.includes('already been registered')) {
                    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', inviteEmail).single();
                    if (existingProfile) {
                        const token = crypto.randomUUID();
                        await supabase.from('org_members').upsert({
                            user_id: existingProfile.id,
                            role: inviteRole,
                            org_id: orgId,
                            invitation_token: token,
                            invitation_status: 'pending'
                        });
                        toast.success(`${inviteEmail} promoted! Invitation link generated.`);
                        setInviteEmail("");
                        setShowInvite(false);
                        loadData();
                        return;
                    }
                }
                throw error;
            }

            if (data.user) {
                await supabase.from('org_members').upsert({
                    user_id: data.user.id,
                    role: inviteRole,
                    org_id: orgId,
                });
            }

            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail("");
            setShowInvite(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const handleRevoke = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from admin access?`)) return;
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

    const startMFAEnrollment = async () => {
        setIsEnrollingMFA(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'Church OS',
                friendlyName: userName
            });

            if (error) throw error;
            setMfaEnrollment(data);
            toast.success("Ready to scan!");
        } catch (err: any) {
            toast.error(err.message || "Failed to start enrollment");
        } finally {
            setIsEnrollingMFA(false);
        }
    };

    const verifyMFA = async () => {
        if (mfaCode.length !== 6) return;
        setIsEnrollingMFA(true);
        try {
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaEnrollment.id
            });

            if (challengeError) throw challengeError;

            const { data: verify, error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaEnrollment.id,
                challengeId: challenge.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;

            setIsMFAVerified(true);
            toast.success("MFA Successfully Enrolled!");
            
            // Refresh or Redirect based on role
            setTimeout(() => {
                const target = myRole === 'pastor' ? '/pastor-hq/' : '/shepherd/dashboard/';
                window.location.href = `${BP}${target}`;
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || "Verification failed");
        } finally {
            setIsEnrollingMFA(false);
        }
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6 text-center md:text-left">
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Settings & Team</h1>
                <p className="text-[10px] font-black text-muted-foreground/40 mt-0.5 tracking-widest uppercase">Profile · Team management · Admin access control</p>
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
                    {tab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl">
                            {/* MFA Alert Block */}
                            {mfaRequired && !isMFAVerified && (
                                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-6 flex flex-col items-center justify-between gap-6 shadow-xl shadow-primary/5">
                                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Multi-Factor Authentication Required</h3>
                                                <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium leading-relaxed">
                                                    Your role requires an extra layer of security. Please enroll in MFA to access Pastor HQ.
                                                </p>
                                            </div>
                                        </div>

                                        {!mfaEnrollment ? (
                                            <Button 
                                                onClick={startMFAEnrollment} 
                                                disabled={isEnrollingMFA}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-xl shrink-0"
                                            >
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
                                                        <Input 
                                                            value={mfaCode} 
                                                            onChange={e => setMfaCode(e.target.value)}
                                                            placeholder="000 000"
                                                            maxLength={6}
                                                            className="h-12 bg-muted/50 border-border rounded-xl px-4 font-black text-center tracking-[0.5em] text-lg"
                                                        />
                                                        <Button 
                                                            onClick={verifyMFA} 
                                                            disabled={isEnrollingMFA || mfaCode.length !== 6}
                                                            className="h-12 px-6 bg-primary font-black rounded-xl uppercase tracking-widest text-[10px]"
                                                        >
                                                            {isEnrollingMFA ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                                        </Button>
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground/40 leading-tight">
                                                        Scan with Google Authenticator or Authy, then enter the code above.
                                                    </p>
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
                                        <p className="text-[10px] text-emerald-600/60 mt-0.5 font-medium leading-relaxed">
                                            MFA enrollment complete. Redirecting you to Mission Control...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 1. Identity Overview */}
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-primary/20 border-4 border-white/5">
                                        {userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="text-center md:text-left space-y-2">
                                        <h2 className="text-3xl font-black text-foreground tracking-tight">{userName}</h2>
                                        <p className="text-muted-foreground/60 font-medium">{team.find(m => m.user_id === userId)?.profiles?.email || 'Admin User'}</p>                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                {team.find(m => m.user_id === userId)?.profiles?.membership_status?.toUpperCase() || 'VISITOR'}
                                            </Badge>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-500">
                                                {team.find(m => m.user_id === userId)?.profiles?.growth_stage?.toUpperCase() || 'VISITOR'}
                                            </Badge>
                                             <Badge className="bg-muted text-muted-foreground/40 border-border px-3 py-1 font-black uppercase tracking-widest text-[9px]">
                                                JOINED {new Date(team.find(m => m.user_id === userId)?.profiles?.created_at).toLocaleDateString()}
                                            </Badge>
                                            {isMFAVerified && (
                                                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 px-3 py-1 font-black uppercase tracking-widest text-[9px]">
                                                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Role Hierarchy & 3. Role Description */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Active Permissions Matrix</p>
                                        <div className="space-y-3">
                                            {myRoles.length === 0 ? (
                                                <div className="p-4 bg-muted/30 rounded-2xl border border-border text-muted-foreground/30 text-xs text-center italic">
                                                    No administrative roles detected
                                                </div>
                                            ) : (
                                                myRoles.map(ur => (
                                                    <div key={ur.id} className="p-5 bg-muted/30 rounded-3xl border border-border transition-all hover:bg-muted/50 group">
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
                                            {/* 4. Permissions Dashboard */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Capabilities Index</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'System Governance', key: 'all' },
                                                        { label: 'Member Data Access', key: 'user_view' },
                                                        { label: 'Role Assignment', key: 'user_manage' },
                                                        { label: 'Financial Auditing', key: 'financials' }
                                                    ].map(p => {
                                                        const hasCap = myRoles.some(r => r.roles?.permissions?.includes('all') || r.roles?.permissions?.includes(p.key));
                                                        return (
                                                            <div key={p.key} className="flex items-center justify-between p-3 px-4 rounded-xl bg-muted/50 border border-border">
                                                                <span className="text-[10px] font-bold text-muted-foreground/60">{p.label}</span>
                                                                {hasCap ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/10" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* 5. Authority Level Indicator */}
                                            <div className="space-y-3 pt-2">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Authority Level</p>
                                                    <p className="text-sm font-black text-primary">{ROLE_HIERARCHY[myRole as AdminRole] || 0}% Clearance</p>
                                                </div>
                                                <div className="w-full bg-muted/50 h-3 rounded-full overflow-hidden border border-border p-0.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${ROLE_HIERARCHY[myRole as AdminRole] || 0}%` }}
                                                        className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full shadow-lg shadow-primary/50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={() => AdminAuth.logoutAdmin()} variant="outline" className="w-full h-16 border-red-500/20 text-red-500 font-black rounded-[1.25rem] hover:bg-red-500/10 uppercase tracking-[0.2em] text-xs transition-all">
                                            Sign Out of Pastor HQ
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Access Limitations & 7. Activity Log Placeholder */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Operational Constraints</p>
                                    <ul className="space-y-3">
                                        {[
                                            'Cannot bypass dual-authorization for large financial transfers',
                                            'Cannot modify system audit logs (Hard-coded immutability)',
                                            'Cannot override Super Admin global configurations'
                                        ].map((text, i) => (
                                            <li key={i} className="flex gap-3 text-[10px] text-muted-foreground/60 leading-relaxed">
                                                <Shield className="w-4 h-4 text-primary shrink-0" />
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Recent Activity Chain</p>
                                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/20 text-[10px] font-bold uppercase tracking-widest">
                                        No recent actions logged
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'team' && (
                        <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{team.length} Staff Members</p>
                                {isSuperAdmin && (
                                    <Button onClick={() => setShowInvite(s => !s)} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" /> Invite Admin
                                    </Button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showInvite && (
                                    <motion.form
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        onSubmit={handleInvite}
                                        className="bg-card border border-primary/20 rounded-3xl p-6 mb-8 space-y-4 overflow-hidden shadow-xl shadow-primary/5"
                                    >
                                        <Input
                                            type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="h-14 bg-muted/50 border-border rounded-2xl px-6 font-bold"
                                            required
                                        />
                                        <div className="flex gap-4">
                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}
                                                className="flex-1 h-14 bg-muted/50 border-border rounded-2xl px-6 text-foreground font-bold outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all">
                                                {ADMIN_ROLES.map(r => <option key={r} value={r} className="bg-card uppercase tracking-widest text-[10px]">{r.replace(/_/g, ' ')}</option>)}
                                            </select>
                                            <Button type="submit" disabled={inviting} className="h-14 px-8 bg-primary font-black rounded-2xl uppercase tracking-widest text-primary-foreground">
                                                {inviting ? "SENDING..." : "SEND INVITE"}
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {team.map(m => {
                                    const name = m.profiles?.name || 'Unknown User';
                                    const canRevoke = isSuperAdmin && m.role !== 'super_admin';
                                    return (
                                        <div key={m.id} className="bg-card border border-border rounded-3xl p-6 relative group overflow-hidden shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary border border-primary/20 shadow-sm">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-foreground font-black truncate">{name}</p>
                                                    <p className={`text-[8px] font-black px-2 mt-1 py-0.5 rounded-lg uppercase tracking-widest inline-block ${ROLE_COLORS[m.role] || 'bg-muted text-muted-foreground/40'}`}>
                                                        {m.role?.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            {canRevoke && (
                                                <button onClick={() => handleRevoke(m.id, name)} className="absolute top-4 right-4 text-red-500/20 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {tab === 'invitations' && (
                        <motion.div key="invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{invitations.length} Pending Invitations</p>
                            </div>

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
                                                <Button onClick={() => copyLink(inv.invitation_token)} className="h-10 bg-muted/50 text-muted-foreground/60 border-border hover:bg-muted font-bold rounded-xl text-[10px] tracking-widest px-4 shadow-sm transition-all border">
                                                    <Copy className="w-3.5 h-3.5 mr-2" /> COPY LINK
                                                </Button>
                                                <Button onClick={() => shareWhatsApp(inv)} className="h-10 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20 font-bold rounded-xl text-[10px] tracking-widest px-4 shadow-sm transition-all border">
                                                    <Share2 className="w-3.5 h-3.5 mr-2" /> WHATSAPP
                                                </Button>
                                                <button onClick={() => supabase.from('org_members').delete().eq('id', inv.id).then(() => loadData())} className="p-2 text-white/10 hover:text-red-500 transition-colors">
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
