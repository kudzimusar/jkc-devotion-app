"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JoinGroupForm } from "@/components/dashboard/forms/JoinGroupForm";
import { Button } from "@/components/ui/button";
import { 
    Users, Calendar, Clock, MapPin, 
    Link as LinkIcon, BookOpen, User, 
    ArrowLeft, Share2, Shield, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Auth } from "@/lib/auth";
import { use } from "react";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const user = await Auth.getCurrentUser();
            setCurrentUser(user);
            
            const { data, error } = await supabase
                .from('bible_study_groups')
                .select('*, profiles!bible_study_groups_leader_id_fkey(name, email)')
                .eq('id', id)
                .single();
            
            if (error) {
                toast.error("Group not found.");
                return;
            }
            setGroup(data);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
    );

    const shareLink = () => {
        const link = `${window.location.origin}/groups/join/${group.share_token}`;
        navigator.clipboard.writeText(link);
        toast.success("Group invite link copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 to-indigo-700/90 mix-blend-multiply transition-all duration-700" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center -z-10 animate-pulse-slow scale-110 blur-sm brightness-50" />
                
                <div className="container mx-auto px-6 h-full flex flex-col justify-end pb-12 relative z-10">
                    <Link href="/profile" className="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">{group.is_active ? 'Active' : 'Archived'}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md">{group.meeting_type}</span>
                            {group.is_private && <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-3 py-1 rounded-full"><Shield className="w-3 h-3 inline mr-1" /> Private</span>}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">{group.name}</h1>
                        <p className="text-white/80 max-w-2xl text-lg font-medium leading-relaxed italic">{group.description || "Building spiritual community through study and prayer."}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-10 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Highlights Grid */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 group hover:border-primary/20 transition-all">
                                <Users className="w-8 h-8 text-primary mb-4 transition-transform group-hover:scale-110" />
                                <h4 className="text-2xl font-black text-foreground">{group.member_count} / {group.max_members}</h4>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Active Members</p>
                            </div>
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 group hover:border-primary/20 transition-all">
                                <Calendar className="w-8 h-8 text-violet-500 mb-4 transition-transform group-hover:scale-110" />
                                <h4 className="text-xl font-black text-foreground">{group.meeting_day || "TBD"}</h4>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Meeting Day</p>
                            </div>
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 group hover:border-primary/20 transition-all">
                                <Clock className="w-8 h-8 text-amber-500 mb-4 transition-transform group-hover:scale-110" />
                                <h4 className="text-xl font-black text-foreground">{group.meeting_time || "TBD"}</h4>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Meeting Time</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-card border border-border rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                             
                             <h3 className="text-2xl font-black text-foreground mb-10 flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-primary rounded-full" /> Study Information
                             </h3>

                             <div className="space-y-12">
                                <div className="flex gap-6 items-start">
                                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group">
                                        <BookOpen className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Current Curriculum</h5>
                                        <p className="text-xl font-bold text-foreground leading-snug">{group.curriculum || "Foundational Doctrines"}</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-start">
                                    <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/10">
                                        <MapPin className="w-8 h-8 text-violet-500" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Venue / Location</h5>
                                        <p className="text-xl font-bold text-foreground leading-snug">{group.location || "Online via Platform"}</p>
                                        {group.meeting_link && (
                                            <a href={group.meeting_link} target="_blank" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline">
                                                <LinkIcon className="w-4 h-4" /> Join Virtual Meeting
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-6 items-start">
                                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
                                        <User className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Primary Leader</h5>
                                        <p className="text-xl font-bold text-foreground leading-snug">{group.profiles?.name || "TBD"}</p>
                                        <p className="text-xs text-muted-foreground mt-1 underline decoration-primary/20 decoration-2 underline-offset-4">{group.profiles?.email}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Sidebar / Join Panel */}
                    <div className="space-y-6">
                        <div className="sticky top-24 bg-card border-[3px] border-primary/20 rounded-[40px] p-8 shadow-2xl shadow-primary/10 overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 animate-pulse-slow" />
                             
                             <h4 className="text-2xl font-black text-foreground mb-2">Join this Group</h4>
                             <p className="text-xs text-muted-foreground font-medium mb-8">Connect with others for spiritual growth and community.</p>

                             {showJoinForm ? (
                                <JoinGroupForm 
                                    group={group} 
                                    user={currentUser} 
                                    onSuccess={() => setShowJoinForm(false)} 
                                />
                             ) : (
                                <div className="space-y-4">
                                    <Button 
                                        onClick={() => setShowJoinForm(true)}
                                        className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-lg font-black rounded-3xl shadow-xl shadow-primary/20 transition-all border-0"
                                    >
                                        {group.requires_approval ? (
                                            <>Request Access <ShieldCheck className="w-5 h-5 ml-2" /></>
                                        ) : (
                                            <>Join Group Now <Users className="w-5 h-5 ml-2" /></>
                                        )}
                                    </Button>
                                    
                                    <Button 
                                        onClick={shareLink}
                                        variant="outline" 
                                        className="w-full h-14 bg-muted border-border text-foreground font-black uppercase text-[10px] tracking-widest rounded-3xl flex items-center justify-center gap-2 group transition-all"
                                    >
                                        <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Copy Invite Link
                                    </Button>

                                    <div className="pt-6 border-t border-border mt-8 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-foreground">Safe Community</p>
                                                <p className="text-[9px] text-muted-foreground">This group follows our strict community safety guidelines.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Quick Stats/Governance Card */}
                        <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
                             <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-muted-foreground">Auto-Join</span>
                                <span className={group.requires_approval ? 'text-amber-500 font-black' : 'text-emerald-500 font-black'}>{group.requires_approval ? 'OFF' : 'ON'}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-muted-foreground">Public Exposure</span>
                                <span className={group.is_private ? 'text-amber-500 font-black' : 'text-emerald-500 font-black'}>{group.is_private ? 'PRIVATE' : 'PUBLIC'}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-muted-foreground">Admin Override</span>
                                <span className="text-primary font-black">ENABLED</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
