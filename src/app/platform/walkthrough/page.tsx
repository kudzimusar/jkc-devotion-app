'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Church, Menu, X, BrainCircuit, Users, Globe, BookOpen,
  Shield, ArrowRight, Activity, BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackEvent, trackTimeOnPage } from '@/lib/analytics';
import { JKC_ORG_ID } from '@/lib/platform-constants';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = [
    { label: 'Global Registry', path: '/platform/registry/' },
    { label: 'AI Growth Engine', path: '/platform/ai/' },
    { label: 'Philanthropy', path: '/platform/philanthropy/' },
    { label: 'Devotion', path: '/welcome/devotion/' },
  ];
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/[.08] py-3' : 'bg-[#0a1628]/80 backdrop-blur-sm border-b border-white/[.05] py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30"><Church className="h-5 w-5 text-white" /></div>
          <span className="text-xl font-black tracking-tighter text-white">Church<span className="text-emerald-400">OS</span></span>
        </button>
        <div className="hidden lg:flex items-center gap-10">
          {links.map(l => <button key={l.path} onClick={() => router.push(l.path)} className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400 hover:text-white transition-colors">{l.label}</button>)}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/platform/login/')} className="hidden sm:flex text-sm font-bold text-slate-400 hover:text-white transition-colors px-3 py-2">Sign In</button>
          <button onClick={() => router.push('/platform/register/')} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">Get Started</button>
          <button className="lg:hidden p-1 text-white" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a1628]/98 backdrop-blur-xl border-b border-white/[.08] p-6 flex flex-col gap-4">
          {links.map(l => <button key={l.path} onClick={() => { router.push(l.path); setMobileOpen(false); }} className="text-left text-sm font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors">{l.label}</button>)}
          <hr className="border-white/10" />
          <button onClick={() => { router.push('/platform/register/'); setMobileOpen(false); }} className="bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl">Get Started</button>
        </div>
      )}
    </nav>
  );
};

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { label: 'Mission Control',       icon: <BarChart3 size={16} />,    desc: 'Your congregation&apos;s spiritual health — visualised in real time.' },
  { label: 'The Secret Place',      icon: <BookOpen size={16} />,     desc: 'Where members go to grow.' },
  { label: 'ChurchGPT',             icon: <BrainCircuit size={16} />, desc: 'Your church&apos;s AI. Trained on your DNA. Available 24/7.' },
  { label: 'Ministry Blueprint',    icon: <Users size={16} />,        desc: 'Every department, running on intelligence built for its calling.' },
  { label: 'Global Registry',       icon: <Globe size={16} />,        desc: '784 sanctuaries. One connected network.' },
];

