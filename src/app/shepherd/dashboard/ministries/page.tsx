"use client";
import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Zap,
  LayoutGrid,
  Trophy,
  Activity
} from "lucide-react";
import { MinistryHubGrid } from "@/components/dashboard/ministries/MinistryHubGrid";
import { MinistryIntelligenceSilo } from "@/components/dashboard/ministries/MinistryIntelligenceSilo";
import { LeaderProfileExtension } from "@/components/dashboard/ministries/LeaderProfileExtension";
import { Button } from "@/components/ui/button";

export default function MinistriesPage() {
    const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground transition-all">
            <div className="p-6 xl:p-12 max-w-[1600px] mx-auto">
                
                {/* GLOBAL HEADER (Only shown on Hub) */}
                {!selectedMinistry && (
                  <div className="mb-12 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Live Intelligence Layer · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">Your Ministries</h1>
                            <p className="text-sm text-muted-foreground mt-4 max-w-lg leading-relaxed">
                              Access all 15 active intelligence silos across all departments. Monitor health scores, track team engagement, and manage silo-specific operations.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-center">
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border rounded-2xl mr-2">
                               <Search className="w-3.5 h-3.5 text-muted-foreground" />
                               <input placeholder="Search silos..." className="bg-transparent border-none text-xs font-bold outline-none w-32" />
                            </div>
                            <Button 
                              onClick={() => console.log('Add Silo Clicked')}
                              className="rounded-2xl h-12 px-6 font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-95 transition-all relative z-20"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Silo
                            </Button>
                        </div>
                    </div>

                    {/* TOP LEVEL AGGREGATE STATS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard label="System Health" value="89%" sub="Avg across silos" icon={<Zap className="text-amber-500" />} />
                        <MetricCard label="Active Leaders" value="34" sub="Departmental leads" icon={<Trophy className="text-primary" />} />
                        <MetricCard label="Live Pipelines" value="15/15" sub="Silo synchronization" icon={<Activity className="text-emerald-500" />} />
                        <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 flex flex-col justify-between relative z-20">
                            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest px-1">Leadership Profile</p>
                            <button 
                              onClick={() => {
                                console.log('Opening Profile');
                                setIsProfileOpen(true);
                              }}
                              className="flex items-center justify-between group relative z-30"
                            >
                               <span className="text-lg font-black text-primary tracking-tight">View Profile</span>
                               <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-all pointer-events-none">
                                  <LayoutGrid size={14} />
                               </div>
                            </button>
                        </div>
                    </div>
                  </div>
                )}

                {/* MAIN CONTENT AREA */}
                <div className="relative z-10">
                    {selectedMinistry ? (
                        <MinistryIntelligenceSilo 
                          ministryId={selectedMinistry.ministry_id}
                          ministrySlug={selectedMinistry.slug}
                          onBack={() => setSelectedMinistry(null)}
                          onOpenProfile={() => setIsProfileOpen(true)}
                        />
                    ) : (
                        <MinistryHubGrid onSelect={(m) => setSelectedMinistry(m)} />
                    )}
                </div>
            </div>

            {/* LEADER PROFILE SIDE-OVER */}
            <LeaderProfileExtension 
              isOpen={isProfileOpen} 
              onClose={() => setIsProfileOpen(false)} 
            />
        </div>
    );
}

function MetricCard({ label, value, sub, icon }: any) {
  return (
    <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm hover:border-primary/20 transition-all group">
       <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
             {React.cloneElement(icon, { size: 18 })}
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
       </div>
       <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-foreground tracking-tighter">{value}</p>
          <p className="text-[10px] font-bold text-muted-foreground/60">{sub}</p>
       </div>
    </div>
  );
}
