"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Hand,
  UserRound,
  Leaf,
  Cross,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  Send,
  PenLine,
  Globe,
  Settings,
  User,
  LogOut,
  Download,
  Upload,
  BarChart2,
  Trash2,
  ShieldCheck,
  HeartPulse,
  LayoutDashboard,
  AlertCircle,
  MapPin,
  Mail,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getDevotionForDate, Devotion } from "@/lib/devotions-service";
import { BibleApi, BibleVerse, BibleRef } from "@/lib/bible-api";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";
import type { User as AuthUser } from "@/lib/auth";
import { SoapJournal, SoapEntry, SOAP_EXPLANATION } from "@/lib/soap-journal";
import { basePath as BP } from "@/lib/utils";
import { FeedSection } from "@/components/feed/FeedSection";

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);
  useEffect(() => {
    setHearts(Array.from({ length: 15 }).map((_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 20, duration: 15 + Math.random() * 15, size: 8 + Math.random() * 16
    })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {hearts.map(h => (
        <motion.div
          key={h.id} className="absolute bottom-[-10%]" style={{ left: `${h.left}%` }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{ y: "-120vh", opacity: [0, 0.6, 0], rotate: [0, 180, -180, 0], x: [0, 40, -40, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="text-[var(--primary)] drop-shadow-xl" size={h.size} strokeWidth={1} fill="currentColor" opacity={0.4} />
        </motion.div>
      ))}
    </div>
  );
};

const WEEK_THEMES = [
  { week: 1, name: "Forgiveness", icon: Heart, desc: "The Foundation of Grace" },
  { week: 2, name: "Reconciliation", icon: Leaf, desc: "Restoring Peace and Fellowship" },
  { week: 3, name: "Submission", icon: Hand, desc: "Humility and Yielding" },
  { week: 4, name: "Obedience", icon: UserRound, desc: "Love in Action" },
  { week: 5, name: "Holy Week", icon: Cross, desc: "Passion and Transformation" },
];

const SundayCheckIn = ({ user, currentDate }: { user: any, currentDate: Date }) => {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const todayStr = format(currentDate, "yyyy-MM-dd");

  useEffect(() => {
    if (user) {
      supabase.from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_date', todayStr)
        .maybeSingle()
        .then(({ data }) => { if (data) setCheckedIn(true); });
    }
  }, [user, todayStr]);

  const [children, setChildren] = useState<any[]>([]);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('guardian_links').select('*').eq('guardian_id', user.id)
        .then(({ data }) => { if (data) setChildren(data); });
    }
  }, [user]);

  const handleCheckIn = async (type: string) => {
    if (!user) {
      toast.error("Please login to check-in!");
      return;
    }
    setLoading(true);
    try {
      // 1. Log to attendance_records (legacy/check-in)
      const { error: err1 } = await supabase.from('attendance_records').insert([{
        user_id: user.id,
        event_date: todayStr,
        event_type: type === 'Not Attending' ? 'absence' : 'sunday_service',
        notes: `Checked in as ${type}`
      }]);
      if (err1) throw err1;

      // 2. Sync to attendance_logs
      const statusToken = type === 'In-Person' ? 'in-person' :
        type === 'Online' ? 'online' : 'not-attending';

      await supabase.from('attendance_logs').upsert({
        user_id: user.id,
        service_date: todayStr,
        status: statusToken
      }, { onConflict: 'user_id, service_date' });

      // 3. Log Children Attendance (if any selected)
      if (selectedKids.length > 0 && type !== 'Not Attending') {
        const kidLogs = selectedKids.map(kidName => ({
          guardian_id: user.id,
          child_name: kidName,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          location: type === 'In-Person' ? 'At Church' : 'Online'
        }));
        await supabase.from('kids_registry').insert(kidLogs);
      }

      setCheckedIn(true);
      toast.success(type === 'Not Attending' ? "Message sent to leadership." : "Checked in! Have a blessed service.");
    } catch (e) {
      console.error(e);
      toast.error("Check-in failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checkedIn) return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-black text-emerald-500">You're Checked In!</h4>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Sunday Service {todayStr}</p>
        </div>
      </div>
      <p className="text-sm font-serif italic text-foreground/60 text-right">"I was glad when they said unto me, Let us go into the house of the LORD." - Psalm 122:1</p>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-[var(--primary)] to-pink-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-black italic">Sunday Service Check-In</h3>
          <p className="text-sm font-bold opacity-80 uppercase tracking-[0.2em]">Join us in the house of the Lord today</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button disabled={loading} onClick={() => handleCheckIn('In-Person')} className="bg-white text-[var(--primary)] hover:bg-white/90 font-black px-8 py-6 rounded-2xl shadow-xl h-auto transition-transform active:scale-95">
            <MapPin className="w-5 h-5 mr-3" /> AT CHURCH
          </Button>
          <Button disabled={loading} onClick={() => handleCheckIn('Online')} className="bg-white/20 hover:bg-white/30 text-white font-black px-8 py-6 rounded-2xl backdrop-blur-md border border-white/30 h-auto transition-transform active:scale-95">
            <Globe className="w-5 h-5 mr-3" /> ONLINE (ZOOM/STREAM)
          </Button>
          <Button disabled={loading} onClick={() => handleCheckIn('Not Attending')} className="bg-white/10 hover:bg-white/20 text-white/60 font-black px-8 py-6 rounded-2xl border border-white/10 h-auto transition-transform active:scale-95">
            <XCircle className="w-5 h-5 mr-3" /> NOT ATTENDING
          </Button>
        </div>

        {children.length > 0 && (
          <div className="pt-6 border-t border-white/20 space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-300" />
              <h4 className="text-sm font-black uppercase tracking-widest opacity-80">Junior Church Enrollments</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {children.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => {
                    setSelectedKids(prev =>
                      prev.includes(kid.child_name)
                        ? prev.filter(k => k !== kid.child_name)
                        : [...prev, kid.child_name]
                    );
                  }}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${selectedKids.includes(kid.child_name)
                    ? 'bg-white text-primary border-white scale-[1.02]'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                >
                  <span className="text-xs font-black">{kid.child_name}</span>
                  <span className="text-[10px] opacity-60">Ready for service?</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DevotionalApp() {
  const getJstToday = () => {
    const jstDateStr = formatInTimeZone(new Date(), 'Asia/Tokyo', "yyyy-MM-dd");
    const today = new Date(jstDateStr + "T00:00:00+09:00");
    if (today < new Date("2026-03-01T00:00:00+09:00")) return new Date("2026-03-01T00:00:00+09:00");
    if (today > new Date("2026-05-31T23:59:59+09:00")) return new Date("2026-03-01T00:00:00+09:00");
    return today;
  };

  const [currentDate, setCurrentDate] = useState(getJstToday());
  const [devotion, setDevotion] = useState<Devotion | undefined>();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [jpVerses, setJpVerses] = useState<BibleVerse[]>([]);
  const [lang, setLang] = useState<"EN" | "JP" | "BOTH">("EN");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [declarationMode, setDeclarationMode] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [shareProgress, setShareProgress] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [isDeclared, setIsDeclared] = useState(false);

  useEffect(() => {
    const checkDeclaration = async () => {
        const dateKey = formatInTimeZone(currentDate, 'Asia/Tokyo', "yyyy-MM-dd");
        const localStatus = localStorage.getItem(`declared-${dateKey}`) === "true";
        
        if (user && devotion) {
            try {
                const { data } = await supabase
                    .from('user_declarations')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('devotion_id', devotion.id.toString())
                    .maybeSingle();
                
                if (data) {
                    setIsDeclared(true);
                    return;
                }
            } catch (e) {
                console.error("Error checking declaration:", e);
            }
        }
        setIsDeclared(localStatus);
    };
    
    checkDeclaration();
  }, [currentDate, user, devotion?.id]);

  // Ask Bible Chat State
  const [askChatOpen, setAskChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // SOAP State
  const [soapEntry, setSoapEntry] = useState<SoapEntry>({
    day_number: 0,
    scripture: '',
    observation: '',
    application: '',
    prayer: '',
    updated_at: null
  });

  const [stats, setStats] = useState<{ completed: number; total: number; streak: number; lastCompletedJST: string | null; completedDays: number[] }>({ completed: 0, total: 31, streak: 0, lastCompletedJST: null, completedDays: [] });

  const [mounted, setMounted] = useState(false);
  const loadStats = async () => {
    if (user) {
      const s = await SoapJournal.getStats();
      setStats(s);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadStats();
  }, [user, currentDate]);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await Auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const { data: profile } = await supabase.from('profiles').select('share_progress_with_leaders').eq('id', currentUser.id).single();
        if (profile) setShareProgress(profile.share_progress_with_leaders);
        const { data: member } = await supabase.from('org_members').select('role').eq('user_id', currentUser.id).single();
        if (member) setUserRole(member.role);
      }
    };
    initAuth();

    setCurrentDate(getJstToday());

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const currentUser = await Auth.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          setIsAuthModalOpen(false);
          const { data: profile } = await supabase.from('profiles').select('share_progress_with_leaders').eq('id', currentUser.id).single();
          if (profile) setShareProgress(profile.share_progress_with_leaders);
          const { data: member } = await supabase.from('org_members').select('role').eq('user_id', currentUser.id).single();
          if (member) setUserRole(member.role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadDayData = async () => {
      const dateStr = formatInTimeZone(currentDate, 'Asia/Tokyo', "yyyy-MM-dd");
      setLoading(true);
      try {
        const d = await getDevotionForDate(dateStr);
        setDevotion(d || undefined);

        if (d) {
          if (user) {
            const entry = await SoapJournal.getEntry(d.id);
            setSoapEntry(entry);
            setNote(entry.observation || "");
          } else {
            setSoapEntry(SoapJournal.getDefaultEntry(d.id));
            setNote("");
          }

          const refs = BibleApi.parseReferences(d.scripture);
          if (refs.length > 0) {
            const [enArrays, jpArrays] = await Promise.all([
              Promise.all(refs.map(r => BibleApi.getPassage("NASB", r))),
              Promise.all(refs.map(r => BibleApi.getPassage("JBS", r)))
            ]);
            setVerses(enArrays.flat());
            setJpVerses(jpArrays.flat());
          } else {
            setVerses([]);
            setJpVerses([]);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load today's data");
      } finally {
        setLoading(false);
      }
    };
    loadDayData();
  }, [currentDate, user]);

  const activeVerses = lang === "JP" ? jpVerses : verses;

  const handleLoginSuccess = (newUser: AuthUser) => {
    setUser(newUser);
  };

  const handleDeclare = async () => {
    if (isDeclared || !devotion) return;
    
    try {
      // 1. Pessimistic UI update for speed
      setIsDeclared(true);
      const dateKey = formatInTimeZone(currentDate, 'Asia/Tokyo', "yyyy-MM-dd");
      localStorage.setItem(`declared-${dateKey}`, "true");

      // 2. Persist to Backend
      const { error } = await supabase.from('user_declarations').insert({
        user_id: user?.id || null,
        devotion_id: devotion.id.toString(),
        declaration_text: devotion.declaration,
        user_name: user?.name || "Guest",
        user_type: user ? 'member' : 'guest'
      });

      if (error) throw error;
      
      toast.success("Affirmation Confirmed! You are one with the church.");
    } catch (e) {
      console.error("Declaration error:", e);
      // We don't revert UI because we want it to feel fast, but we log the error
    }
  };

  const saveSoap = async () => {
    if (!user || !devotion) {
      toast.error("Please login to save your journal");
      setIsAuthModalOpen(true);
      return;
    }
    try {
      setLoading(true);
      const entryToSave = { ...soapEntry, observation: note, day_number: devotion.id, scripture: devotion.scripture };
      const savedEntry = await SoapJournal.saveEntry(devotion.id, entryToSave);
      setSoapEntry(entryToSave);

      // Fire and forget AI background processing
      AIService.processSentiment(user.id, savedEntry.id, note, format(currentDate, "yyyy-MM-dd"));

      toast.success("Saved Successfully!");
      loadStats();
    } catch (e) {
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const handleAskChat = async () => {
    if (!chatQuestion.trim() || !devotion) return;
    setChatLoading(true);
    setChatResponse("");
    try {
      const resp = await AIService.askBibleChat(devotion.scripture, chatQuestion);
      setChatResponse(resp);
    } catch (e) {
      toast.error("Failed to query Bible Chat");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Background Orbs */}
      <FloatingHearts />

      <div className="max-w-screen-xl mx-auto px-4 py-8 relative z-[2] transition-all duration-500">
        <div className={`max-w-2xl mx-auto space-y-12 pb-32 transition-all duration-500`}>

          {/* Hero Section */}
          <section className="text-center space-y-4 pt-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 space-y-4"
            >
              <h2 className="text-5xl md:text-7xl font-sans tracking-tight leading-none text-foreground/90">
                <span className="font-serif italic font-medium pr-2 text-[var(--primary)]">90 Days of </span><br className="md:hidden" />
                <span className="font-black text-[var(--foreground)] tracking-widest uppercase md:block mt-2">Transformation</span>
              </h2>
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] opacity-30 pt-4 text-[var(--foreground)]">Building Healthy Habits & Holy Lives</p>

              {mounted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 inline-flex max-w-2xl mx-auto items-center p-4 px-6 rounded-[2rem] card-surface bg-[var(--primary)]/5 border border-[var(--primary)]/20 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.1)] gap-4 text-left">
                  <Sparkles className="w-8 h-8 text-[var(--primary)] shrink-0" />
                  <p className="text-sm font-bold leading-relaxed text-foreground/90 italic tracking-wide">
                    "{AIService.generateHeroMessage(stats.streak, stats.completed, stats.total)}"
                  </p>
                </motion.div>
              )}
            </motion.div>
          </section>

          {/* Pulse / Stats Section */}
          <section>
            <div className="glass-card rounded-[3rem] p-8 md:p-10 border border-foreground/20 shadow-2xl bg-foreground/5 backdrop-blur-2xl">
              <div className="flex flex-col md:flex-row items-center gap-10">
                {/* Progress Circle */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" className="text-white/5" fill="transparent" />
                    <motion.circle
                      cx="50" cy="50" r="44"
                      stroke="var(--primary)"
                      strokeWidth="8"
                      strokeDasharray="276.46"
                      initial={{ strokeDashoffset: 276.46 }}
                      animate={{ strokeDashoffset: 276.46 * (1 - (devotion?.id || 0) / 90) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{(devotion?.id || 0)}</span>
                    <span className="text-[8px] font-black uppercase opacity-40">Day No.</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 w-full grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-black text-[var(--primary)]">{stats.completed}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Completed</div>
                  </div>
                  <div className="space-y-1 border-x border-foreground/10">
                    <div className="text-2xl md:text-3xl font-black text-[var(--primary)]">90</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Total Journey</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-black text-[var(--primary)]">{stats.streak}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Member Feed — Personalised items from Mission Control */}
          {user && <FeedSection />}

          {/* Sunday Check-In */}
          {format(currentDate, "EEEE") === "Sunday" && (
            <section className="max-w-4xl mx-auto px-4">
              <SundayCheckIn user={user} currentDate={currentDate} />
            </section>
          )}

          {/* Main Content Area */}
          <motion.div
            key={format(currentDate, "yyyy-MM-dd")}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 pb-32"
          >
            {/* Daily Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                  {devotion && (() => {
                    const theme = WEEK_THEMES.find(w => w.week === devotion.week);
                    const Icon = theme?.icon || Sparkles;
                    return <Icon className="w-6 h-6 text-[var(--primary)]" />
                  })()}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-black text-xl leading-none">Week {devotion?.week || '?'}: {devotion?.week_theme || '...'}</h3>
                  <p className="text-xs font-bold text-[var(--primary)] tracking-widest uppercase opacity-80" suppressHydrationWarning>{format(currentDate, "EEEE, MMMM d")}</p>
                </div>
              </div>
              {stats.completedDays.includes(devotion?.id || 0) && (
                <Badge className="bg-green-500 text-white font-black border-0 px-4 py-1 rounded-full shadow-lg shadow-green-500/20">
                  COMPLETED
                </Badge>
              )}
            </div>

            {/* Devotion Content Card */}
            <Card className="glass border-foreground/20 rounded-[3rem] overflow-hidden shadow-2xl bg-foreground/5 backdrop-blur-xl group">
              <CardContent className="p-8 md:p-12 space-y-12">
                {/* Title Section */}
                <div className="space-y-4">
                  <Badge variant="outline" className="rounded-full border-[var(--primary)]/40 text-[var(--primary)] px-5 py-2 font-black tracking-[0.2em] text-[10px] uppercase">
                    The Daily Focus
                  </Badge>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-[var(--primary)] opacity-60 tracking-widest">
                      {devotion?.theme || 'Loading...'}
                    </h4>
                    <h3 className="text-3xl md:text-4xl font-black italic text-foreground/90 font-serif leading-tight">
                      "{devotion?.title || 'Today\'s Message'}"
                    </h3>
                  </div>
                </div>

                {/* Scripture Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                      <span className="font-black text-sm tracking-widest uppercase">{devotion?.scripture || 'Scripture Reference'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="rounded-full h-8 text-[10px] font-black gap-2 px-4 glass hover:bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)]" onClick={() => setAskChatOpen(true)}>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI CHAT
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full h-8 text-[10px] font-black gap-2 px-4 glass hover:bg-foreground/10" onClick={() => setLang(l => (l === "EN" ? "JP" : (l === "JP" ? "BOTH" : "EN")))}>
                        <Globe className="w-3.5 h-3.5" />
                        {lang === "EN" ? "NASB" : lang === "JP" ? "口語訳" : "Bilingual"}
                      </Button>
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    {loading ? (
                      <div className="space-y-3 py-4">
                        <div className="h-5 bg-foreground/10 rounded-full w-full animate-pulse" />
                        <div className="h-5 bg-foreground/10 rounded-full w-[80%] animate-pulse" />
                      </div>
                    ) : (
                      <div className="text-xl md:text-2xl font-serif leading-relaxed text-foreground/80 font-medium">
                        {activeVerses.length > 0 ? activeVerses.map((v, i) => (
                          <span key={i} className={lang === "BOTH" ? "block mb-8" : "inline"}>
                            <sup className="text-[var(--primary)] font-black text-xs mr-2">{v.verse}</sup>
                            {v.text}{" "}
                            {lang === "BOTH" && jpVerses[i] && (
                              <span className="block mt-2 text-lg md:text-xl opacity-60 border-l-2 border-[var(--primary)]/30 pl-6 my-4 italic">
                                {jpVerses[i].text}
                              </span>
                            )}
                          </span>
                        )) : (
                          <p className="italic opacity-50 text-sm">Loading scripture passages...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Declaration Section */}
                <div className="pt-6">
                  <Button 
                    variant="outline" 
                    className={`w-full h-auto py-12 rounded-[2.5rem] border-dashed border-2 transition-all flex flex-col gap-6 group/btn ${
                      isDeclared 
                        ? 'border-green-500/50 bg-green-500/5 cursor-default' 
                        : 'border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10'
                    }`}
                    onClick={handleDeclare}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all scale-110 ${
                      isDeclared 
                        ? 'bg-green-500 text-white shadow-green-500/20 rotate-0' 
                        : 'bg-[var(--primary)] text-white shadow-primary/20 rotate-[-20deg] group-hover/btn:rotate-0'
                    }`}>
                      {isDeclared ? <CheckCircle2 className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                    </div>
                    <div className="space-y-3 px-6 w-full max-w-full overflow-hidden">
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDeclared ? 'text-green-500' : 'opacity-40'}`}>
                        {isDeclared ? 'Affirmation Confirmed' : "Today's Declaration"}
                      </span>
                      <div className="max-w-[calc(100vw-4rem)] md:max-w-lg mx-auto">
                        <p className={`text-xl md:text-2xl lg:text-3xl font-black italic tracking-tight break-words whitespace-normal px-4 leading-tight ${
                          isDeclared ? 'text-green-600' : 'text-[var(--foreground)] underline decoration-[var(--primary)]/30 underline-offset-8'
                        }`}>
                          "{devotion?.declaration || 'Declaring His Goodness Today'}"
                        </p>
                      </div>
                    </div>
                    {isDeclared && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-green-500/60 mt-2">
                        I am one with the church
                      </span>
                    )}
                  </Button>
                </div>

                {/* Journaling Section */}
                <div className="space-y-8 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <PenLine className="w-5 h-5 text-[var(--primary)]" />
                    <h5 className="font-black text-sm tracking-widest uppercase">Spirit-Led Journaling</h5>
                  </div>

                  <Tabs defaultValue="reflection" className="w-full">
                    <TabsList className="bg-black/20 p-1 rounded-full h-12 mb-8">
                      <TabsTrigger value="reflection" className="rounded-full px-8 data-[state=active]:bg-primary">Quick Reflection</TabsTrigger>
                      <TabsTrigger value="soap" className="rounded-full px-8 data-[state=active]:bg-primary">Full SOAP</TabsTrigger>
                    </TabsList>

                    <TabsContent value="reflection">
                      <Textarea
                        placeholder="Speak, Lord, for your servant is listening..."
                        className="min-h-[200px] rounded-[2rem] bg-black/10 dark:bg-foreground/5 border-white/5 p-8 text-lg md:text-xl font-serif resize-none focus:ring-2 ring-[var(--primary)]/30 transition-all"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </TabsContent>

                    <TabsContent value="soap" className="space-y-6">
                      {['observation', 'application', 'prayer'].map((field) => (
                        <div key={field} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-6">{field}</label>
                          <Textarea
                            placeholder={`My ${field.toLowerCase()}...`}
                            className="min-h-[120px] rounded-[1.5rem] bg-black/10 dark:bg-foreground/5 border-white/5 p-6 text-base font-serif resize-none"
                            value={(soapEntry as any)[field.toLowerCase()]}
                            onChange={e => setSoapEntry({ ...soapEntry, [field.toLowerCase()]: e.target.value })}
                          />
                        </div>
                      ))}
                    </TabsContent>

                    <div className="flex justify-center pt-10">
                      <Button onClick={saveSoap} disabled={loading} className="rounded-full h-16 px-16 bg-[var(--primary)] text-white font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                        {loading ? "SAVING..." : "COMPLETE TODAY"}
                      </Button>
                    </div>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div> {/* End Main Content Area */}
      </div> {/* End Max Width Wrapper */}

      {/* Persistent Bottom Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 glass p-3 rounded-full border border-foreground/20 shadow-2xl bg-foreground/10 backdrop-blur-3xl lg:bottom-12">
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-foreground/10" onClick={() => setCurrentDate(d => {
          const next = new Date(d);
          next.setDate(next.getDate() - 1);
          return next;
        })}>
          <ChevronLeft className="w-7 h-7" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="rounded-full h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-black gap-3 transition-all">
              <Calendar className="w-5 h-5" />
              <span suppressHydrationWarning>{format(currentDate, "MMMM d")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-[2rem] border-0 overflow-hidden shadow-2xl bg-white/95 backdrop-blur-3xl">
            <CalendarComponent mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-foreground/10" onClick={() => setCurrentDate(d => {
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          return next;
        })}>
          <ChevronRight className="w-7 h-7" />
        </Button>
      </div>

      {/* Ask Bible Chat Sheet */}
      <Sheet open={askChatOpen} onOpenChange={(open) => { setAskChatOpen(open); if (!open) { setChatResponse(""); setChatQuestion(""); } }}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] border-[var(--primary)]/20 bg-background/95 backdrop-blur-3xl glass p-8 min-h-[60vh] flex flex-col z-[200] max-w-2xl mx-auto">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <SheetTitle className="text-2xl font-serif text-[var(--primary)]">Ask Bible Chat</SheetTitle>
            </div>
            <p className="text-xs md:text-sm opacity-60 text-foreground/70 pt-2 font-medium">Reflecting on: <strong className="text-[var(--primary)]">"{devotion?.scripture}"</strong></p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-6">
            <Textarea
              placeholder="E.g., What is the cultural context of this verse? How does this apply to modern times?"
              className="w-full min-h-[120px] bg-black/5 dark:bg-foreground/5 border-[var(--primary)]/20 rounded-[1.5rem] p-6 text-lg focus:ring-2 ring-[var(--primary)]/50 resize-none text-foreground/90"
              value={chatQuestion}
              onChange={e => setChatQuestion(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={handleAskChat} disabled={chatLoading} className="rounded-full h-12 px-8 bg-[var(--primary)] text-white font-black opacity-90 hover:opacity-100 gap-2 shadow-xl shadow-[var(--primary)]/30 transition-all">
                {chatLoading ? "SEEKING RESPONSES..." : "ASK THE SPIRIT"}
              </Button>
            </div>
            {chatResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[2rem] text-foreground/90 text-sm md:text-base leading-relaxed prose prose-invert font-serif italic shadow-inner">
                {chatResponse}
              </motion.div>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </main >
  );
}
