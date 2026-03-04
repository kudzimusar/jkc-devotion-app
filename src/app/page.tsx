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
  AlertCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getDevotionForDate, Devotion } from "@/lib/devotions-service";
import { BibleApi, BibleVerse, BibleRef } from "@/lib/bible-api";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import type { User as AuthUser } from "@/lib/auth";
import { SoapJournal, SoapEntry, SOAP_EXPLANATION } from "@/lib/soap-journal";
import { ProfileView } from "@/components/profile/connection-card";

const WEEK_THEMES = [
  { week: 1, name: "Forgiveness", icon: Heart, desc: "The Foundation of Grace" },
  { week: 2, name: "Reconciliation", icon: Leaf, desc: "Restoring Peace and Fellowship" },
  { week: 3, name: "Submission", icon: Hand, desc: "Humility and Yielding" },
  { week: 4, name: "Obedience", icon: UserRound, desc: "Love in Action" },
  { week: 5, name: "Holy Week", icon: Cross, desc: "Passion and Transformation" },
];

const BP = "/jkc-devotion-app";

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
      await SoapJournal.saveEntry(devotion.id, entryToSave);
      setSoapEntry(entryToSave);
      toast.success("Saved Successfully!");
      loadStats();
    } catch (e) {
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sticky Top Nav */}
      <nav className="sticky top-0 z-[100] w-full bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 relative">
              <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-40 leading-none">Japan Kingdom Church</span>
              <span className="text-sm md:text-lg font-black text-[var(--primary)] uppercase tracking-tight mt-0.5">90 Days Transformation</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Church Member</span>
              <span className="text-xs font-black truncate max-w-[120px] text-[var(--primary)]">{user ? user.name : "Guest Access"}</span>
            </div>
            <Button variant="ghost" size="icon" className="glass rounded-full h-9 w-9 md:h-11 md:w-11" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-[var(--primary)]" />
            </Button>
          </div>
        </div>
      </nav>

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

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-foreground/90">
              90 Days of <br />
              <span className="text-[var(--primary)]">Transformation</span>
            </h2>
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] opacity-30 pt-2">Building Healthy Habits & Holy Lives</p>
          </motion.div>
        </section>

        {/* Pulse / Stats Section */}
        <section>
          <div className="glass-card rounded-[3rem] p-8 md:p-10 border border-white/20 shadow-2xl bg-white/5 backdrop-blur-2xl">
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
                <div className="space-y-1 border-x border-white/10">
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
          <Card className="glass border-white/20 rounded-[3rem] overflow-hidden shadow-2xl bg-white/5 backdrop-blur-xl group">
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
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                    <span className="font-black text-sm tracking-widest uppercase">{devotion?.scripture}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full h-8 text-[10px] font-black gap-2 px-4 glass hover:bg-white/10" onClick={() => setLang(l => (l === "EN" ? "JP" : (l === "JP" ? "BOTH" : "EN")))}>
                    <Globe className="w-3.5 h-3.5" />
                    {lang === "EN" ? "NASB" : lang === "JP" ? "口語訳" : "Bilingual"}
                  </Button>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  {loading ? (
                    <div className="space-y-3 py-4">
                      <div className="h-5 bg-white/10 rounded-full w-full animate-pulse" />
                      <div className="h-5 bg-white/10 rounded-full w-[80%] animate-pulse" />
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
                      className="min-h-[200px] rounded-[2rem] bg-black/10 dark:bg-white/5 border-white/5 p-8 text-lg md:text-xl font-serif resize-none focus:ring-2 ring-[var(--primary)]/30 transition-all"
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
                          className="min-h-[120px] rounded-[1.5rem] bg-black/10 dark:bg-white/5 border-white/5 p-6 text-base font-serif resize-none"
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
      </div>

      {/* Persistent Bottom Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 glass-card p-3 rounded-full border border-white/20 shadow-2xl bg-white/10 backdrop-blur-3xl">
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-white/10" onClick={() => setCurrentDate(d => {
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

        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-white/10" onClick={() => setCurrentDate(d => {
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          return next;
        })}>
          <ChevronRight className="w-7 h-7" />
        </Button>
      </div>

      {/* Account / Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`rounded-[3.5rem] border-0 glass overflow-hidden p-0 ${user ? 'max-w-5xl h-[90vh]' : 'max-w-md'}`}>
          <div className="h-full flex flex-col">
            <div className="p-8 pb-4 flex flex-col items-center gap-4 relative">
              <img src={`${BP}/church-logo.png`} alt="JKC" className="w-16 h-16 object-contain" />
              <DialogTitle className="text-3xl font-serif text-center">{user ? "Connection Card" : "Join the Journey"}</DialogTitle>
              {!user && <p className="text-sm opacity-50 text-center">Your private journal, synced anywhere.</p>}
              <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 opacity-40 hover:opacity-100 transition-opacity">
                <Trash2 className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4">
              {!user ? (
                <div className="space-y-6">
                  <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                    <TabsList className="grid w-full grid-cols-2 rounded-full h-12 mb-10 bg-black/5">
                      <TabsTrigger value="login" className="rounded-full">LOGIN</TabsTrigger>
                      <TabsTrigger value="register" className="rounded-full">NEW ACCOUNT</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-black/5 border-0 px-6" />
                      <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-2xl bg-black/5 border-0 px-6" />
                      <Button onClick={handleLogin} className="w-full h-14 rounded-full bg-primary font-black text-lg" disabled={loading}>CONTINUE</Button>
                      <div className="relative py-4 text-center">
                        <span className="text-[10px] font-black opacity-20 uppercase tracking-widest px-4 bg-transparent">or secure sign in</span>
                      </div>
                      <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-full border-2 font-black gap-3">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Google Account
                      </Button>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4">
                      <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl bg-black/5 border-0 px-6" />
                      <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-black/5 border-0 px-6" />
                      <Input placeholder="Set Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-2xl bg-black/5 border-0 px-6" />
                      <Button onClick={handleRegister} className="w-full h-14 rounded-full bg-primary font-black text-lg" disabled={loading}>CREATE ACCOUNT</Button>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="space-y-12 pb-12">
                  <ProfileView />

                  <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-primary/20">{user.name[0]}</div>
                      <div>
                        <h5 className="font-black text-xl leading-none">{user.name}</h5>
                        <p className="text-xs opacity-40 font-bold uppercase tracking-wider mt-1">{userRole || 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {userRole && userRole !== 'member' && (
                        <Button variant="outline" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest border-2" onClick={() => window.location.href = `${BP}/shepherd/dashboard`}>
                          Oversight Panel
                        </Button>
                      )}
                      <Button variant="ghost" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/10" onClick={async () => {
                        await Auth.logout();
                        setUser(null);
                        setShowSettings(false);
                        toast.info("Logged out safely");
                      }}>Sign Out</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
