'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calcNext = () => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstNow = new Date(now.getTime() + (jstOffset - now.getTimezoneOffset()) * 60000);
      const day = jstNow.getDay(); // 0=Sun
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
        days: Math.floor(totalMins / (60 * 24)),
        hours: Math.floor((totalMins % (60 * 24)) / 60),
        minutes: totalMins % 60
      });
    };
    calcNext();
    const interval = setInterval(calcNext, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{
        backgroundImage: 'url(/jkc-devotion-app/images/hero-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[var(--primary)] blur-[120px] rounded-full opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-500 blur-[120px] rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">
            JAPAN KINGDOM CHURCH · TOKYO, JAPAN
          </p>

          <h1 className="flex flex-col gap-2">
            <span className="text-4xl md:text-6xl font-serif italic text-white/90">
              Welcome to
            </span>
            <span className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-[var(--primary)] leading-none">
              Japan Kingdom <br className="hidden md:block" /> Church
            </span>
          </h1>

          <p className="text-xs md:text-base font-bold tracking-[0.2em] text-white/60 uppercase max-w-2xl mx-auto mt-4">
            Building a Strong Christian Community that represents Christ to Japanese Society
          </p>

          <div className="inline-flex glass-card rounded-full px-8 py-3 text-[10px] md:text-xs font-black tracking-widest text-white/80 border border-white/10 mt-8 mb-2 backdrop-blur-md bg-white/5">
            SUNDAYS · PRAYER 9:30AM · SERVICE 10:30AM JST
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <Link 
              href="/welcome/visit"
              className="w-full sm:w-auto bg-[var(--primary)] text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-center uppercase"
            >
              NEW HERE?
            </Link>
            <a 
              href="https://youtube.com/japankingdomchurch" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border border-white/20 text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] hover:bg-white/5 hover:border-white/40 active:scale-95 transition-all text-center"
            >
              WATCH LIVE
            </a>
          </div>

          <div className="flex gap-6 justify-center mt-12 scale-90 opacity-80">
            {[
              { value: timeLeft.days, label: 'DAYS' },
              { value: timeLeft.hours, label: 'HRS' },
              { value: timeLeft.minutes, label: 'MIN' }
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black text-[var(--primary)]">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-[8px] font-black tracking-widest text-white/30 uppercase">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mt-2">
            Until next Sunday service
          </p>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[8px] font-black tracking-[0.3em] text-white/20 uppercase">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
}
