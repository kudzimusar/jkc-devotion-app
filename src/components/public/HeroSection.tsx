'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Globe, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';

/* ──────────────────────────────────────────────────────────────
   Compact hero-embedded check-in widget
   Shows only on Sundays; gracefully hidden otherwise.
   3 states: guest → 3-option picker → confirmed
────────────────────────────────────────────────────────────── */
function HeroCheckIn({ user }: { user: any }) {
  const [loading, setLoading]     = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);

  const now      = new Date();
  // Always compute JST regardless of client timezone (UTC+9)
  const utcMs    = now.getTime() + now.getTimezoneOffset() * 60000;
  const jstNow   = new Date(utcMs + 9 * 60 * 60000);
  const dayOfWeek = jstNow.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Saturday OR Sunday
  const todayStr = format(jstNow, 'yyyy-MM-dd');

  useEffect(() => {
    if (!user || !isWeekend) return;
    supabase.from('attendance_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_date', todayStr)
      .maybeSingle()
      .then(({ data }) => { if (data) setCheckedIn(true); });
  }, [user, isWeekend, todayStr]);

  if (!isWeekend) return null;

  /**
   * PERFORMANCE CRITICAL: handleCheckIn
   * 1. Uses Optimistic UI (setCheckedIn sets immediately)
   * 2. Uses Promise.all to hit database endpoints in parallel
   * DO NOT switch to sequential await calls as it blocks the user experience.
   */
  const handleCheckIn = async (type: string) => {
    if (!user) {
      toast.error('Please sign in to check in.');
      return;
    }
    
    // OPTIMISTIC UPDATE: Show success immediately for perceived zero-latency
    setLoading(true);
    setSelected(type);
    setCheckedIn(true); 

    try {
      const statusMap: Record<string, string> = {
        'in-person': 'in-person', 'online': 'online', 'absent': 'not-attending'
      };

      // Run both database updates in parallel
      await Promise.all([
        supabase.from('attendance_records').insert([{
          user_id: user.id,
          event_date: todayStr,
          event_type: type === 'absent' ? 'absence' : 'sunday_service',
          notes: `Checked in via hero: ${type}`
        }]),
        supabase.from('attendance_logs').upsert({
          user_id: user.id,
          service_date: todayStr,
          status: statusMap[type]
        }, { onConflict: 'user_id, service_date' })
      ]);

      toast.success(type === 'absent' ? 'Noted — leadership has been informed.' : 'Checked in! God bless your service.');
    } catch {
      // Revert if it fails (rare)
      setCheckedIn(false);
      toast.error('Check-in failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Confirmed state ── */
  if (checkedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl"
        style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)' }}
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--jkc-gold)' }} />
        <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--jkc-gold)' }}>
          You're checked in for today
        </span>
      </motion.div>
    );
  }

  /* ── Guest (not signed in) state ── */
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--footer-muted)' }}>
          SUNDAY SERVICE TODAY —
        </span>
        <Link href="/" className="text-xs font-black tracking-widest uppercase underline underline-offset-2"
              style={{ color: 'var(--jkc-gold)' }}>
          SIGN IN TO CHECK IN
        </Link>
      </motion.div>
    );
  }

  /* ── 3-option picker ── */
  const options = [
    { key: 'in-person', label: 'IN PERSON',  Icon: MapPin,   desc: 'At Church'   },
    { key: 'online',    label: 'ONLINE',      Icon: Globe,    desc: 'Zoom/Stream' },
    { key: 'absent',    label: 'NOT COMING',  Icon: XCircle,  desc: 'Absent'      },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-md"
    >
      {/* Header label */}
      <p className="text-[10px] font-black tracking-[0.4em] uppercase mb-3"
         style={{ color: 'var(--footer-muted)' }}>
        {dayOfWeek === 0 ? 'SUNDAY' : 'SATURDAY'} SERVICE INTENT · {format(jstNow, 'MMM d')}
      </p>

      {/* 3 cards side by side */}
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ key, label, Icon, desc }) => {
          const isActive = selected === key;
          return (
            <button
              key={key}
              disabled={loading}
              onClick={() => handleCheckIn(key)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-60 group grow-1"
              style={{
                background: isActive ? 'var(--jkc-gold)' : 'white',
                border: '1.5px solid white',
                boxShadow: isActive ? '0 10px 25px -5px rgba(245,166,35,0.5)' : '0 10px 20px -10px rgba(0,0,0,0.3)',
              }}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" 
                    style={{ color: isActive ? 'var(--jkc-navy)' : 'var(--jkc-gold)' }} />
              <span className="text-[10px] font-black tracking-widest text-center leading-tight transition-colors"
                    style={{ color: 'var(--jkc-navy)' }}>
                {label}
              </span>
              <span className="text-[9px] font-bold opacity-60" 
                    style={{ color: 'var(--jkc-navy)' }}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main HeroSection
═══════════════════════════════════════════════════════════════ */
export default function HeroSection({ user }: { user?: any }) {
  // Use user from props or local state if not provided
  const [localUser, setLocalUser] = useState<any>(null);
  const activeUser = user || localUser;

  useEffect(() => {
    if (user) return; // Already have user from props
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setLocalUser(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLocalUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [user]);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-slate-900"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        poster="/jkc-devotion-app/images/hero-background.jpg"
      >
        <source 
          src="https://video.wixstatic.com/video/b25f99_e2700740cf4c4191b1d0a25f23ec0917/1080p/mp4/file.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-0 bg-slate-950/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="space-y-6"
        >
          {/* Eyebrow */}
          <div className="space-y-2">
            <p className="text-[10px] md:text-xs font-black tracking-[0.5em] uppercase"
               style={{ color: 'var(--footer-muted)' }}>
              Japan Kingdom Church · Tokyo, Japan
            </p>
            <div className="w-12 h-px mx-auto mt-2" style={{ background: 'var(--jkc-gold)' }} />
          </div>

          {/* Main heading */}
          <h1 className="flex flex-col gap-2">
            <span className="text-4xl md:text-7xl font-serif italic leading-tight"
                  style={{ color: 'var(--footer-fg)' }}>
              Welcome to
            </span>
            <span className="text-6xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.85] drop-shadow-2xl"
                  style={{ color: 'var(--jkc-gold)' }}>
              Japan Kingdom <br className="hidden md:block" /> Church
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-sm md:text-xl font-medium tracking-[0.1em] max-w-3xl mx-auto leading-relaxed"
             style={{ color: 'var(--footer-fg)' }}>
            BUILDING A STRONG CHRISTIAN COMMUNITY REPRESENTING CHRIST TO JAPANESE SOCIETY
          </p>

          {/* Service time badge */}
          <div className="inline-flex rounded-full px-8 py-3 text-xs font-black tracking-[0.2em]"
               style={{
                 background: 'rgba(15,23,42,0.7)',
                 border: '1px solid var(--jkc-gold)',
                 color: 'var(--jkc-gold)',
               }}>
            SUNDAYS · 9:30AM PRAYER · 10:30AM SERVICE
          </div>

          {/* ── CTA Buttons — inline styles guarantee visibility on dark overlay ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/welcome/visit"
              className="w-full sm:w-auto text-center font-black px-12 py-5 rounded-full text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--jkc-gold)',
                color: 'var(--jkc-navy)',
                boxShadow: '0 4px 20px rgba(245,166,35,0.4)',
              }}
            >
              NEW HERE?
            </Link>
            <a
              href="https://youtube.com/japankingdomchurch"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto text-center font-black px-12 py-5 rounded-full text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:bg-white/10 active:scale-95"
              style={{
                border: '2px solid var(--jkc-gold)',
                background: 'transparent',
                color: 'var(--jkc-gold)',
              }}
            >
              WATCH LIVE
            </a>
          </div>

          {/* ── Sunday Check-In Widget (replaces raw countdown) ── */}
          <div className="flex justify-center mt-6">
            <HeroCheckIn user={activeUser} />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[10px] font-black tracking-[0.4em] uppercase"
              style={{ color: 'var(--footer-muted)' }}>SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--jkc-gold)] to-transparent" />
      </motion.div>
    </section>
  );
}
