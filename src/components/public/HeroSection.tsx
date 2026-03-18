'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';

export default function HeroSection() {
  const { isDark } = usePublicTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calcNext = () => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstNow = new Date(now.getTime() + (jstOffset - now.getTimezoneOffset()) * 60000);
      const day = jstNow.getDay();
      const daysUntil = day === 0
        ? (jstNow.getHours() < 10 || (jstNow.getHours() === 10 && jstNow.getMinutes() < 30)
          ? 0 : 7)
        : 7 - day;
      const nextSunday = new Date(jstNow);
      nextSunday.setDate(jstNow.getDate() + daysUntil);
      nextSunday.setHours(10, 30, 0, 0);
      const diff = nextSunday.getTime() - jstNow.getTime();
      const totalMins = Math.floor(diff / 60000);
      setTimeLeft({
        days: Math.max(0, Math.floor(totalMins / (60 * 24))),
        hours: Math.max(0, Math.floor((totalMins % (60 * 24)) / 60)),
        minutes: Math.max(0, totalMins % 60)
      });
    };
    calcNext();
    const interval = setInterval(calcNext, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-slate-900"
      style={{
        backgroundImage: 'url("/jkc-devotion-app/images/hero-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Heavy dark overlay to GUARANTEE readability of white/gold text on top of photo */}
      <div
        className="absolute inset-0 z-0 bg-slate-950/70"
      />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <p className="text-[10px] md:text-xs font-black tracking-[0.5em] uppercase"
               style={{ color: 'var(--footer-muted)' }}>
              Japan Kingdom Church · Tokyo, Japan
            </p>
            <div className="w-12 h-px mx-auto mt-2" 
                 style={{ background: 'var(--jkc-gold)' }} />
          </div>

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

          <p className="text-sm md:text-xl font-medium tracking-[0.1em] max-w-3xl mx-auto leading-relaxed"
             style={{ color: 'var(--footer-fg)' }}>
            BUILDING A STRONG CHRISTIAN COMMUNITY REPRESENTING CHRIST TO JAPANESE SOCIETY
          </p>

          <div className="inline-flex rounded-full px-12 py-4 text-xs font-black tracking-[0.2em] mt-4 border"
            style={{
              background: 'var(--footer-bg)',
              borderColor: 'var(--jkc-gold)',
              color: 'var(--jkc-gold)',
            }}>
            SUNDAYS · 9:30AM PRAYER · 10:30AM SERVICE
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-12">
            <Link
              href="/welcome/visit"
              className="w-full sm:w-auto font-black px-12 py-6 rounded-full text-xs tracking-[0.2em] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-center uppercase"
              style={{
                background: 'var(--jkc-gold)',
                color: 'var(--jkc-navy)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              NEW HERE?
            </Link>
            <a
              href="https://youtube.com/japankingdomchurch"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto font-black px-12 py-6 rounded-full text-xs tracking-[0.2em] transition-all duration-300 active:scale-95 text-center uppercase"
              style={{
                border: '1px solid var(--jkc-gold)',
                background: 'transparent',
                color: 'var(--jkc-gold)',
              }}
            >
              WATCH LIVE
            </a>
          </div>

          <div className="flex gap-10 justify-center mt-16">
            {[
              { value: timeLeft.days, label: 'DAYS' },
              { value: timeLeft.hours, label: 'HRS' },
              { value: timeLeft.minutes, label: 'MIN' }
            ].map(({ value, label }) => (
              <div key={label} className="text-center group">
                <div className="text-4xl md:text-5xl font-black" style={{ color: 'var(--jkc-gold)' }}>
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black tracking-[0.3em] uppercase mt-1"
                     style={{ color: 'var(--footer-muted)' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 group"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[10px] font-black tracking-[0.4em] uppercase"
              style={{ color: 'var(--footer-muted)' }}>SCROLL</span>
        <div className="w-px h-16 bg-gradient-to-b from-[var(--jkc-gold)] to-transparent" />
      </motion.div>
    </section>
  );
}
