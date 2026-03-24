'use client';

import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';

export default function NewHereSection() {
  const { isDark } = usePublicTheme();

  return (
    <section className="py-24 px-6"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-3 mb-12 text-center">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            WELCOME
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            How Can We Help <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-navy)' }}>You?</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1 — New Visitor */}
          <div
            className="rounded-[2.5rem] p-10 flex flex-col justify-between transition-all duration-300 group"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--jkc-gold)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                   style={{ background: 'var(--section-alt)' }}>
                👋
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
                First time here?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                We'd love to welcome you. Come as you are — no experience needed. Find out what to expect when you visit us.
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/welcome/visit"
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                style={{ background: 'var(--jkc-gold)', color: 'var(--jkc-navy)' }}
              >
                PLAN MY VISIT
              </Link>
            </div>
          </div>

          {/* Card 2 — Connect Card (DIGITALIZATION) */}
          <div
            className="rounded-[2.5rem] p-10 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden"
            style={{
              background: 'var(--jkc-navy)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--jkc-gold)] opacity-5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                   style={{ background: 'rgba(255,255,255,0.05)' }}>
                📱
              </div>
              <h2 className="text-3xl font-black text-white">
                New <span className="text-[var(--jkc-gold)] italic">Here?</span>
              </h2>
              <p className="text-sm leading-relaxed text-white/60">
                Scanning from your chair? Fill out our Digital Connect Card to stay updated on church news and events.
              </p>
            </div>
            <div className="pt-8">
              <button
                onClick={() => document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all bg-white/10 hover:bg-[var(--jkc-gold)] hover:text-[var(--jkc-navy)] text-white border border-white/10"
              >
                DIGITAL CONNECT CARD
              </button>
            </div>
          </div>

          {/* Card 3 — Returning Member */}
          <div
            className="rounded-[2.5rem] p-10 flex flex-col justify-between transition-all duration-300 group"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid #1e293b',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                   style={{ background: 'var(--section-alt)' }}>
                🏠
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
                Part of the family?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Access sermons, devotionals, and your church community. Everything you need in one place.
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/welcome/devotion"
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                style={{ background: '#1e293b', color: 'white' }}
              >
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
