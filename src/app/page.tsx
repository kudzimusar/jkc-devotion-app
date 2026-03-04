"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getDevotionForDate, Devotion } from "@/lib/devotions-service";
import { BibleApi, BibleVerse, BibleRef } from "@/lib/bible-api";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import type { User as AuthUser } from "@/lib/auth";
import { SoapJournal, SoapEntry, SOAP_EXPLANATION } from "@/lib/soap-journal";

const WEEK_THEMES = [
  { week: 1, name: "Forgiveness", icon: Heart, desc: "The Foundation of Grace" },
  { week: 2, name: "Reconciliation", icon: Leaf, desc: "Restoring Peace and Fellowship" },
  { week: 3, name: "Submission", icon: Hand, desc: "Humility and Yielding" },
  { week: 4, name: "Obedience", icon: UserRound, desc: "Love in Action" },
  { week: 5, name: "Holy Week", icon: Cross, desc: "Passion and Transformation" },
];

const BP = "/jkc-devotion-app";

export default function DevotionalApp() {
  const [currentDate, setCurrentDate] = useState(new Date("2026-03-02"));
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
  const [preferredTime, setPreferredTime] = useState("07:30");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

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
  const [stats, setStats] = useState<{ completed: number; total: number; streak: number; lastCompletedJST: string | null }>({ completed: 0, total: 31, streak: 0, lastCompletedJST: null });

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
    // Check active session on mount
    const initAuth = async () => {
      const currentUser = await Auth.getCurrentUser();
      setUser(currentUser);
    };
    initAuth();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const currentUser = await Auth.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadDayData = async () => {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const d = await getDevotionForDate(dateStr) || undefined;
      setDevotion(d);

      if (d) {
        setLoading(true);
        // Load existing SOAP entry from Supabase if logged in
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
          } catch (err) {
            console.error(err);
            toast.error("Failed to load scripture");
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };
    loadDayData();
  }, [currentDate, user]);

  const handleSaveSoap = async () => {
    if (devotion && user) {
      try {
        await SoapJournal.saveEntry(devotion.id, soapEntry);
        toast.success("SOAP Journal Save - Cloud Synced");
        // Update stats immediately
        loadStats();
      } catch (err: any) {
        toast.error("Failed to save: " + err.message);
      }
    } else if (!user) {
      toast.error("Please login to save your journal");
      setShowSettings(true);
    }
  };

  const handleLogin = async () => {
    setEmailNotConfirmed(false);
    const res = await Auth.login(email, password);
    if (res.success) {
      setUser(res.user as AuthUser);
      toast.success("Logged in successfully");
      setShowSettings(false);
    } else {
      if (res.error === 'Email not confirmed') {
        setEmailNotConfirmed(true);
      } else {
        toast.error(res.error || "Login failed");
      }
    }
  };

  const handleRegister = async () => {
    setEmailNotConfirmed(false);
    const res = await Auth.createAccount(email, password, name);
    if (res.success) {
      setUser(res.user as AuthUser);
      toast.success("Account created successfully");
      setShowSettings(false);
    } else {
      if (res.error === 'Email not confirmed') {
        setEmailNotConfirmed(true);
      } else {
        toast.error(res.error || "Registration failed");
      }
    }
  };

  const handleResendConfirmation = async () => {
    const res = await Auth.resendConfirmation(email);
    if (res.success) {
      toast.success("Confirmation email resent. Please check your inbox.");
      setEmailNotConfirmed(false);
    } else {
      toast.error(res.error || "Failed to resend confirmation");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await Auth.signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const currentWeek = WEEK_THEMES.find(w => w.week === devotion?.week);
  const activeVerses = lang === "JP" ? jpVerses : verses; // Base loop is driven by EN or JP. Both overrides rendering inside.

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)] blur-[100px] rounded-full" />
      </div>

      <header className="mb-8 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex-shrink-0">
            <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold font-serif leading-none">Japan Kingdom Church</h1>
              <span className="text-[10px] opacity-60 font-medium">ジャパン・キングダム・チャーチ</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-sm glass border-white/20"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full shadow-sm glass border-white/20">
                <Calendar className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-12 space-y-4">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-5xl font-black tracking-tight text-[var(--primary)]"
        >
          90 Days of TRANSFORMATION
        </motion.h1>
        <p className="text-lg opacity-70 max-w-lg mx-auto leading-relaxed">
          Following Jesus with the church through forgiveness, reconciliation, submission, and obedience.
        </p>
        <div className="inline-block px-6 py-2 rounded-full glass border-white/20 font-bold text-[var(--primary)]">
          March 2026
        </div>
      </section>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={format(currentDate, "yyyy-MM-dd") + lang}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 space-y-8 pb-12"
        >
          {/* Progress Overview & Stats */}
          <div className="space-y-6">
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-24 h-24 rotate-[-90deg]">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" className="text-muted/20" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="var(--primary)" strokeWidth="8" strokeDasharray="251.32" strokeDashoffset={251.32 * (1 - (devotion?.id || 0) / 90)} strokeLinecap="round" fill="transparent" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black">{(devotion?.id || 0)}</span>
                    <span className="text-[10px] opacity-50 font-bold uppercase">Day</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 flex-1 w-full">
                  <div className="text-center">
                    <div className="text-2xl font-black text-[var(--primary)]">{stats.completed}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-[var(--primary)]">{stats.total}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-[var(--primary)]">{stats.streak}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Day Streak</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-50">
                  <span>Transformation Progress</span>
                  <span>{Math.round((stats.completed / stats.total) * 100)}%</span>
                </div>
                <div className="h-3 bg-muted/20 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                    className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Current Day Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                  {currentWeek?.icon && <currentWeek.icon className="w-5 h-5 text-[var(--primary)]" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">Week {devotion?.week}: {devotion?.week_theme}</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-medium">{format(currentDate, "EEEE, MMMM d")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stats.lastCompletedJST === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date(currentDate)) && (
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 font-bold border-0 hidden sm:inline-flex">
                    ✓ COMPLETED
                  </Badge>
                )}
                <Badge className="bg-[var(--primary)] text-white font-bold rounded-full">
                  DAY {devotion?.id}
                </Badge>
              </div>
            </div>
          </div>

          {/* AI Guide / Reminder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[var(--primary)]/10 to-transparent border border-[var(--primary)]/20 rounded-3xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Sparkles className="w-16 h-16 text-[var(--primary)]" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--primary)]">Transformation Guide</h4>
                <p className="text-sm opacity-80 leading-relaxed">
                  {stats.streak === 0 ? (
                    `Welcome back! Take 5 minutes today to focus on God. ${preferredTime === "07:30" ? "Morning" : preferredTime} is a great time to center your soul.`
                  ) : stats.streak < 3 ? (
                    `Great job on your ${stats.streak} day streak! Keep the momentum going. Your set time is ${preferredTime}—don't miss it!`
                  ) : (
                    `Your ${stats.streak} day streak is inspiring! Your growth in ${currentWeek?.name} theme is visible. Stay consistent at ${preferredTime}.`
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          <Card className="rounded-[2.5rem] overflow-hidden border-0 shadow-2xl glass relative">
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
              {currentWeek?.icon && <currentWeek.icon className="w-32 h-32" />}
            </div>

            <CardContent className="p-8 pt-10 space-y-8">
              {/* Devotion Content */}
              <div className="space-y-4">
                <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 border-0 px-4 py-1 text-xs uppercase tracking-widest rounded-full">
                  Daily Focus
                </Badge>
                <h3 className="text-2xl md:text-3xl font-semibold leading-tight font-serif italic text-[var(--primary)]">
                  "{devotion?.title}"
                </h3>
              </div>

              {/* Bible Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-bold text-sm tracking-wide">
                    <BookOpen className="w-4 h-4 text-[var(--primary)]" /> SCRIPTURE: {devotion?.scripture}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-xs font-bold gap-1 px-3 glass whitespace-nowrap"
                    onClick={() => {
                      if (lang === "EN") setLang("JP");
                      else if (lang === "JP") setLang("BOTH");
                      else setLang("EN");
                    }}
                  >
                    <Globe className="w-3 h-3 text-[var(--primary)]" />
                    {lang === "EN" ? "NASB" : lang === "JP" ? "口語訳 (JBS)" : "EN / JP"}
                  </Button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed font-serif text-foreground/80 min-h-[100px] overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-[var(--primary)]/20">
                  {loading ? (
                    <div className="space-y-2 opacity-30 animate-pulse">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-[90%]" />
                      <div className="h-4 bg-muted rounded w-[95%]" />
                    </div>
                  ) : activeVerses.length > 0 ? (
                    activeVerses.map((v, i) => (
                      <span key={i} className={lang === "BOTH" ? "block mb-4" : ""}>
                        {(v.verse === 1 || (i > 0 && activeVerses[i - 1].bookName !== v.bookName)) && (
                          <span className="block font-bold text-sm text-[var(--primary)] mt-6 mb-1 uppercase tracking-wider">
                            {v.bookName} {v.chapter}
                          </span>
                        )}
                        <span className={lang === "BOTH" ? "block" : ""}>
                          <sup className="text-[var(--primary)] font-bold text-[10px] mr-1">{v.verse}</sup>
                          {v.text}{" "}
                        </span>

                        {/* Secondary rendering for Bilingual View */}
                        {lang === "BOTH" && jpVerses[i] && (
                          <span className="block mt-1 text-base opacity-75">
                            <sup className="text-[var(--primary)] font-bold text-[10px] mr-1">{jpVerses[i].verse}</sup>
                            {jpVerses[i].text}
                          </span>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="opacity-50 italic">Fetch scripture from the {devotion?.scripture}...</p>
                  )}
                </div>
              </div>

              {/* Interactive Declaration */}
              <div className="pt-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto py-10 rounded-[2rem] border-dashed border-2 border-[var(--primary)]/30 hover:border-[var(--primary)]/60 bg-[var(--primary)]/5 dark:bg-black/20 flex flex-col gap-4 text-center group"
                    onClick={() => setDeclarationMode(true)}
                  >
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Send className="w-8 h-8 rotate-[-20deg]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase font-black tracking-[0.2em] opacity-50">My Daily Declaration</p>
                      <p className="text-xl font-bold italic">"{devotion?.declaration}"</p>
                    </div>
                  </Button>
                </motion.div>
              </div>

              {/* Reflection/Journaling with Tabs */}
              <Tabs defaultValue="reflection" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-full mb-6">
                  <TabsTrigger value="reflection" className="rounded-full">Basic Reflection</TabsTrigger>
                  <TabsTrigger value="soap" className="rounded-full">SOAP Journal</TabsTrigger>
                </TabsList>

                <TabsContent value="reflection" className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
                    <PenLine className="w-4 h-4 text-[var(--primary)]" /> MY REFLECTION
                  </div>
                  <Textarea
                    placeholder="Write your thoughts here..."
                    className="h-32 rounded-3xl bg-black/5 dark:bg-white/5 border-0 focus:ring-2 ring-[var(--primary)]/20 p-6 text-lg resize-none"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    className="w-full h-12 rounded-full bg-[var(--primary)] hover:opacity-90 shadow-lg text-white font-bold transition-all"
                    onClick={() => {
                      setSoapEntry(prev => ({ ...prev, observation: note }));
                      handleSaveSoap();
                    }}
                  >
                    SAVE REFLECTION
                  </Button>
                </TabsContent>

                <TabsContent value="soap" className="space-y-6">
                  {Object.entries(SOAP_EXPLANATION).map(([key, info]) => {
                    const field = info.title.toLowerCase() as keyof SoapEntry;
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-xs uppercase tracking-widest text-[var(--primary)]">
                            {key} - {info.title}
                          </label>
                          <span className="text-[10px] opacity-40 lowercase italic">{info.prompt}</span>
                        </div>
                        <Textarea
                          placeholder={`Write your ${info.title.toLowerCase()} here...`}
                          className="min-h-[100px] rounded-2xl bg-black/5 dark:bg-white/5 border-0 focus:ring-2 ring-[var(--primary)]/20 p-4 text-sm resize-none"
                          value={(soapEntry[field] as string) || ""}
                          onChange={(e) => setSoapEntry(prev => ({ ...prev, [field]: e.target.value }))}
                        />
                      </div>
                    );
                  })}
                  <Button
                    className="w-full h-14 rounded-full bg-[var(--primary)] hover:opacity-90 shadow-xl shadow-[var(--primary)]/20 text-white font-bold transition-all flex gap-2"
                    onClick={handleSaveSoap}
                  >
                    <Download className="w-5 h-5" /> SAVE SOAP JOURNAL
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Date Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-full px-6 py-3 shadow-2xl z-50">
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-white/20" onClick={() => setCurrentDate(d => {
          const newDate = new Date(d);
          newDate.setDate(newDate.getDate() - 1);
          return newDate;
        })}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="px-4 font-bold tracking-widest text-sm flex flex-col items-center">
          <span className="opacity-50 text-[10px]">CURRENT DAY</span>
          {format(currentDate, "MMM d")}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-white/20" onClick={() => setCurrentDate(d => {
          const newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 1);
          return newDate;
        })}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings / Auth Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="rounded-[2.5rem] border-0 glass max-w-md p-8">
          <DialogHeader className="flex flex-col items-center">
            <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-16 h-16 object-contain mb-4" />
            <DialogTitle className="text-2xl font-serif text-center">{user ? "My Account" : "Join the Journey"}</DialogTitle>
            {!user && <p className="text-sm text-center opacity-70">Sign in to sync your journals across devices.</p>}
          </DialogHeader>

          {!user ? (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full h-12 rounded-full border-0 glass hover:bg-white/20 font-bold flex gap-3" onClick={handleGoogleLogin}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground font-bold">Or Email</span></div>
                </div>
              </div>

              <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                  <TabsTrigger value="login" className="rounded-full">Login</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-full">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-0 px-4 focus:ring-2 ring-[var(--primary)]/20"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-0 px-4 focus:ring-2 ring-[var(--primary)]/20"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    {emailNotConfirmed ? (
                      <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-4 rounded-2xl text-sm font-medium border border-yellow-500/20 flex flex-col gap-3">
                        <p>Your email address has not been confirmed yet.</p>
                        <Button type="button" variant="outline" className="w-full border-yellow-500/30 hover:bg-yellow-500/10" onClick={handleResendConfirmation}>
                          Resend Confirmation Email
                        </Button>
                      </div>
                    ) : (
                      <Button type="submit" className="w-full h-12 rounded-full bg-[var(--primary)] font-bold text-white shadow-lg">
                        SIGN IN
                      </Button>
                    )}
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-0 px-4 focus:ring-2 ring-[var(--primary)]/20"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-0 px-4 focus:ring-2 ring-[var(--primary)]/20"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password (min 6 chars)"
                      className="w-full h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-0 px-4 focus:ring-2 ring-[var(--primary)]/20"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    {emailNotConfirmed ? (
                      <div className="bg-yellow-500/10 text-yellow-600 p-4 rounded-2xl text-sm font-medium border border-yellow-500/20 flex flex-col gap-3">
                        <p>Registration successful! Please confirm your email.</p>
                        <Button type="button" variant="outline" className="w-full border-yellow-500/30 hover:bg-yellow-500/10" onClick={handleResendConfirmation}>
                          Resend Confirmation Email
                        </Button>
                      </div>
                    ) : (
                      <Button type="submit" className="w-full h-12 rounded-full bg-[var(--primary)] font-bold text-white shadow-lg">
                        CREATE ACCOUNT
                      </Button>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              <div className="bg-[var(--primary)]/10 rounded-3xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-2xl font-bold">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full" alt="avatar" /> : user.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-xl">{user.name}</h4>
                  <p className="text-sm opacity-60">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 rounded-3xl flex flex-col gap-2 border-0 glass hover:bg-white/20" onClick={async () => {
                  const entries = await SoapJournal.getAllEntries();
                  const text = JSON.stringify(entries, null, 2);
                  const blob = new Blob([text], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = "jkc-soap-export.json";
                  a.click();
                  toast.success("SOAP Data Exported");
                }}>
                  <BarChart2 className="w-6 h-6 text-[var(--primary)]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Journal Data</span>
                </Button>
                <Button variant="outline" className="h-24 rounded-3xl flex flex-col gap-2 border-0 glass hover:bg-white/20" onClick={async () => {
                  await Auth.logout();
                  setUser(null);
                  toast.info("Logged out");
                }}>
                  <LogOut className="w-6 h-6 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-2">Remind me at</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full h-12 rounded-full border-0 glass px-6 font-bold text-[var(--primary)]"
                  />
                </div>
                <Button variant="outline" className="w-full h-12 rounded-full border-0 glass hover:bg-white/20 flex gap-2 justify-center" onClick={() => toast.success(`Reminder scheduled for ${preferredTime}`)}>
                  <Download className="w-4 h-4" /> Sync & Save Settings
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-8">
            <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] text-center w-full">Japan Kingdom Church Devotional v2.1 (Cloud)</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={declarationMode} onOpenChange={setDeclarationMode}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-12 border-0 glass overflow-hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-2xl animate-pulse">
              <Send className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] opacity-50">Speak it with Faith</h3>
              <p className="text-2xl font-serif italic text-[var(--primary)] font-bold">
                "{devotion?.declaration}"
              </p>
            </div>
            <div className="w-full space-y-4">
              <Button
                className="w-full h-16 rounded-full bg-[var(--primary)] text-white font-bold text-lg shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-all"
                onClick={() => {
                  setDeclarationMode(false);
                  toast.success("Declaration Recorded", {
                    description: "Your life is being transformed!"
                  });
                }}
              >
                I DECLARE THIS OVER MY LIFE
              </Button>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Hold your heart as you speak it aloud</p>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative z-10 mt-24 pb-32 border-t border-white/10 pt-12">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="flex items-center gap-4">
            <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <h3 className="font-bold text-lg">Japan Kingdom Church</h3>
              <p className="text-xs opacity-60">ジャパン・キングダム・チャーチ</p>
            </div>
          </div>

          <div className="space-y-2 opacity-70">
            <p className="text-sm">〒196-0015 東京都昭島市昭和町2-1-6 TE昭島ビル3F</p>
            <p className="text-sm">電話: 042-519-4940 | Email: jkc.contact@gmail.com</p>
          </div>

          <div className="flex gap-6">
            <a href="https://www.japankingdomchurch.com" target="_blank" rel="noopener" className="text-sm font-bold text-[var(--primary)] hover:underline">Website (EN)</a>
            <a href="https://www.japankingdomchurch.com/ja" target="_blank" rel="noopener" className="text-sm font-bold text-[var(--primary)] hover:underline">ウェブサイト (日本語)</a>
          </div>

          <div className="space-y-1 opacity-40 text-[10px] uppercase tracking-widest font-black">
            <p>© 2026 Japan Kingdom Church. All rights reserved.</p>
            <p>Church Elder: Sanna Patterson</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
