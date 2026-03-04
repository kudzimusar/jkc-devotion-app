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
  LayoutDashboard
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
    // metadata says today is 2026-03-04
    const jstDateStr = formatInTimeZone(new Date(), 'Asia/Tokyo', "yyyy-MM-dd");
    const today = new Date(jstDateStr + "T00:00:00+09:00");

    // Bound to March-May 2026 range
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
  const [preferredTime, setPreferredTime] = useState("07:30");
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
    // Check active session on mount
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

    // Re-sync date on mount to ensure correct Day (e.g. Day 4)
    setCurrentDate(getJstToday());

    // Listen for auth changes
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

  // Tracking Language Utilization and View
  useEffect(() => {
    if (user && devotion) {
      const trackView = async () => {
        await supabase.from('devotion_interactions').insert({
          user_id: user.id,
          devotion_id: devotion.id,
          interaction_type: `view_${lang.toLowerCase()}`
        });
      };
      trackView();
    }
  }, [lang, devotion?.id, user?.id]);

  // Thematic Design: Dynamic Primary Color
  useEffect(() => {
    if (devotion) {
      const colors: Record<number, string> = {
        1: '#fb7185', // Rose
        2: '#10b981', // Emerald
        3: '#f59e0b', // Amber
        4: '#6366f1', // Indigo
        5: '#8b5cf6', // Violet
      };
      const primary = colors[devotion.week] || '#10b981';
      document.documentElement.style.setProperty('--primary', primary);
    }
  }, [devotion?.week]);

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
      toast.success("SOAP Entry Saved Successfully!");
      loadStats();
    } catch (e) {
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 relative">
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)] blur-[100px] rounded-full" />
      </div>

      <div className="sticky top-0 z-[100] -mx-4 px-4 py-4 bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/10 mb-8">
        <header className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-[9px] md:text-[11px] font-bold opacity-40 leading-none uppercase tracking-widest mb-1">Japan Kingdom Church</h4>
              <h1 className="text-sm md:text-2xl font-black text-[var(--primary)] uppercase tracking-tighter leading-none">
                90 Days of <span className="text-xs md:text-2xl block md:inline font-black">TRANSFORMATION</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Account</span>
              <span className="text-xs font-black text-[var(--primary)]">
                {user ? (userRole && userRole !== 'member' ? `${userRole.toUpperCase()}: ${user.name}` : user.name) : "Guest User"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="glass rounded-full h-10 w-10 text-[var(--primary)]" onClick={() => setShowSettings(true)}>
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
      </div>

      <motion.div
        key={format(currentDate, "yyyy-MM-dd") + lang}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 space-y-8 pb-12"
      >
        <div className="space-y-6">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-xl">
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

              <div className="grid grid-cols-3 gap-8 flex-1 w-full text-center">
                <div>
                  <div className="text-2xl font-black text-[var(--primary)]">{stats.completed}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[var(--primary)]">90</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Days</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[var(--primary)]">{stats.streak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                {devotion && WEEK_THEMES.find(w => w.week === devotion.week)?.icon && (
                  (() => {
                    const Icon = WEEK_THEMES.find(w => w.week === devotion.week)!.icon;
                    return <Icon className="w-5 h-5 text-[var(--primary)]" />
                  })()
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-none">Week {devotion?.week}: {devotion?.week_theme}</h3>
                <p className="text-xs opacity-60 uppercase tracking-widest font-medium">{format(currentDate, "EEEE, MMMM d")}</p>
              </div>
            </div>
            {(stats.completedDays.includes(devotion?.id || 0)) && (
              <Badge className="bg-green-500/20 text-green-700 font-bold border-0">
                ✓ COMPLETED
              </Badge>
            )}
          </div>
        </div>

        <Card className="glass border-white/20 rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 p-32 bg-[var(--primary)]/5 blur-[80px] pointer-events-none" />
          <CardContent className="p-8 md:p-12 space-y-10 relative">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-[var(--primary)]/30 text-[var(--primary)] px-4 py-1.5 font-bold tracking-widest text-[9px]">
                DAILY FOCUS
              </Badge>
              <h3 className="text-2xl md:text-3xl font-semibold italic text-[var(--primary)] font-serif">
                "{devotion?.title}"
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-sm tracking-wide">
                  <BookOpen className="w-4 h-4 text-[var(--primary)]" /> SCRIPTURE: {devotion?.scripture}
                </h4>
                <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold gap-1 px-3 glass" onClick={() => setLang(l => (l === "EN" ? "JP" : (l === "JP" ? "BOTH" : "EN")))}>
                  <Globe className="w-3 h-3 text-[var(--primary)]" />
                  {lang === "EN" ? "NASB" : lang === "JP" ? "口語訳" : "EN / JP"}
                </Button>
              </div>
              <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed font-serif text-foreground/80 min-h-[100px]">
                {loading ? (
                  <div className="space-y-2 opacity-30 animate-pulse">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-[90%]" />
                  </div>
                ) : activeVerses.map((v, i) => (
                  <span key={i} className={lang === "BOTH" ? "block mb-4" : ""}>
                    <sup className="text-[var(--primary)] font-bold text-[10px] mr-1">{v.verse}</sup>
                    {v.text}{" "}
                    {lang === "BOTH" && jpVerses[i] && (
                      <span className="block mt-1 text-base opacity-75">
                        <sup className="text-[var(--primary)] font-bold text-[10px] mr-1">{jpVerses[i].verse}</sup>
                        {jpVerses[i].text}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full h-auto py-10 rounded-[2rem] border-dashed border-2 border-[var(--primary)]/30 flex flex-col gap-4 text-center bg-[var(--primary)]/5" onClick={() => setDeclarationMode(true)}>
                <Send className="w-8 h-8 text-[var(--primary)] rotate-[-20deg]" />
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Daily Declaration</p>
                  <p className="text-xl font-bold italic">"{devotion?.declaration}"</p>
                </div>
              </Button>
            </div>

            <Tabs defaultValue="reflection" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full mb-6">
                <TabsTrigger value="reflection" className="rounded-full">Basic Reflection</TabsTrigger>
                <TabsTrigger value="soap" className="rounded-full">SOAP Journal</TabsTrigger>
              </TabsList>

              <TabsContent value="reflection" className="space-y-4">
                <Textarea
                  placeholder="What is God speaking to you today?"
                  className="h-32 rounded-3xl bg-black/5 dark:bg-white/5 border-0 p-6 text-lg resize-none"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="soap" className="space-y-4">
                <div className="grid gap-4">
                  {['observation', 'application', 'prayer'].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-4">{field}</label>
                      <Textarea
                        placeholder={`Enter your ${field}...`}
                        className="rounded-3xl bg-black/5 dark:bg-white/5 border-0 p-6 text-base resize-none"
                        value={(soapEntry as any)[field]}
                        onChange={e => setSoapEntry({ ...soapEntry, [field]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <div className="flex justify-center pt-8">
                <Button onClick={saveSoap} disabled={loading} className="rounded-full h-14 px-12 bg-[var(--primary)] text-white font-black text-lg shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-transform">
                  {loading ? "SAVING..." : "SAVE & COMPLETE"}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 glass p-2 rounded-full border border-white/20 shadow-2xl">
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => setCurrentDate(d => {
          const next = new Date(d);
          next.setDate(next.getDate() - 1);
          return next;
        })}>
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="rounded-full h-12 px-6 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white font-bold gap-2">
              <Calendar className="w-5 h-5" />
              {format(currentDate, "MMM d")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-3xl border-0 overflow-hidden shadow-2xl bg-white/90 backdrop-blur-3xl">
            <CalendarComponent mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => setCurrentDate(d => {
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          return next;
        })}>
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`rounded-[3rem] border-0 glass p-8 ${user ? 'max-w-5xl h-[90vh] overflow-y-auto' : 'max-w-md'}`}>
          <DialogHeader className="flex flex-col items-center">
            <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-16 h-16 object-contain mb-4" />
            <DialogTitle className="text-2xl font-serif text-center">{user ? "My Connection Card" : "Join the Journey"}</DialogTitle>
          </DialogHeader>

          {!user ? (
            <div className="space-y-6 mt-4">
              <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                <TabsList className="grid w-full grid-cols-2 rounded-full mb-8">
                  <TabsTrigger value="login" className="rounded-full">LOGIN</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-full">SIGN UP</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-2xl" />
                  <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-2xl" />
                  <Button onClick={handleLogin} className="w-full h-12 rounded-full bg-primary" disabled={loading}>CONTINUE</Button>
                  <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 rounded-full mt-2">Sign in with Google</Button>
                </TabsContent>
                <TabsContent value="register" className="space-y-4">
                  <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-2xl" />
                  <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-2xl" />
                  <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-2xl" />
                  <Button onClick={handleRegister} className="w-full h-12 rounded-full bg-primary" disabled={loading}>CREATE ACCOUNT</Button>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <ProfileView />
              <div className="flex justify-between items-center pt-8 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-xs opacity-50">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {userRole && userRole !== 'member' && (
                    <Button variant="outline" className="rounded-full h-12 px-6 font-bold text-xs" onClick={() => window.location.href = `${BP}/shepherd/dashboard`}>
                      OVERSIGHT DASHBOARD
                    </Button>
                  )}
                  <Button variant="ghost" className="rounded-full h-12 px-6 font-bold text-red-500" onClick={async () => {
                    await Auth.logout();
                    setUser(null);
                    setShowSettings(false);
                    toast.info("Logged out");
                  }}>LOGOUT</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
