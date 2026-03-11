"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ChevronLeft, Users, Plus, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const TEAM_ROLES = ['leader', 'assistant', 'volunteer', 'member'];

export default function TeamPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<any[]>([]);
    const [addEmail, setAddEmail] = useState('');
    const [addRole, setAddRole] = useState('volunteer');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        MinistryAuth.requireAccess(slug, 'leader').then(sess => {
            setSession(sess);
            loadTeam(sess.ministryId);
            setLoading(false);
        }).catch(console.error);
    }, [slug]);

    const loadTeam = async (ministryId: string) => {
        const { data } = await supabase
            .from('ministry_members')
            .select(`
                *,
                profiles:user_id(name, email)
            `)
            .eq('ministry_id', ministryId)
            .eq('is_active', true);
        setTeam(data || []);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addEmail || !session) return;
        setAdding(true);

        // Look up user by email
        const { data: profileData, error: lookupError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('email', addEmail)
            .single();

        if (lookupError || !profileData) {
            toast.error('No user found with that email address.');
            setAdding(false);
            return;
        }

        const { error } = await supabase.from('ministry_members').upsert({
            ministry_id: session.ministryId,
            ministry_name: session.ministryName,
            org_id: 'fa547adf-f820-412f-9458-d6bade11517d',
            user_id: profileData.id,
            ministry_role: addRole,
            is_active: true,
        }, { onConflict: 'user_id,ministry_id' });

        if (error) {
            toast.error('Failed to add: ' + error.message);
        } else {
            toast.success(`${profileData.name} added as ${addRole}!`);
            setAddEmail('');
            loadTeam(session.ministryId);
        }
        setAdding(false);
    };

    const updateRole = async (memberId: string, newRole: string) => {
        const { error } = await supabase
            .from('ministry_members')
            .update({ ministry_role: newRole })
            .eq('id', memberId);
        if (error) toast.error('Failed to update role');
        else { toast.success('Role updated!'); if (session) loadTeam(session.ministryId); }
    };

    const removeMember = async (memberId: string) => {
        const { error } = await supabase
            .from('ministry_members')
            .update({ is_active: false })
            .eq('id', memberId);
        if (error) toast.error('Failed to remove member');
        else { toast.success('Member removed.'); if (session) loadTeam(session.ministryId); }
    };

    if (loading || !session) {
        return <div className="flex items-center justify-center min-h-screen bg-[#080c14]"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href={`/ministry-dashboard/${slug}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{session.ministryName}</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white">Manage Team</span>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-black">{team.length} members</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Add Member */}
                <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400" /> Add Team Member
                    </h2>
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                        <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} required placeholder="member@email.com"
                            className="flex-1 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all" />
                        <select value={addRole} onChange={e => setAddRole(e.target.value)}
                            className="h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all">
                            {TEAM_ROLES.map(r => <option key={r} value={r} className="bg-[#0d1421] capitalize">{r}</option>)}
                        </select>
                        <button type="submit" disabled={adding}
                            className="h-11 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 whitespace-nowrap">
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                        </button>
                    </form>
                </div>

                {/* Team List */}
                <div className="space-y-3">
                    <h2 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Current Team ({team.length})</h2>
                    {team.length === 0 && (
                        <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-8 text-center text-white/30 text-sm">No team members yet. Add someone above.</div>
                    )}
                    {team.map(member => {
                        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                        return (
                            <div key={member.id} className="bg-[#0d1421] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-amber-400 font-black text-sm">{(profile?.name || 'M').charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{profile?.name || 'Unknown'}</p>
                                    <p className="text-white/40 text-xs truncate">{profile?.email || '—'}</p>
                                </div>
                                <select
                                    value={member.ministry_role}
                                    onChange={e => updateRole(member.id, e.target.value)}
                                    className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all"
                                >
                                    {TEAM_ROLES.map(r => <option key={r} value={r} className="bg-[#0d1421] capitalize">{r}</option>)}
                                </select>
                                {member.ministry_role !== 'leader' && (
                                    <button onClick={() => removeMember(member.id)}
                                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0">
                                        <Shield className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
