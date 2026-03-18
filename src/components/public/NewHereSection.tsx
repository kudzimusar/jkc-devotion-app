'use client';

import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';

export default function NewHereSection() {
  const { isDark } = usePublicTheme();
  return (
    <section className="py-24 px-6 border-y" style={{ 
      background: 'var(--background)',
      borderColor: 'var(--border)'
    }}>
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Card 1 — New Visitor */}
        <div data-card="visitor"
             className="rounded-[3rem] p-12 border-l-4 space-y-8 flex flex-col justify-between transition-all duration-300 group"
             style={{ 
               background: 'var(--card)',
               border: '1px solid var(--border)',
               borderLeft: '4px solid var(--jkc-gold)',
               boxShadow: 'var(--shadow-xl)'
             }}>
          <div className="space-y-4">
            <h2 className="text-4xl font-black" style={{ color: 'var(--foreground)' }}>First time here?</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              We'd love to welcome you. Come as you are — no experience needed. Find out what to expect when you visit us.
            </p>
          </div>
          <div className="pt-6">
            <a 
              href="https://calendly.com/visitjkc/service" 
              target="_blank"
              className="inline-block px-10 py-5 rounded-full text-xs font-black tracking-[0.2em] transition-all text-center"
              style={{
                background: 'var(--jkc-gold)',
                color: 'var(--jkc-navy)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              PLAN MY VISIT
            </a>
          </div>
        </div>

        {/* Card 2 — Returning Member */}
        <div data-card="member"
             className="rounded-[3rem] p-12 border-l-4 space-y-8 flex flex-col justify-between transition-all duration-300 group"
             style={{ 
               background: 'var(--card)',
               border: '1px solid var(--border)',
               borderLeft: '4px solid var(--jkc-navy)',
               boxShadow: 'var(--shadow-xl)'
             }}>
          <div className="space-y-4">
            <h2 className="text-4xl font-black" style={{ color: 'var(--foreground)' }}>Part of the family?</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Access sermons, devotionals, ministry tools and your church community. Everything you need in one place.
            </p>
          </div>
          <div className="pt-6">
            <Link 
              href="/" 
              className="inline-block px-10 py-5 rounded-full text-xs font-black tracking-[0.2em] transition-all text-center"
              style={{
                background: 'var(--jkc-navy)',
                color: 'var(--primary-foreground)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              SIGN IN TO CHURCH OS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
