"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { useAdminCtx } from "../layout";
import { AdminAuth, ADMIN_ROLES, ROLE_HIERARCHY, AdminRole } from "@/lib/admin-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Users, Shield, Mail, Plus, Trash2, CheckCircle2, AlertCircle, Crown, User, Loader2, Copy, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { basePath as BP } from "@/lib/utils";
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
    const { role: myRole, userName, email: myEmail, orgId } = useAdminCtx() as any;
    const [team, setTeam] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
    const [inviting, setInviting] = useState(false);
    const [tab, setTab] = useState<'profile' | 'team' | 'invitations'>('profile');

    const isSuperAdmin = AdminAuth.can(myRole, 'owner');

    useEffect(() => {
        loadData();
    }, [orgId]);

    async function loadData() {
        setLoading(true);
        const [teamRes, invRes] = await Promise.all([
            supabase.from('org_members').select('*, profiles(name, email)').eq('org_id', orgId),
            supabase.from('org_members')
                .select('*, profiles(name, email), ministries(name)')
                .not('invitation_token', 'is', null)
                .eq('org_id', orgId)
        ]);
        setTeam(teamRes.data || []);
        setInvitations(invRes.data || []);
        setLoading(false);
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);

        try {
            const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteEmail, {
                data: { role: inviteRole, invited_by: userName }
            });

            if (error) throw error;

            if (data.user) {
                await supabaseAdmin.from('org_members').upsert({
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
        await supabaseAdmin.from('org_members').delete().eq('id', memberId);
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

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6 text-center md:text-left">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Settings & Team</h1>
                <p className="text-[10px] font-black text-white/30 mt-0.5 tracking-widest uppercase">Profile · Team management · Admin access control</p>
            </div>

            <div className="flex justify-center md:justify-start gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit mb-8">
                {(['profile', 'team', 'invitations'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-white/30 hover:text-white/60'}`}>
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
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md mx-auto md:mx-0">
                            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-violet-600/20">
                                        {userName?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-white tracking-tight">{userName}</p>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ROLE_COLORS[myRole] || 'bg-white/10 text-white/40'}`}>
                                            {myRole?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <div>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Email Address</p>
                                        <p className="font-bold text-white/80">{myEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Role Hierarchy</p>
                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-1">
                                            <div className="bg-violet-600 h-full rounded-full" style={{ width: `${ROLE_HIERARCHY[myRole as AdminRole] || 0}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => AdminAuth.logoutAdmin()} variant="outline" className="w-full h-14 border-red-500/20 text-red-500 font-black rounded-2xl hover:bg-red-500/10 uppercase tracking-widest">
                                    Sign Out Account
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'team' && (
                        <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{team.length} Staff Members</p>
                                {isSuperAdmin && (
                                    <Button onClick={() => setShowInvite(s => !s)} className="bg-violet-600 hover:bg-violet-500 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" /> Invite Admin
                                    </Button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showInvite && (
                                    <motion.form
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        onSubmit={handleInvite}
                                        className="bg-[#111] border border-violet-500/20 rounded-3xl p-6 mb-8 space-y-4 overflow-hidden"
                                    >
                                        <Input
                                            type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 font-bold"
                                            required
                                        />
                                        <div className="flex gap-4">
                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}
                                                className="flex-1 h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-white font-bold outline-none focus:ring-2 focus:ring-violet-500">
                                                {ADMIN_ROLES.map(r => <option key={r} value={r} className="bg-[#111] uppercase tracking-widest text-[10px]">{r.replace(/_/g, ' ')}</option>)}
                                            </select>
                                            <Button type="submit" disabled={inviting} className="h-14 px-8 bg-violet-600 font-black rounded-2xl uppercase tracking-widest">
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
                                        <div key={m.id} className="bg-[#111] border border-white/5 rounded-3xl p-6 relative group overflow-hidden">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-lg font-black text-violet-500">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-black truncate">{name}</p>
                                                    <p className={`text-[8px] font-black px-2 mt-1 py-0.5 rounded-lg uppercase tracking-widest inline-block ${ROLE_COLORS[m.role] || 'bg-white/10 text-white/40'}`}>
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
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{invitations.length} Pending Invitations</p>
                            </div>

                            {invitations.length === 0 ? (
                                <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                                        <Mail className="w-6 h-6 text-white/20" />
                                    </div>
                                    <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">No pending invitations found</p>
                                </div>
                            ) : (
                                <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                                    {invitations.map(inv => (
                                        <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-violet-500" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-black">{inv.profiles?.name || 'Assigned Leader'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black px-2 py-0.5 bg-violet-600 text-white rounded-lg uppercase tracking-widest">{inv.role?.replace(/_/g, ' ')}</span>
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{inv.ministries?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button onClick={() => copyLink(inv.invitation_token)} className="h-10 bg-white/5 text-white/60 hover:bg-white/10 font-bold rounded-xl text-[10px] tracking-widest px-4">
                                                    <Copy className="w-3.5 h-3.5 mr-2" /> COPY LINK
                                                </Button>
                                                <Button onClick={() => shareWhatsApp(inv)} className="h-10 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 font-bold rounded-xl text-[10px] tracking-widest px-4">
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
