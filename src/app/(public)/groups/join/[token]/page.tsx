"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JoinGroupForm } from "@/components/dashboard/forms/JoinGroupForm";
import { Auth } from "@/lib/auth";
import { User, MessageCircle, Heart, Users, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { use } from "react";

export default function GroupInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const user = await Auth.getCurrentUser();
            setCurrentUser(user);
            
            const { data, error } = await supabase
                .from('bible_study_groups')
                .select('*, profiles!bible_study_groups_leader_id_fkey(name, email)')
                .eq('share_token', token)
                .single();
            
            if (error) {
                toast.error("Invalid invite link.");
                setLoading(false);
                return;
            }
            setGroup(data);
            setLoading(false);
        };
        load();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center animate-bounce">
                <Heart className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Verifying invitation...</p>
        </div>
    );

    if (!group) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-card border border-border rounded-[40px] p-12 text-center shadow-2xl space-y-6">
                <div className="w-20 h-20 bg-muted border border-border rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                    <Users className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-foreground">Link Expired</h1>
                <p className="text-muted-foreground text-sm">This invitation link is no longer valid or has been deactivated by the leader.</p>
                <Link href="/" className="block w-full h-14 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all">
                    Return Home
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full -ml-64 -mb-64 blur-[100px]" />

            <div className="w-full max-w-xl bg-card border border-border rounded-[40px] shadow-2xl shadow-primary/10 overflow-hidden relative z-10 p-8 md:p-12 transition-all">
                <div className="text-center mb-10 space-y-4">
                    <div className="w-20 h-20 rounded-[30px] bg-primary/10 flex items-center justify-center mx-auto shadow-xl shadow-primary/5 border border-primary/5 group">
                        <Users className="w-10 h-10 text-primary transition-transform group-hover:scale-110 duration-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground mb-2">You're Invited!</h1>
                        <p className="text-muted-foreground text-sm font-medium">You have been invited to join the Bible study group:</p>
                        <div className="mt-4 p-4 bg-muted/40 border border-border/50 rounded-2xl inline-block max-w-full">
                            <h2 className="text-xl font-black text-primary truncate px-4">{group.name}</h2>
                            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest px-4 border-t border-border/30 pt-2">
                                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {group.meeting_day}s @ {group.meeting_time}</span>
                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> Led by {group.profiles?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/10 p-6 rounded-[30px] border border-border/50">
                    <JoinGroupForm 
                        group={group} 
                        user={currentUser} 
                        shareToken={token} 
                        onSuccess={() => {
                            toast.success("Welcome aboard!");
                            setTimeout(() => {
                                window.location.href = `/profile`;
                            }, 2000);
                        }} 
                    />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-40">Invited by Link Discovery System</p>
                </div>
            </div>
        </div>
    );
}
