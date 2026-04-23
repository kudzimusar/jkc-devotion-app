"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  CheckCircle2,
  Clock,
  Mail,
  Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MinistryReportModal } from "./MinistryReportModal";
import { MinistryBroadcastModal } from "./MinistryBroadcastModal";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";

interface MinistryIntelligenceSiloProps {
  ministryId: string;
  ministrySlug: string;
  onBack: () => void;
  onOpenProfile: () => void;
  forcedRole?: string;
}

export function MinistryIntelligenceSilo({ 
  ministryId, 
  ministrySlug, 
  onBack, 
  onOpenProfile,
  forcedRole 
}: MinistryIntelligenceSiloProps) {
  const adminCtx = useAdminCtx(); // This might be null in member portal
  const activeRole = forcedRole || adminCtx?.role;
  
  const isLeader = activeRole === 'admin' || 
                   activeRole === 'pastor' || 
                   activeRole === 'shepherd' || 
                   activeRole === 'ministry_leader' ||
                   activeRole === 'leader'; // Account for ministry-specific leader role

  const [intelligence, setIntelligence] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commsTab, setCommsTab] = useState("ALL");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const getMinistryOps = (slug: string) => {
    const defaults = [
      { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Report', sub: 'Ministry performance' },
      { id: 'attendance', icon: <Plus size={14} />, label: 'Quick Attendance', sub: 'Log service headcounts' },
      { id: 'events', icon: <Calendar size={14} />, label: 'Ministry Events', sub: 'Manage retreats' },
      { id: 'team', icon: <Users size={14} />, label: 'Manage Team', sub: 'Assign roles' },
      { id: 'analytics', icon: <Activity size={14} />, label: 'Analytics', sub: 'Performance metrics' },
      { id: 'announcements', icon: <Mail size={14} />, label: 'Announcements', sub: 'Messages from leadership' }
    ];

    const specific: Record<string, any[]> = {
      media: [
        { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Ministry Report', sub: 'Submit media report' },
        { id: 'manual', icon: <Activity size={14} />, label: 'Media Operations Manual', sub: 'SOPs and guides' },
        { id: 'runsheet', icon: <Calendar size={14} />, label: 'Service Media Run Sheet', sub: 'Weekend planning' },
        { id: 'pipeline', icon: <Sparkles size={14} />, label: 'Content Pipeline', sub: 'Socials & broadcast' },
        { id: 'roster', icon: <Users size={14} />, label: 'Tech Team Roster', sub: 'Volunteer schedule' },
        { id: 'sermon_hub', icon: <Activity size={14} />, label: 'Sermon Hub', sub: 'Asset management' }
      ],
      worship: [
        { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Report', sub: 'Rehearsal attendance' },
        { id: 'attendance', icon: <Plus size={14} />, label: 'Quick Attendance', sub: 'Log service headcounts' },
        { id: 'events', icon: <Calendar size={14} />, label: 'Ministry Events', sub: 'Manage retreats' },
        { id: 'team', icon: <Users size={14} />, label: 'Manage Team', sub: 'Assign roles' },
        { id: 'analytics', icon: <Activity size={14} />, label: 'Analytics', sub: 'Performance metrics' },
        { id: 'setlists', icon: <Sparkles size={14} />, label: 'Setlists', sub: 'Weekend planning' }
      ]
    };

    return specific[slug] || defaults;
  };


  const loadSilo = async () => {
    const [intelRes, metricsRes, commsRes] = await Promise.all([
      supabase.from('vw_ministry_intelligence').select('*').eq('ministry_id', ministryId).single(),
      supabase.from('vw_ministry_metrics_current').select('*').eq('ministry_id', ministryId),
      supabase.from('ministry_comms_outbox').select('*, profiles(full_name)').eq('ministry_id', ministryId).order('created_at', { ascending: false }).limit(20)
    ]);

    setIntelligence(intelRes.data);
    setMetrics(metricsRes.data || []);
    setMessages(commsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSilo();
  }, [ministryId]);

  if (loading || !intelligence) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Silo Intelligence...</p>
      </div>
    );
  }

  const color = intelligence.primary_color || "#8B5CF6";
  const tag = intelligence.intelligence_tag || "OPERATIONAL";

  return (
    <div className="flex w-full -m-6 xl:-m-12 min-h-[calc(100vh+3rem)] bg-background">
      {/* ── LEFT SIDEBAR ───────────────────────────────────────── */}
      <div className="hidden lg:flex w-[264px] min-w-[264px] flex-col border-r border-border bg-card/20 min-h-screen sticky top-0 overflow-hidden">
        <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pt-8">
          
          {/* OPERATIONS */}
          <div className="px-5 pb-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 pl-1">Operations</p>
            <div className="space-y-1">
              {getMinistryOps(ministrySlug).map(op => (
                <OpItem 
                  key={op.id}
                  onClick={() => {
                    if (op.id === 'report')      { setIsReportOpen(true); }
                    else if (op.id === 'attendance') { setIsAttendanceOpen(true); }
                    else if (op.id === 'events')  { window.open(`/ministry-dashboard/${ministrySlug}/events`, '_self'); }
                    else if (op.id === 'team')    { window.open(`/ministry-dashboard/${ministrySlug}/team`, '_self'); }
                    else if (op.id === 'analytics') { window.open(`/ministry-dashboard/${ministrySlug}/analytics`, '_self'); }
                    else if (op.id === 'announcements') { setCommsTab('announcement'); }
                    else if (op.id === 'manual' || op.id === 'runsheet' || op.id === 'pipeline' || op.id === 'roster' || op.id === 'sermon_hub' || op.id === 'setlists') {
                      window.open(`/ministry-dashboard/${ministrySlug}/`, '_self');
                    }
                  }} 
                  label={op.label} 
                  sub={op.sub} 
                  color={color}
                />
              ))}
            </div>
          </div>
          
          {/* DIVIDER */}
          <div className="mx-5 border-t border-border my-2" />
          
          {/* EMAILS */}
          <div className="px-5 pb-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pl-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Emails</p>
              <button 
                onClick={() => setIsBroadcastOpen(true)} 
                className="text-[9px] font-black tracking-widest border px-2.5 py-1.5 rounded-lg transition-colors hover:bg-muted" 
                style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}1A` }}
              >
                + COMPOSE
              </button>
            </div>
            <div className="flex gap-1 mb-4">
              {["ALL", "UNREAD", "CRISIS"].map(t => (
                <button 
                  key={t} 
                  onClick={() => setCommsTab(t === 'ALL' ? 'ALL' : t === 'CRISIS' ? 'emergency' : 'unread')} 
                  className="flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all"
                  style={
                    (commsTab === t || (t === 'ALL' && commsTab === 'ALL') || (t === 'CRISIS' && commsTab === 'emergency'))
                      ? { color: color, backgroundColor: `${color}1A`, borderColor: `${color}40`, borderWidth: 1 }
                      : { color: 'var(--muted-foreground)', backgroundColor: 'transparent', borderColor: 'var(--border)', borderWidth: 1 }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl p-5 text-center min-h-[100px]">
               <p className="text-xs font-bold text-muted-foreground">
                 No messages in {(commsTab === 'ALL' ? 'ALL' : commsTab === 'emergency' ? 'CRISIS' : 'UNREAD')}
               </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* TOP NAV */}
        <div className="h-14 px-6 lg:px-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
           <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
               <ArrowLeft className="w-4 h-4" />
             </button>
             <div className="flex items-center gap-2">
               <h1 className="text-sm font-black text-foreground tracking-tight flex items-center gap-2">
                 <span className="opacity-40 font-medium">Ministry /</span> {intelligence.name}
               </h1>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tag}</p>
             </div>
             <div className="w-px h-4 bg-border mx-1" />
             <button 
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group"
             >
               <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary">K</div>
               <div className="text-left hidden sm:block">
                 <p className="text-[9px] font-black text-foreground leading-none">MY PROFILE</p>
                 <p className="text-[7px] font-bold text-primary group-hover:text-primary/70 transition-colors">6 DAY STREAK →</p>
               </div>
             </button>
           </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl w-full">
           
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ministry Health Intelligence</p>
           </div>

           {/* ① KPI GRID */}
           <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
               <StatTile 
                 label="Health Score" 
                 value={intelligence.health_score ? `${intelligence.health_score}/100` : "NO DATA"} 
                 accent={color} 
                 note={intelligence.trend_direction ? `Trending ${intelligence.trend_direction}` : "Submit a report to generate score"}
                 spark={intelligence.health_score ? [28, 31, 36, 29, 41, 38, 36, intelligence.health_score] : null}
               />
               <StatTile label="Team Size" value={intelligence.team_count || "0"} note="Active ministry members" />
               <StatTile label="Total Reports" value={intelligence.reports_this_month != null ? String(intelligence.reports_this_month) : "0"} note="This month" />
               <StatTile label="Status" value={!intelligence.health_score ? "NO DATA" : (intelligence.health_score < 50 ? "AT RISK" : intelligence.health_score >= 80 ? "EXCELLENT" : "STABLE")} alert={intelligence.health_score && intelligence.health_score < 50} note="Calculated by AI engine" />
             </div>

             {/* AI INSIGHTS PANEL */}
             <div className="bg-card border border-border rounded-xl p-6 flex flex-col relative shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}1A`, color: color }}>
                     <Sparkles className="w-3 h-3" />
                  </div>
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest">AI Insights</p>
                </div>
                
                <div className="space-y-4 flex-1">
                  {(intelligence.active_insights || [
                    { insight_type: 'warning', content: 'No report in 40 days. Health score unavailable. Filing a report is your highest-leverage action.' },
                    { insight_type: 'tip', content: 'Assign team members to begin tracking engagement metrics.' }
                  ]).map((ins: any, i: number) => (
                    <div key={i} className="flex gap-3 group">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        ins.insight_type === 'warning' ? 'bg-amber-500' : 
                        ins.insight_type === 'critical' ? 'bg-red-500' : 
                        ins.insight_type === 'tip' ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`} style={ins.insight_type === 'success' ? { backgroundColor: color } : undefined} />
                      <p className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                        {ins.content}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Church OS Intelligence</p>
                </div>
             </div>
           </section>

           {/* ② HERO SECTION */}
           <section className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-sm" style={{ backgroundColor: `${color}05` }}>
             <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)`, filter: 'blur(40px)' }} />
             
             <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                <div className="max-w-xl text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: color }}>
                    {tag} · {intelligence.name.toUpperCase()}
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                    {intelligence.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                     {intelligence.description || `Intelligence silo for the ${intelligence.name}. Track health, team engagement, and AI-driven growth metrics.`}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <HeroStat label="TEAM" value={intelligence.team_count > 0 ? `${intelligence.team_count} MEMBERS` : 'NO DATA'} />
                    <HeroStat label="REPORTS THIS MONTH" value={intelligence.reports_this_month != null ? String(intelligence.reports_this_month) : "0"} />
                    <HeroStat label="STATUS" value={!intelligence.health_score ? "NO DATA" : (intelligence.health_score < 50 ? "AT RISK" : intelligence.health_score >= 80 ? "EXCELLENT" : "STABLE")} />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                   <CircleScore score={intelligence.health_score || 0} color={color} />
                   <div className="flex items-end gap-1 h-6 opacity-30 mt-2">
                      {[1,2,3,4,5,6,7,8,9,10,11].map(i => <div key={i} className="w-1.5 rounded-full" style={{ backgroundColor: color, height: `${Math.max(20, Math.random() * 100)}%` }} />)}
                   </div>
                </div>
             </div>
           </section>

           {/* STATUS STRIP */}
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card border border-border rounded-xl px-4 py-3 gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <div>
                   <p className="text-xs font-bold text-foreground">Automation Active</p>
                   <p className="text-[10px] text-muted-foreground">Real-time health score & Mission Control sync enabled</p>
                 </div>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-1 self-start sm:self-auto">
                 <p className="text-[9px] font-bold text-muted-foreground">Last sync: 3/12/2026</p>
              </div>
           </div>

        </div>
      </div>

      {/* MODALS */}
      <MinistryReportModal 
         isOpen={isReportOpen}
         onClose={() => { setIsReportOpen(false); loadSilo(); }}
         ministryId={ministryId}
         ministryName={intelligence.name}
      />
      <MinistryBroadcastModal 
         isOpen={isBroadcastOpen}
         onClose={() => { setIsBroadcastOpen(false); loadSilo(); }}
         ministryId={ministryId}
         ministryName={intelligence.name}
      />
      {isAttendanceOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAttendanceOpen(false)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-[32px] shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{intelligence.name}</p>
                <h2 className="text-xl font-black text-foreground">Quick Attendance</h2>
              </div>
              <button onClick={() => setIsAttendanceOpen(false)} className="p-2 hover:bg-muted rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <QuickAttendanceForm 
              ministryId={ministryId} 
              ministryName={intelligence.name} 
              color={color}
              onClose={() => { setIsAttendanceOpen(false); loadSilo(); }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, note, accent, alert, spark }: any) {
  return (
    <div className="bg-card border border-border p-4 pb-3.5 rounded-xl flex flex-col" style={alert ? { backgroundColor: 'rgba(248,113,113,0.05)', borderColor: 'rgba(248,113,113,0.2)' } : {}}>
      <p className="text-[10px] font-bold text-muted-foreground mb-2.5 uppercase tracking-widest">{label}</p>
      <div className={`text-[26px] font-bold leading-none mb-2 ${alert ? 'text-red-500' : 'text-foreground'}`} style={!alert && accent ? { color: accent } : {}}>
        {value}
      </div>
      {spark && (
        <div className="mt-auto pt-2">
          <div className="flex items-end gap-1 h-6">
             {spark.map((v: number, i: number) => (
               <div key={i} className="flex-1 rounded-t-[2px]" style={{ backgroundColor: accent || '#8B5CF6', height: `${(v/Math.max(...spark))*100}%` }} />
             ))}
          </div>
        </div>
      )}
      {note && (
        <p className={`text-[11px] mt-auto pt-2 ${alert ? 'text-red-500' : spark ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function HeroStat({ label, value }: any) {
  return (
    <div className="bg-background border border-border rounded-xl px-4 py-2.5 shadow-sm text-center md:text-left">
       <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xs font-black text-foreground">{value}</p>
    </div>
  );
}

function CircleScore({ score, color }: any) {
  const R = 36;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative flex flex-col items-center justify-center">
       <div className="relative w-24 h-24">
         <svg className="absolute inset-0 -rotate-90 w-24 h-24">
           <circle cx={48} cy={48} r={R} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
           <circle 
             cx={48} cy={48} r={R} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
             strokeDasharray={C} strokeDashoffset={C * (1 - score/100)}
             className="transition-all duration-1000 ease-out"
             style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
           />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-black text-foreground leading-none">{score}</span>
            <span className="text-[8px] font-black text-muted-foreground uppercase">/100</span>
         </div>
       </div>
       <span className="text-[8px] font-black text-muted-foreground mt-2 uppercase tracking-widest text-center opacity-60">SPIRITUAL<br/>ATMOSPHERE</span>
    </div>
  );
}

function OpItem({ label, sub, onClick, color }: any) {
  const sym = label.charAt(0).toUpperCase();
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all group text-left">
       <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-all shadow-sm" style={{ color: color }}>
          <span className="text-xs font-black">{sym}</span>
       </div>
       <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground leading-tight truncate">{label}</p>
          <p className="text-[9px] text-muted-foreground truncate">{sub}</p>
       </div>
       <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </button>
  );
}

function QuickAttendanceForm({ ministryId, ministryName, color, onClose }: any) {
  const [count, setCount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!count || Number(count) < 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('ministry_metric_logs').insert({
        ministry_id: ministryId,
        metric_key: 'attendance',
        value: Number(count),
        recorded_by: user?.id,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1800);
    } catch (e) {
      console.error(e);
      alert('Failed to log attendance.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="py-10 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl" style={{ background: color }}>✓</div>
      <p className="text-sm font-black text-foreground">Attendance Logged!</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Health score will update shortly</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Headcount</label>
        <input
          type="number"
          min="0"
          value={count}
          onChange={e => setCount(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="e.g. 45"
          className="w-full bg-muted/20 border border-border rounded-2xl py-3 px-4 text-2xl font-black text-foreground outline-none focus:border-primary/50 text-center"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Special service, rainy day..."
          className="w-full bg-muted/20 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary/50"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || count === ''}
        className="w-full h-14 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase text-white transition-all active:scale-95 disabled:opacity-40"
        style={{ background: color }}
      >
        {loading ? 'LOGGING...' : 'LOG ATTENDANCE'}
      </button>
    </div>
  );
}
