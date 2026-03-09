"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    UserPlus, Mail, Shield, CheckCircle, Loader2, Search,
    Copy, Share2, ExternalLink, XCircle, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminCtx } from "@/app/shepherd/dashboard/layout";

export function MinistryOnboarding() {
    const { orgId } = useAdminCtx();
    const [searchQuery, setSearchQuery] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [ministries, setMinistries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState("ministry_leader");
    const [selectedMinistryId, setSelectedMinistryId] = useState("");
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadMinistries();
    }, [orgId]);

    async function loadMinistries() {
        let query = supabase.from('ministries').select('*').order('name');
        if (orgId) {
            query = query.eq('org_id', orgId);
        }
        const { data } = await query;
        setMinistries(data || []);
        if (data && data.length > 0) setSelectedMinistryId(data[0].id);
    }

    async function handleSearch() {
        if (!searchQuery) return;
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, name, email')
            .ilike('name', `%${searchQuery}%`)
            .limit(5);
        setMembers(data || []);
        setLoading(false);
    }

    async function handleAssign() {
        if (!selectedMember || !selectedMinistryId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            const orgId = profile?.org_id;

            const { data: token, error } = await supabase.rpc('invite_ministry_leader', {
                p_user_id: selectedMember.id,
                p_org_id: orgId,
                p_ministry_id: selectedMinistryId,
                p_role: selectedRole
            });

            if (error) throw error;

            setGeneratedToken(token);
            setShowSuccess(true);
            toast.success(`Invitation generated for ${selectedMember.name}!`);
        } catch (e: any) {
            toast.error(e.message || "Failed to assign role");
        } finally {
            setLoading(false);
        }
    }

    const inviteLink = generatedToken ? `${window.location.origin}/shepherd/onboarding?token=${generatedToken}` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast.success("Invitation link copied!");
    };

    const shareInvite = () => {
        const text = `Hi ${selectedMember?.name}, you've been appointed as a ${selectedRole.replace('_', ' ')} for ${ministries.find(m => m.id === selectedMinistryId)?.name}. Join the Church OS here: ${inviteLink}`;
        if (navigator.share) {
            navigator.share({ title: 'Church OS Invitation', text, url: inviteLink });
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const reset = () => {
        setShowSuccess(false);
        setGeneratedToken(null);
        setSelectedMember(null);
        setSearchQuery("");
        setMembers([]);
    };

    return (
        <Card className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative transition-colors">
            <CardHeader className="p-0 mb-8">
                <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-primary" />
                    Ministry Onboarding
                </CardTitle>
                <p className="text-muted-foreground text-xs font-bold tracking-widest mt-1 uppercase">Assign leadership roles to church members</p>
            </CardHeader>

            <CardContent className="p-0">
                <AnimatePresence mode="wait">
                    {!showSuccess ? (
                        <motion.div
                            key="onboarding-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <div className="relative">
                                    <Input
                                        placeholder="Search member by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="bg-muted border-border h-16 rounded-2xl px-12 text-foreground font-bold shadow-inner"
                                    />
                                    <Search className="absolute left-4 top-5 w-6 h-6 text-muted-foreground/30" />
                                    <Button
                                        onClick={handleSearch}
                                        className="absolute right-2 top-2 h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                                    >
                                        SEARCH
                                    </Button>
                                </div>

                                {members.length > 0 && (
                                    <div className="bg-muted rounded-2xl overflow-hidden border border-border">
                                        {members.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMember(m)}
                                                className={`w-full p-4 flex items-center justify-between hover:bg-foreground/5 transition-all ${selectedMember?.id === m.id ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                                            >
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-foreground">{m.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold">{m.email}</p>
                                                </div>
                                                <CheckCircle className={`w-4 h-4 ${selectedMember?.id === m.id ? 'text-primary' : 'text-muted-foreground/20'}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedMember && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Target Ministry</label>
                                            <select
                                                value={selectedMinistryId}
                                                onChange={(e) => setSelectedMinistryId(e.target.value)}
                                                className="w-full h-16 bg-muted border border-border rounded-2xl px-6 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary transition-all"
                                            >
                                                {ministries.length === 0 ? (
                                                    <option value="" disabled className="bg-card">No ministries found</option>
                                                ) : (
                                                    ministries.map(m => <option key={m.id} value={m.id} className="bg-card">{m.name}</option>)
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Platform Role</label>
                                            <select
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                className="w-full h-16 bg-muted border border-border rounded-2xl px-6 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary transition-all"
                                            >
                                                <option value="ministry_leader" className="bg-card">Ministry Leader</option>
                                                <option value="ministry_worker" className="bg-card">Ministry Worker (Input only)</option>
                                                <option value="shepherd" className="bg-card">Shepherd (Care focus)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleAssign}
                                        disabled={loading || !selectedMinistryId}
                                        className={`w-full h-16 transition-all font-black rounded-2xl shadow-xl uppercase tracking-widest ${!selectedMinistryId ? 'bg-muted text-muted-foreground/30' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'}`}
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                                        {loading ? "ASSIGNING..." : (selectedMinistryId ? `ASSIGN ${selectedMember.name.toUpperCase()} TO LEADERSHIP` : "SELECT A MINISTRY TO PROCEED")}
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-primary/5 border border-primary/10 rounded-3xl p-8 text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                                <CheckCircle className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground">Appointed Successfully!</h3>
                                <p className="text-sm text-muted-foreground">{selectedMember?.name} is now a {selectedRole.replace('_', ' ')}.</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invitation Link</p>
                                <div className="flex gap-2 p-2 bg-muted rounded-2xl border border-border">
                                    <Input
                                        readOnly
                                        value={inviteLink}
                                        className="bg-transparent border-0 h-10 text-xs font-bold text-primary focus-visible:ring-0"
                                    />
                                    <Button onClick={copyToClipboard} size="icon" className="h-10 w-10 bg-card hover:bg-muted rounded-xl border border-border">
                                        <Copy className="w-4 h-4 text-foreground" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={shareInvite} className="h-12 bg-foreground text-background font-black rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-90">
                                    <Share2 className="w-4 h-4" /> Share Link
                                </Button>
                                <Button onClick={reset} variant="outline" className="h-12 bg-transparent border-border text-muted-foreground font-black rounded-xl text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-muted">
                                    <Plus className="w-4 h-4" /> New Onboarding
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
