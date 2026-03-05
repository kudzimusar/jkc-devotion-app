"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2
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
import { TopNav } from "@/components/layout/TopNav";

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
          animate={{ y: "-120vh", opacity: [0, 0.4, 0], rotate: [0, 180, -180, 0], x: [0, 30, -30, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="text-[var(--primary)] text-pink-500/30 drop-shadow-lg" size={h.size} strokeWidth={1} fill="currentColor" opacity={0.3} />
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
      supabase.from('service_attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_date', todayStr)
        .maybeSingle()
        .then(({ data }) => { if (data) setCheckedIn(true); });
    }
  }, [user, todayStr]);

  const handleCheckIn = async (type: string) => {
    if (!user) {
      toast.error("Please login to check-in!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('service_attendance').insert([{
        user_id: user.id,
        service_date: todayStr,
        attendance_type: type
      }]);
      if (error) throw error;
      setCheckedIn(true);
      toast.success("Checked in! Have a blessed service.");
    } catch (e) {
      console.error(e);
      toast.error("Check-in failed. Please try again.");
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
        </div>
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
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | "profile">("login");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [shareProgress, setShareProgress] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

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

  // Auth Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [stats, setStats] = useState<{ completed: number; total: number; streak: number; lastCompletedJST: string | null; completedDays: number[] }>({ completed: 0, total: 31, streak: 0, lastCompletedJST: null, completedDays: [] });

  const loadStats = async () => {
    if (user) {
      const s = await SoapJournal.getStats();
      setStats(s);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

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
          setShowSettings(false);
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
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const d = await getDevotionForDate(dateStr) || undefined;
      setDevotion(d);

      if (d) {
        setLoading(true);
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
          try {
            const [enArrays, jpArrays] = await Promise.all([
              Promise.all(refs.map(r => BibleApi.getPassage("NASB", r))),
              Promise.all(refs.map(r => BibleApi.getPassage("JBS", r)))
            ]);
            setVerses(enArrays.flat());
            setJpVerses(jpArrays.flat());
          } catch (e) {
            console.error(e);
            toast.error("Failed to load scripture");
          }
        } else {
          setVerses([]);
          setJpVerses([]);
        }
        setLoading(false);
      }
    };
    loadDayData();
  }, [currentDate, user]);

  const activeVerses = lang === "JP" ? jpVerses : verses;

  const handleLogin = async () => {
    setLoading(true);
    const res = await Auth.login(email, password);
    if (res.success) {
      setUser(res.user || null);
      toast.success("Welcome back!");
      setShowSettings(false);
    } else if (res.error === 'Email not confirmed') {
      setEmailNotConfirmed(true);
      toast.error("Please confirm your email.");
    } else {
      toast.error(res.error || "Login failed");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    const res = await Auth.createAccount(email, password, name);
    if (res.success) {
      setEmailNotConfirmed(true);
      toast.success("Account created! Check your email.");
    } else {
      toast.error(res.error || "Signup failed");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await Auth.signInWithGoogle();
  };

  const saveSoap = async () => {
    if (!user || !devotion) {
      toast.error("Please login to save your journal");
      setShowSettings(true);
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
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <FloatingHearts />

      <TopNav user={user} userRole={userRole} stats={stats} devotion={devotion ? { ...devotion, fullScriptureText: activeVerses.map(v => v.text).join(" ") } : null} currentDate={currentDate} onLoginClick={() => setShowSettings(true)} />

      {/* Email Verification Alert */}
      <AnimatePresence>
        {emailNotConfirmed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/10 border-b border-primary/20 text-center py-2 px-4"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-primary">
              <AlertCircle className="w-3 h-3" />
              Please check your email to verify your account.
              <button className="underline ml-1" onClick={() => setEmailNotConfirmed(false)}>Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-screen-xl mx-auto px-4 py-8 relative z-10 transition-all duration-500">
        <div className={`grid grid-cols-1 ${user && showSettings ? 'lg:grid-cols-12 lg:gap-12' : ''}`}>

          {/* Main Left Column (Or Full Width) */}
          <div className={`${user && showSettings ? 'lg:col-span-7' : 'max-w-2xl mx-auto'} space-y-12 pb-32 transition-all duration-500`}>

            {/* Hero Section */}
            <section className="text-center space-y-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-5xl md:text-7xl font-sans tracking-tight leading-none text-foreground/90">
                  <span className="font-serif italic font-medium pr-2">90 Days of </span><br className="md:hidden" />
                  <span className="font-black text-[var(--primary)] tracking-widest uppercase md:block mt-2">Transformation</span>
                </h2>
                <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] opacity-30 pt-4">Building Healthy Habits & Holy Lives</p>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 inline-flex max-w-2xl mx-auto items-center p-4 px-6 rounded-[2rem] glass bg-[var(--primary)]/5 border border-[var(--primary)]/20 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.1)] gap-4 text-left">
                  <Sparkles className="w-8 h-8 text-[var(--primary)] shrink-0" />
                  <p className="text-sm font-bold leading-relaxed text-foreground/90 italic tracking-wide">
                    "{AIService.generateHeroMessage(stats.streak, stats.completed, stats.total)}"
                  </p>
                </motion.div>
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
                    <h3 className="font-black text-xl leading-none">Week {devotion?.week}: {devotion?.week_theme}</h3>
                    <p className="text-xs font-bold text-[var(--primary)] tracking-widest uppercase opacity-80">{format(currentDate, "EEEE, MMMM d")}</p>
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
                        {devotion?.theme}
                      </h4>
                      <h3 className="text-3xl md:text-4xl font-black italic text-foreground/90 font-serif leading-tight">
                        "{devotion?.title}"
                      </h3>
                    </div>
                  </div>

                  {/* Scripture Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                        <span className="font-black text-sm tracking-widest uppercase">{devotion?.scripture}</span>
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
                          {activeVerses.map((v, i) => (
                            <span key={i} className={lang === "BOTH" ? "block mb-8" : "inline"}>
                              <sup className="text-[var(--primary)] font-black text-xs mr-2">{v.verse}</sup>
                              {v.text}{" "}
                              {lang === "BOTH" && jpVerses[i] && (
                                <span className="block mt-2 text-lg md:text-xl opacity-60 border-l-2 border-[var(--primary)]/30 pl-6 my-4 italic">
                                  {jpVerses[i].text}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Declaration Section */}
                  <div className="pt-6">
                    <Button variant="outline" className="w-full h-auto py-12 rounded-[2.5rem] border-dashed border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 transition-all flex flex-col gap-6" onClick={() => setDeclarationMode(true)}>
                      <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-xl shadow-primary/20 scale-110">
                        <Send className="w-6 h-6 rotate-[-20deg]" />
                      </div>
                      <div className="space-y-2 px-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Today's Declaration</span>
                        <p className="text-2xl md:text-3xl font-black italic tracking-tight underline decoration-[var(--primary)]/30 underline-offset-8">"{devotion?.declaration}"</p>
                      </div>
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
          </div> {/* End Main Left Column */}

          {/* Profile / Settings View (Inline representation instead of Sheet) */}
          {showSettings && (
            <div className={`relative animate-in fade-in slide-in-from-bottom-8 duration-500 w-full ${user ? 'lg:col-span-5 lg:mt-16' : 'max-w-md mx-auto mt-8'}`}>
              <div className="bg-background/80 backdrop-blur-3xl rounded-[3.5rem] border border-foreground/10 overflow-hidden shadow-2xl p-6 lg:p-0">
                <div className="p-4 flex flex-col items-center gap-4 relative shrink-0">
                  <img src={`${BP}/church-logo.png`} alt="JKC" className="w-16 h-16 object-contain" />
                  <h3 className="text-3xl font-serif text-center">{user ? "Connection Card" : "Join the Journey"}</h3>
                  {!user && <p className="text-sm opacity-50 text-center">Your private journal, synced anywhere.</p>}
                  <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 opacity-40 hover:opacity-100 transition-opacity lg:hidden">
                    <Trash2 className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="p-2 md:p-6">
                  {!user ? (
                    <div className="space-y-6">
                      <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                        <TabsList className="grid w-full grid-cols-2 rounded-full h-14 mb-10 bg-foreground/5 border border-foreground/10 p-1">
                          <TabsTrigger value="login" className="rounded-full font-bold">LOGIN</TabsTrigger>
                          <TabsTrigger value="register" className="rounded-full font-bold">NEW ACCOUNT</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4">
                          <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-6 text-lg" />
                          <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-6 text-lg" />
                          <Button onClick={handleLogin} className="w-full h-14 rounded-full bg-primary font-black text-lg py-6 shadow-xl shadow-primary/20" disabled={loading}>CONTINUE</Button>
                          <div className="relative py-4 text-center">
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest px-4 border-t border-foreground/10 pt-4 block w-full mt-2">or secure sign in</span>
                          </div>
                          <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-full border-2 font-black gap-3 py-6 glass border-foreground/10 bg-background/50 hover:bg-foreground/5">
                            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" /> Google Account
                          </Button>
                        </TabsContent>

                        <TabsContent value="register" className="space-y-4">
                          <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-6" />
                          <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-6" />
                          <Input placeholder="Set Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-2xl bg-foreground/5 border border-foreground/10 px-6" />
                          <Button onClick={handleRegister} className="w-full h-14 rounded-full bg-primary font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>CREATE ACCOUNT</Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

        </div> {/* End Grid */}
      </div>

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
              <span>{format(currentDate, "MMMM d")}</span>
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

      {/* Comprehensive Church Footer */}
      <footer className="w-full bg-black/20 dark:bg-foreground/5 border-t border-foreground/10 pt-16 pb-32 mt-20 relative z-10 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 relative opacity-80">
              <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-full h-full object-contain" />
            </div>
            <h4 className="font-serif text-2xl font-black">Japan Kingdom Church</h4>
            <p className="opacity-60 text-sm max-w-sm font-medium leading-relaxed">
              Equipping believers for transformation, building healthy habits, and raising disciples for Christ in Japan.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="font-black uppercase tracking-widest text-xs opacity-40">Contact & Location</h5>
            <div className="space-y-2 opacity-80 text-sm">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Tokyo, Japan</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> contact@japankingdomchurch.com</p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> japankingdomchurch.com</p>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="font-black uppercase tracking-widest text-xs opacity-40">Quick Links</h5>
            <div className="space-y-2 text-sm flex flex-col">
              <a href="https://japankingdomchurch.com" target="_blank" className="opacity-80 hover:text-primary transition-colors hover:opacity-100 w-fit font-bold">Church Website</a>
              <a href="#" className="opacity-80 hover:text-primary transition-colors hover:opacity-100 w-fit font-bold">Privacy Policy</a>
              <a href="#" className="opacity-80 hover:text-primary transition-colors hover:opacity-100 w-fit font-bold">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-6 mt-16 pt-8 border-t border-foreground/10 text-center opacity-40 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Japan Kingdom Church. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
