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

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1 — New Visitor */}
          <div
            className="rounded-2xl p-10 flex flex-col justify-between transition-all duration-300 group"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--jkc-gold)',
              boxShadow: 'var(--card-shadow)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: 'rgba(245, 166, 35, 0.12)' }}>
                👋
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
                First time here?
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                We'd love to welcome you. Come as you are — no experience needed. Find out what to expect when you visit us.
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/welcome/visit"
                className="btn-gold inline-block px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase"
              >
                PLAN MY VISIT
              </Link>
            </div>
          </div>

          {/* Card 2 — Returning Member */}
          <div
            className="rounded-2xl p-10 flex flex-col justify-between transition-all duration-300 group"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--jkc-navy)',
              boxShadow: 'var(--card-shadow)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: 'rgba(27, 58, 107, 0.10)' }}>
                🏠
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
                Part of the family?
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Access sermons, devotionals, ministry tools and your church community. Everything you need in one place.
              </p>
            </div>
            <div className="pt-8">
              <a
                href="https://kudzimusar.github.io/jkc-devotion-app/login/"
                className="btn-navy inline-block px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase"
              >
                SIGN IN TO CHURCH OS
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
