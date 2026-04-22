"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  MapPin, 
  Zap, 
  Heart, 
  Award, 
  Flame, 
  Calendar,
  Grid,
  Mail,
  ShoppingBag,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface LeaderProfileExtensionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderProfileExtension({ isOpen, onClose }: LeaderProfileExtensionProps) {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Identity");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, milRes] = await Promise.all([
        supabase.from('vw_leader_profile_summary').select('*').eq('user_id', user.id).single(),
        supabase.from('spiritual_journey_progression').select('*').eq('user_id', user.id).order('achieved_at', { ascending: false })
      ]);

      setProfile(profileRes.data);
      setMilestones(milRes.data || []);
      setLoading(false);
    }
    loadProfile();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[1020px] bg-card border-l border-border z-[101] shadow-2xl flex overflow-hidden"
          >
            {/* Left Sidebar Profile Section */}
            <div className="w-[300px] border-right border-border bg-muted/30 overflow-y-auto flex flex-col h-full">
              {loading ? (
                <div className="p-12 text-center animate-pulse">
                   <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4" />
                   <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                </div>
              ) : profile && (
                <>
                  {/* Theme / Close Tooltip area */}
                  <div className="flex justify-between p-6 pb-0">
                    <button className="p-2 hover:bg-muted rounded-xl transition-all border border-border">
                       <Sun size={14} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all border border-border">
                       <X size={14} />
                    </button>
                  </div>

                  {/* Avatar & Name */}
                  <div className="p-8 pb-6 flex flex-col items-center text-center border-bottom border-border">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-[32px] bg-primary/20 flex items-center justify-center text-3xl font-black text-primary border-4 border-card shadow-xl overflow-hidden">
                        {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.full_name?.[0] || 'K'}
                      </div>
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-card rounded-full" />
                    </div>
                    <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">
                       {profile.full_name}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Local Assembly</p>
                    
                    <div className="flex gap-2 mt-4">
                       <Badge variant="outline" className="text-[9px] font-black tracking-widest border-primary/30 text-primary bg-primary/5 uppercase">
                         {profile.ministry_name?.split(' ')[0] || 'MEMBER'}
                       </Badge>
                       <Badge variant="outline" className="text-[9px] font-black tracking-widest border-emerald-500/30 text-emerald-500 bg-emerald-500/5 uppercase">
                         LEADER
                       </Badge>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="p-6 space-y-4 border-bottom border-border">
                     <VitalRow label="Current Streak" value={`${profile.current_streak || 0} Days`} icon={<Flame size={12} className="text-amber-500" />} />
                     <VitalRow label="Spiritual Stage" value={profile.current_spiritual_stage || "Disciple"} icon={<Zap size={12} className="text-primary" />} />
                     <VitalRow label="Ministry Role" value={profile.role || "Volunteer"} icon={<User size={12} className="text-muted-foreground" />} />
                  </div>

                  {/* Journey Ring Score */}
                  <div className="p-8">
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Ministry Health</p>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary">72</div>
                        <div>
                           <p className="text-xs font-black text-foreground">{profile.ministry_name}</p>
                           <p className="text-[10px] font-bold text-emerald-500">↑ Improving</p>
                        </div>
                     </div>
                  </div>

                  {/* Spacer / Nav */}
                  <div className="mt-auto px-4 pb-8 space-y-1">
                     <NavBtn onClick={() => setActiveTab('Identity')} icon={<Grid size={14} />} label="Identity Details" active={activeTab === 'Identity'} />
                     <NavBtn onClick={() => setActiveTab('Journey')} icon={<Heart size={14} />} label="Spiritual Journey" active={activeTab === 'Journey'} />
                     <NavBtn icon={<LogOut size={14} />} label="Sign Out" danger />
                  </div>
                </>
              )}
            </div>

            {/* Right Main Content Section */}
            <div className="flex-1 overflow-y-auto bg-card">
              <div className="p-12 max-w-3xl mx-auto">
                {loading ? (
                   <div className="space-y-12">
                      <div className="h-12 bg-muted rounded-2xl w-1/2" />
                      <div className="grid grid-cols-2 gap-8">
                         <div className="h-32 bg-muted rounded-3xl" />
                         <div className="h-32 bg-muted rounded-3xl" />
                      </div>
                   </div>
                ) : profile && (
                  <div className="space-y-12">
                    {/* Page Header */}
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-muted rounded-2xl border border-border">
                             {activeTab === 'Identity' ? <User className="text-muted-foreground" /> : <Heart className="text-primary" />}
                          </div>
                          <h3 className="text-3xl font-black text-foreground tracking-tighter">
                            {activeTab === 'Identity' ? 'Identity Details' : 'Spiritual Journey'}
                          </h3>
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {activeTab === 'Identity' ? 'Structured personal data for Church OS intelligence.' : 'Tracking your milestones and growth within the kingdom.'}
                       </p>
                    </div>

                    {activeTab === 'Identity' ? (
                      <div className="grid grid-cols-2 gap-8">
                         <FieldGroup label="Full name" value={profile.full_name} />
                         <FieldGroup label="Years in Japan" value={profile.years_in_japan || "11"} />
                         <FieldGroup label="Preferred Language" value={profile.language_proficiency || "English"} />
                         <FieldGroup label="Country of Origin" value="Zimbabwe" />
                         <FieldGroup label="Spiritual Stage" value={profile.current_spiritual_stage || "Disciple"} />
                         <FieldGroup label="Last Milestone" value={profile.last_milestone_date ? new Date(profile.last_milestone_date).toLocaleDateString() : "2026-03-09"} />
                      </div>
                    ) : (
                      <div className="space-y-6">
                         {['Seeker', 'Believer', 'Disciple', 'Leader', 'Equipper'].map((stage, i) => {
                            const milestone = milestones.find(m => m.milestone.toLowerCase() === stage.toLowerCase());
                            const isAchieved = !!milestone;
                            const isCurrent = profile.current_spiritual_stage?.toLowerCase() === stage.toLowerCase();

                            return (
                               <div key={stage} className={`p-6 rounded-[32px] border flex items-center justify-between transition-all ${
                                 isCurrent ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 
                                 isAchieved ? 'bg-muted/10 border-border opacity-60' : 'bg-transparent border-dashed border-border opacity-30'
                               }`}>
                                  <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAchieved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {isAchieved ? <CheckCircle2 size={20} /> : <Award size={20} />}
                                     </div>
                                     <div>
                                        <p className="text-sm font-black text-foreground">{stage}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                           {isAchieved ? `Achieved on ${new Date(milestone.achieved_at).toLocaleDateString()}` : 'Locked Milestone'}
                                        </p>
                                     </div>
                                  </div>
                                  {isCurrent && <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase">CURRENT STAGE</Badge>}
                               </div>
                            );
                         })}
                      </div>
                    )}

                    <div className="pt-8 border-t border-border mt-12 flex justify-start">
                       <button className="px-8 py-4 bg-primary text-primary-foreground font-black text-xs tracking-widest uppercase rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                          {activeTab === 'Identity' ? 'Save Identity Changes' : 'Share Journey Update'}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function VitalRow({ label, value, icon }: any) {
  return (
    <div className="flex justify-between items-center group">
       <div className="flex items-center gap-2">
          <div className="p-1.5 bg-card border border-border rounded-lg group-hover:border-primary/30 transition-all">
             {icon}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
       </div>
       <p className="text-[10px] font-black text-foreground">{value}</p>
    </div>
  );
}

function NavBtn({ icon, label, active, danger, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
      active ? 'bg-primary/10 text-primary' : danger ? 'text-red-500 hover:bg-red-500/5' : 'text-muted-foreground hover:bg-muted'
    }`}>
       <span className="opacity-70">{icon}</span>
       <span className="text-xs font-black tracking-tight">{label}</span>
       {active && <ChevronRight className="ml-auto opacity-40" size={12} />}
    </button>
  );
}

function FieldGroup({ label, value }: any) {
  return (
    <div className="space-y-3 flex flex-col group">
       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
       <div className="bg-muted/10 border border-border p-4 rounded-2xl group-hover:border-primary/20 transition-all font-bold text-xs">
          {value}
       </div>
    </div>
  );
}