// ─── Tab 1: Mission Control ───────────────────────────────────────────────────
const MissionControlTab = ({ metrics }: { metrics: any }) => {
  const bars = [
    { label: 'Service Index',  value: metrics?.service_index    ?? 77, color: 'bg-emerald-500' },
    { label: 'Prayer Index',   value: metrics?.prayer_index     ?? 75, color: 'bg-indigo-500'  },
    { label: 'Community',      value: metrics?.community_index  ?? 68, color: 'bg-blue-500'    },
    { label: 'Engagement',     value: metrics?.engagement_index ?? 50, color: 'bg-amber-500'   },
    { label: 'Attendance',     value: metrics?.attendance_index ?? 12, color: 'bg-rose-500'    },
  ];
  return (
    <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1">Live · JKC Network</p>
          <h3 className="text-xl font-black text-white">Congregation Vitality</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-white">{metrics?.score ?? 47}</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">/ 100</span>
        </div>
      </div>
      <div className="space-y-4">
        {bars.map((b, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{b.label}</span>
              <span className="text-sm font-black text-white">{b.value}</span>
            </div>
            <div className="h-1.5 bg-white/[.06] rounded-full overflow-hidden">
              <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
        <Activity className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-rose-300 leading-relaxed">
          PIL Alert: Attendance index at 12/100 — pastoral intervention recommended. Sunday outreach initiative queued for approval.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[.05]">
        {[{ v: '3', l: 'Active Alerts' }, { v: '47', l: 'Engagement Score' }, { v: '92%', l: 'PIL Accuracy' }].map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-lg font-black text-white">{s.v}</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 2: The Secret Place ──────────────────────────────────────────────────
const SecretPlaceTab = () => (
  <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[.04] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-400">Today&apos;s Scripture</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black border border-emerald-500/20">Day 47 🔥</span>
        </div>
        <blockquote className="text-sm text-white leading-relaxed italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          &ldquo;Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.&rdquo;
        </blockquote>
        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">— Proverbs 3:5–6, ESV</p>
      </div>
      <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">SOAP Journal → Today</p>
        <textarea readOnly placeholder="S — What did I notice in today's scripture?&#10;O — What does this passage mean?&#10;A — How does this apply to my life?&#10;P — Write a short prayer in response..."
          rows={5} className="w-full bg-transparent border-none text-slate-500 text-xs leading-relaxed focus:outline-none resize-none placeholder:text-slate-700" />
      </div>
    </div>
    <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">ChurchGPT — Quick Ask</p>
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="bg-indigo-600/30 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
            <p className="text-xs text-white">What is today&apos;s devotion about?</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white/[.04] border border-white/[.08] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
            <p className="text-xs text-slate-300 leading-relaxed">Today we explore trust as an act of surrender. Proverbs 3 invites us to release control — not as weakness, but as faith. At JKC, we often reflect on this through the lens of our multicultural community...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Tab 3: ChurchGPT ─────────────────────────────────────────────────────────
const ChurchGPTTab = () => (
  <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6 max-w-2xl">
    <div className="flex items-center gap-3 pb-4 border-b border-white/[.05]">
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
        <BrainCircuit className="h-5 w-5 text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-black text-white">ChurchGPT</p>
        <p className="text-[10px] text-indigo-400 font-bold">Trained on JKC &mdash; Non-Denominational · Tokyo, Japan</p>
      </div>
      <span className="ml-auto flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
      </span>
    </div>
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="bg-indigo-600/25 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <p className="text-sm text-white">What does the Bible say about forgiveness?</p>
        </div>
      </div>
      <div className="flex justify-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-1">
          <BrainCircuit className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="bg-white/[.04] border border-white/[.08] rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            At Japan Kingdom Church, we teach from a non-denominational perspective rooted in grace. Matthew 6:14–15 reminds us that forgiveness flows from having first received forgiveness ourselves.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Pastor Marcel often frames this in the context of our multicultural community here in Tokyo — forgiveness as a bridge between cultures as much as between people. When we forgive, we model the same cross-cultural unity that defines our congregation.
          </p>
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Source: JKC Theological DNA · Matthew 6:14–15</p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 pt-2 border-t border-white/[.05]">
      <input readOnly placeholder="Ask ChurchGPT anything about faith, scripture, or ministry..." className="flex-1 h-11 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-slate-600 text-sm focus:outline-none placeholder:text-slate-700" />
      <button className="h-11 px-4 rounded-xl bg-indigo-600 text-white text-sm font-bold opacity-60 cursor-not-allowed">Send</button>
    </div>
    <p className="text-[10px] text-slate-600 text-center">Demo view — live ChurchGPT requires church authentication</p>
  </div>
);

// ─── Tab 4: Ministry Blueprint ────────────────────────────────────────────────
const MinistryBlueprintTab = () => {
  const bars = [
    { label: 'Sunday', value: 90 }, { label: 'Monday', value: 20 }, { label: 'Tuesday', value: 35 },
    { label: 'Wednesday', value: 15 }, { label: 'Thursday', value: 45 }, { label: 'Friday', value: 60 }, { label: 'Saturday', value: 30 },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Youth Ministry</p>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-wider">Monitoring</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-500">Weekly Engagement · 7-day</p>
          <div className="flex items-end gap-1.5 h-20">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t-sm transition-all" style={{ height: `${b.value}%`, background: b.label === 'Wednesday' ? '#f59e0b' : '#6366f1', opacity: b.label === 'Wednesday' ? 0.5 : 0.7 }} />
                <span className="text-[7px] text-slate-600 font-bold">{b.label.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[
            { severity: 'amber', msg: 'Mid-week engagement 78% below Sunday average' },
            { severity: 'rose',  msg: '3 regular youth members absent 4+ consecutive Sundays' },
          ].map((a, i) => (
            <div key={i} className={`p-3 rounded-xl flex items-start gap-2 ${a.severity === 'rose' ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <Activity className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.severity === 'rose' ? 'text-rose-400' : 'text-amber-400'}`} />
              <p className={`text-xs font-bold leading-relaxed ${a.severity === 'rose' ? 'text-rose-300' : 'text-amber-300'}`}>{a.msg}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[.04] p-6 space-y-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-400">AI Growth Blueprint</span>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">Youth Ministry · Generated by PIL</p>
        </div>
        <h4 className="text-base font-black text-white leading-snug">
          Launch a weekly mid-week session — high engagement gap detected on Wednesdays.
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          Based on 90-day attendance patterns, Wednesday holds the lowest engagement across your youth cohort. A structured mid-week gathering (worship + small group) is projected to increase weekly touchpoints by 127%.
        </p>
        <div className="pt-4 border-t border-white/[.05] text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <Shield size={10} /> Awaiting pastoral approval gate
        </div>
      </div>
    </div>
  );
};

// ─── Tab 5: Global Registry ───────────────────────────────────────────────────
const GlobalRegistryTab = () => {
  const mockChurches = [
    { initials: 'JK', name: 'Japan Kingdom Church (JKC)', city: 'Tokyo', country: 'Japan', members: 350, client: true, verified: true, colour: 'bg-emerald-500/20 text-emerald-400' },
    { initials: 'GS', name: 'Grace Sanctuary International', city: 'Houston', country: 'USA', members: 2400, client: false, verified: true, colour: 'bg-amber-500/20 text-amber-400' },
    { initials: 'ZH', name: 'Zion Hill Worship Centre', city: 'Lagos', country: 'Nigeria', members: 850, client: false, verified: true, colour: 'bg-indigo-500/20 text-indigo-400' },
  ];
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex gap-2 p-2 rounded-2xl bg-white/[.04] border border-white/[.08]">
        <input readOnly placeholder="Search 784 sanctuaries by name, city, denomination, pastor..."
          className="flex-1 h-10 px-4 bg-transparent text-slate-600 text-sm placeholder:text-slate-700 focus:outline-none" />
        <div className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center opacity-80">Search</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {mockChurches.map((c, i) => (
          <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${c.colour}`}>{c.initials}</div>
              <div className="flex flex-col gap-1 items-end">
                {c.client && <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-wider">Church OS</span>}
                {c.verified && <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-wider">Verified</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-white leading-tight">{c.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.city}, {c.country}</p>
              <p className="text-[11px] text-slate-600">{c.members.toLocaleString()} members</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600 font-bold text-center">Showing 3 of 784 sanctuaries · 25 countries · 783 verified</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalkthroughPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const startTime = Date.now();
    trackEvent({ event_type: 'page_view', page_path: '/platform/walkthrough/' });
    return () => trackTimeOnPage('/platform/walkthrough/', startTime);
  }, []);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase
        .from('church_health_metrics')
        .select('score,attendance_index,engagement_index,service_index,prayer_index,community_index')
        .eq('org_id', JKC_ORG_ID)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setMetrics(data);
    };
    run();
  }, []);

  const tabContent = [
    <MissionControlTab key={0} metrics={metrics} />,
    <SecretPlaceTab key={1} />,
    <ChurchGPTTab key={2} />,
    <MinistryBlueprintTab key={3} />,
    <GlobalRegistryTab key={4} />,
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[.06] blur-[180px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-black uppercase tracking-[.14em] text-indigo-400">Platform Walkthrough</span>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter max-w-3xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            See what Church Intelligence looks like from the inside.
          </h1>
          <p className="text-lg text-slate-400 max-w-xl">Five windows into the platform. No demo call required.</p>
        </div>
      </section>

      {/* Tab bar */}
      <div className="border-b border-white/[.06] bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
            {TABS.map((t, i) => (
              <button key={i} onClick={() => {
                trackEvent({
                  event_type: 'walkthrough_tab',
                  page_path: '/platform/walkthrough/',
                  cta_label: t.label,
                });
                setActiveTab(i);
              }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === i ? 'bg-white/[.06] text-white border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content (desktop: active only; mobile: all stacked) */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        {/* Desktop: active tab */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {TABS[activeTab].label}
            </h2>
            <p className="text-slate-400 text-base" dangerouslySetInnerHTML={{ __html: TABS[activeTab].desc }} />
          </div>
          {tabContent[activeTab]}
        </div>

        {/* Mobile: all stacked */}
        <div className="md:hidden space-y-12">
          {TABS.map((t, i) => (
            <div key={i} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-400">{t.icon}</span>
                  <h2 className="text-xl font-black text-white">{t.label}</h2>
                </div>
                <p className="text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: t.desc }} />
              </div>
              {tabContent[i]}
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div className="border-t border-white/[.06] bg-[#050d18] py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <blockquote className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            &ldquo;You&apos;ve seen the intelligence. Now claim your sanctuary.&rdquo;
          </blockquote>
          <button onClick={() => {
            trackEvent({ event_type: 'cta_click', page_path: '/platform/walkthrough/', cta_label: 'Begin Celestial Onboarding' });
            router.push('/platform/register/?intent=church');
          }}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 h-14 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-base">
            Begin Celestial Onboarding <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
