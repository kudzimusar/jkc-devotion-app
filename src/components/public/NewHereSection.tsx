'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { t } from '@/lib/translations';

export default function NewHereSection() {
  const { lang } = useLanguage();

  return (
    <section className="py-24 px-6"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-3 mb-12 text-center">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            {lang === 'ja' ? 'ようこそ' : 'WELCOME'}
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            {t(lang, 'new_here_how')} <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-navy)' }}>{t(lang, 'new_here_you')}</span>
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
                {lang === 'ja' ? '初めてのご参加ですか？' : 'First time here?'}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {lang === 'ja'
                  ? 'ありのままの姿でお越しください。来訪時の流れをご確認いただけます。'
                  : "We'd love to welcome you. Come as you are — no experience needed. Find out what to expect when you visit us."}
              </p>
            </div>
            <div className="pt-8">
              <a
                href="https://calendly.com/visitjkc/service"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                style={{ background: 'var(--jkc-gold)', color: 'var(--jkc-navy)' }}
              >
                {lang === 'ja' ? '来訪を計画する' : 'PLAN MY VISIT'}
              </a>
            </div>
          </div>

          {/* Card 2 — Connect Card */}
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
                {lang === 'ja' ? '初めての方へ' : 'New'} {lang === 'en' && <span className="text-[var(--jkc-gold)] italic">Here?</span>}
              </h2>
              <p className="text-sm leading-relaxed text-white/60">
                {lang === 'ja'
                  ? '席からご記入できます。デジタル連絡カードを送信して、教会の最新情報を受け取りましょう。'
                  : 'Scanning from your chair? Fill out our Digital Connect Card to stay updated on church news and events.'}
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/connect"
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all bg-white/10 hover:bg-[var(--jkc-gold)] hover:text-[var(--jkc-navy)] text-white border border-white/10"
              >
                {lang === 'ja' ? 'デジタル連絡カード' : 'DIGITAL CONNECT CARD'}
              </Link>
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
                {lang === 'ja' ? 'メンバーの方へ' : 'Part of the family?'}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {lang === 'ja'
                  ? '説教・デボーション・コミュニティにアクセスできます。必要なものがすべてここに揃っています。'
                  : 'Access sermons, devotionals, and your church community. Everything you need in one place.'}
              </p>
            </div>
            <div className="pt-8">
              <Link
                href="/profile"
                className="w-full text-center inline-block px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
                style={{ background: '#1e293b', color: 'white' }}
              >
                {lang === 'ja' ? 'サインイン' : 'SIGN IN'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}