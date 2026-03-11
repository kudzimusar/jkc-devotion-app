"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Users, CalendarDays, FileText, Bell, ClipboardList } from 'lucide-react';

export default function MinistryOverviewPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            setLoading(false);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    if (loading || !session) {
        return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><p className="text-white/40 font-medium">Loading ministry profile...</p></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link 
                        href="/ministry-dashboard" 
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-violet-500/50 group-hover:bg-violet-500/10 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:block">My Ministries</span>
                    </Link>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full bg-white/20" />
                        <span className="text-sm font-black text-white tracking-wide">{session.ministryName}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                        {session.ministryRole}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 relative z-10">
                {/* Header Card */}
                <div 
                  className="rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/10"
                  style={{ backgroundColor: session.color || '#6366F1' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">{session.ministryName}</h1>
                        <p className="text-white/90 max-w-lg leading-relaxed font-medium">{session.description}</p>
                    </div>
                </div>

                {/* Dashboard Actions */}
                <div>
                    <h2 className="text-[10px] font-black text-white/30 mb-4 tracking-[0.3em] uppercase">Operations</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {MinistryAuth.can(session.ministryRole, 'assistant') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/reports`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                                        <FileText className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors">Submit Report</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Log attendance, events, resources</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/attendance`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                                        <ClipboardList className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Quick Attendance</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Log service headcounts</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/events`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                        <CalendarDays className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Ministry Events</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Manage retreats & outreach</p>
                                </Link>
                            </>
                        )}
                        {MinistryAuth.can(session.ministryRole, 'leader') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/team`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                                        <Users className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">Manage Team</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">Assign roles to volunteers</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/analytics`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all shadow-xl group">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Analytics</h3>
                                    <p className="text-white/40 text-xs mt-1.5 font-medium">View performance metrics</p>
                                </Link>
                            </>
                        )}
                        <Link href={`/ministry-dashboard/${slug}/announcements`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-pink-500/50 hover:bg-pink-500/5 transition-all shadow-xl group">
                            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                                <Bell className="w-5 h-5 text-pink-400" />
                            </div>
                            <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">Announcements</h3>
                            <p className="text-white/40 text-xs mt-1.5 font-medium">Messages from leadership</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

