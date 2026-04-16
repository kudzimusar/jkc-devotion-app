'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Church, Users, Globe, BarChart3, ArrowRight, Zap,
  CheckCircle, Search, MapPin, ShieldCheck, TrendingUp,
  BrainCircuit, Coins, ChevronRight, Menu, X,
  Sparkles, HeartHandshake, MessageSquare,
  Shield, Check, BookOpen, ChevronDown, ChevronUp,
  Star, Heart, Globe2, Activity, Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackEvent, trackTimeOnPage } from '@/lib/analytics';

// ─── Constants ─────────────────────────────────────────────────────────────────
const JKC_ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';
const CHURCHOS_ORG_ID = '00000000-0000-0000-0000-000000000000';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500/20 text-emerald-400',
    'bg-indigo-500/20 text-indigo-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
    'bg-blue-500/20 text-blue-400',
  ];
  return colors[name.charCodeAt(0) % 5];
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ArcColour = 'rose' | 'indigo' | 'amber' | 'emerald' | 'blue';
type PillarColour = 'indigo' | 'rose' | 'amber' | 'emerald' | 'blue';

interface ArcFeature { name: string; desc: string; }
interface ArcData {
  number: string;
  title: string;
  tag: string;
  forLabel: string;
  icon: React.ReactNode;
  colour: ArcColour;
  quote: string;
  features: ArcFeature[];
}

// ─── Colour Maps ──────────────────────────────────────────────────────────────
const arcColours: Record<ArcColour, {
  border: string; iconBg: string; tag: string; num: string; check: string; pill: string;
}> = {
  rose:    { border: 'border-rose-500/25',    iconBg: 'bg-rose-500/10 text-rose-400',       tag: 'text-rose-300',    num: 'text-rose-400/25',    check: 'text-rose-400',    pill: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20' },
  indigo:  { border: 'border-indigo-500/25',  iconBg: 'bg-indigo-500/10 text-indigo-400',   tag: 'text-indigo-300',  num: 'text-indigo-400/25',  check: 'text-indigo-400',  pill: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20' },
  amber:   { border: 'border-amber-500/25',   iconBg: 'bg-amber-500/10 text-amber-400',     tag: 'text-amber-300',   num: 'text-amber-400/25',   check: 'text-amber-400',   pill: 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20' },
  emerald: { border: 'border-emerald-500/25', iconBg: 'bg-emerald-500/10 text-emerald-400', tag: 'text-emerald-300', num: 'text-emerald-400/25', check: 'text-emerald-400', pill: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20' },
  blue:    { border: 'border-blue-500/25',    iconBg: 'bg-blue-500/10 text-blue-400',       tag: 'text-blue-300',    num: 'text-blue-400/25',    check: 'text-blue-400',    pill: 'bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20' },
};

const pillarColours: Record<PillarColour, { accent: string; text: string; bg: string; border: string; }> = {
  indigo:  { accent: 'bg-indigo-500',  text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  rose:    { accent: 'bg-rose-500',    text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  amber:   { accent: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  emerald: { accent: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  blue:    { accent: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
};

// ════════════════════════════════════════════════════════════════════════════
// PRIMITIVE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const PulseDot = () => (
  <span className="relative inline-flex h-2 w-2 shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
);

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'dark';
type BtnSize = 'sm' | 'md' | 'lg' | 'icon';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}

const Btn = ({ variant = 'primary', size = 'md', className = '', children, ...rest }: BtnProps) => {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20',
    outline: 'border border-white/20 text-white hover:bg-white/5 hover:border-white/30',
    ghost:   'text-slate-400 hover:text-white hover:bg-white/5',
    dark:    'bg-white/10 hover:bg-white/15 text-white',
  };
  const s: Record<BtnSize, string> = {
    sm:   'h-9 px-4 text-xs',
    md:   'h-11 px-5 text-sm',
    lg:   'h-14 px-8 text-base',
    icon: 'h-10 w-10',
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-[.98] focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ${v[variant]} ${s[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

type BadgeVariant = 'emerald' | 'indigo' | 'gold' | 'rose' | 'blue' | 'slate';

const Badge = ({
  variant = 'emerald',
  children,
  className = '',
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) => {
  const v: Record<BadgeVariant, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    gold:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    slate:   'bg-white/5 text-slate-400 border-white/10',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[.14em] ${v[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — NAVBAR
// ════════════════════════════════════════════════════════════════════════════

const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Global Registry',   path: '/platform/registry/' },
    { label: 'AI Growth Engine',  path: '/platform/ai/' },
    { label: 'Philanthropy',      path: '/platform/philanthropy/' },
    { label: 'Devotion',          path: '/welcome/devotion/' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/[.08] py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
            <Church className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            Church<span className="text-emerald-400">OS</span>
          </span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Btn variant="ghost" size="sm" className="hidden sm:flex" onClick={() => router.push('/platform/login/')}>
            Sign In
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => router.push('/platform/register/')}>
            Get Started
          </Btn>
          <button
            className="lg:hidden p-1 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a1628]/98 backdrop-blur-xl border-b border-white/[.08] p-6 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { router.push(link.path); setMobileOpen(false); }}
              className="text-left text-sm font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <hr className="border-white/10" />
          <Btn variant="ghost" className="justify-start" onClick={() => { router.push('/platform/login/'); setMobileOpen(false); }}>
            Sign In
          </Btn>
          <Btn variant="primary" onClick={() => { router.push('/platform/register/'); setMobileOpen(false); }}>
            Get Started
          </Btn>
        </div>
      )}
    </nav>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — HERO
// ════════════════════════════════════════════════════════════════════════════

const Hero = ({ registryCount, campaignTarget, latestChurch }: { registryCount: number; campaignTarget: string; latestChurch: any }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const q = searchQuery.trim();
    trackEvent({
      event_type: 'registry_search',
      page_path: '/platform/',
      search_query: q || 'empty',
    });
    router.push(q ? `/platform/registry/?q=${encodeURIComponent(q)}` : '/platform/registry/');
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-24 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/[.07] blur-[180px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/[.07] blur-[160px] rounded-full" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[.028]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Live badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="emerald" className="gap-2">
              <PulseDot />
              Verified Registry&nbsp;·&nbsp;
              <span className="text-emerald-300 font-black">{registryCount.toLocaleString()} Sanctuaries Live</span>
            </Badge>
            <Badge variant="gold">
              Campaign Target&nbsp;·&nbsp;<span className="text-amber-300 font-black">{campaignTarget}</span>
            </Badge>
          </div>

          {/* H1 */}
          <h1
            className="text-6xl sm:text-7xl md:text-[5.5rem] font-black tracking-tighter leading-[.88] text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Unite the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              Global
            </span>{' '}
            Sanctuary.
          </h1>

          {/* Payoff line */}
          <div className="space-y-1">
            <p
              className="text-xl md:text-2xl text-slate-400 italic"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              &ldquo;Built for pastors to be pastors again.&rdquo;
            </p>
            <p className="text-sm font-black uppercase tracking-[.2em] text-emerald-500">
              &mdash;&nbsp;Church Intelligence.
            </p>
          </div>

          {/* Body copy */}
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            The first intelligent operating system built for ministry transparency, predictive pastoral care, and universal church philanthropy — across every denomination, on every continent.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Btn
              size="lg"
              variant="primary"
              className="group"
              onClick={() => {
                trackEvent({ event_type: 'cta_click', page_path: '/platform/', cta_label: 'Explore Featured Church' });
                router.push('/platform/church/japan-kingdom-church-tokyo/');
              }}
            >
              Explore Featured Church
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Btn>
            <Btn size="lg" variant="outline" onClick={() => {
              trackEvent({ event_type: 'cta_click', page_path: '/platform/', cta_label: 'Start Your Journey' });
              router.push('/platform/register/');
            }}>
              Start Your Journey
            </Btn>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 p-2 rounded-2xl bg-white/[.04] border border-white/[.08] backdrop-blur-sm">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Find a church by location, denomination, or ministry..."
                  className="w-full h-12 pl-11 pr-4 bg-transparent border-none text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none"
                />
              </div>
              <Btn variant="primary" size="sm" className="px-5 shrink-0 my-1" onClick={handleSearch}>
                Search Registry
              </Btn>
            </div>
            {latestChurch && (
              <p className="text-slate-600 text-xs mt-3 text-center">
                <span className="text-emerald-500">●</span>{' '}
                Latest addition: <span className="text-slate-400">{latestChurch.name}</span>
                <span className="text-slate-600"> · {latestChurch.country}</span>
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — STAT STRIP
// ════════════════════════════════════════════════════════════════════════════

const StatStrip = ({ registryCount }: { registryCount: number }) => {
  const stats = [
    { label: 'Sanctuaries Registered', value: registryCount.toLocaleString(), sub: 'Live & Growing' },
    { label: 'Countries',              value: '25',    sub: 'Global Reach' },
    { label: 'Verified',               value: '783',   sub: 'Trusted Status' },
    { label: 'Ministry Verticals',     value: '14',    sub: 'Per Church Profile' },
    { label: 'PIL Accuracy',           value: '92%',   sub: 'Prophetic Intelligence' },
    { label: 'Avg Health Score',       value: '58',    sub: 'Congregation Vitality' },
  ];

  return (
    <div className="border-y border-white/[.06] bg-white/[.015]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{stat.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">{stat.label}</p>
              <p className="text-[9px] text-emerald-500/80 font-medium uppercase tracking-wider">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — INTERACTIVE ARC CARDS
// ════════════════════════════════════════════════════════════════════════════

const ArcCard = ({
  arc,
  isActive,
  onToggle,
}: {
  arc: ArcData;
  isActive: boolean;
  onToggle: () => void;
}) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const c = arcColours[arc.colour];

  return (
    <div className={`rounded-2xl border ${c.border} bg-white/[.02] transition-all duration-300 overflow-hidden ${isActive ? 'ring-1 ring-white/10 bg-white/[.03]' : 'hover:bg-white/[.03]'}`}>
      {/* Header — always visible, clickable to toggle */}
      <button onClick={onToggle} className="w-full p-6 text-left">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
              {arc.icon}
            </div>
            <div>
              <span className={`block text-[9px] font-black uppercase tracking-[.2em] mb-0.5 ${c.tag}`}>
                {arc.tag}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">{arc.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className={`text-5xl font-black leading-none select-none ${c.num}`}>{arc.number}</span>
            {isActive
              ? <ChevronUp size={16} className="text-slate-500" />
              : <ChevronDown size={16} className="text-slate-500" />
            }
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-500 mb-4">For: {arc.forLabel}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {arc.features.map((feature, i) => (
            <span
              key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-default select-none ${c.pill}`}
            >
              {feature.name}
            </span>
          ))}
        </div>

        {/* Pill hover description (desktop only, not when expanded) */}
        {hoveredFeature !== null && !isActive && (
          <div className="mt-4 pt-4 border-t border-white/[.05] animate-in fade-in duration-150">
            <p className="text-sm text-slate-400 leading-relaxed">{arc.features[hoveredFeature].desc}</p>
          </div>
        )}
      </button>

      {/* Expanded panel */}
      {isActive && (
        <div className="px-6 pb-6 border-t border-white/[.05] animate-in slide-in-from-top-2 duration-200">
          <p
            className="text-base italic text-slate-400 my-5 leading-relaxed"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {arc.quote}
          </p>
          <div className="space-y-5">
            {arc.features.map((feature, i) => (
              <div key={i} className="flex gap-3">
                <Check className={`h-4 w-4 mt-0.5 shrink-0 ${c.check}`} />
                <div>
                  <p className="text-sm font-black text-white">{feature.name}</p>
                  <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ARCS: ArcData[] = [
  {
    number: '01', colour: 'rose', tag: 'PASTORAL INTELLIGENCE',
    title: "The Shepherd's Relief", forLabel: 'Pastors / Lead Pastors',
    icon: <Shield size={18} />,
    quote: '"Your congregation is being watched over — even when you\'re sleeping."',
    features: [
      { name: 'Victory Briefings',        desc: 'Every Sunday morning a structured congregation health report is auto-generated by the PIL brain. No data entry required.' },
      { name: 'Care Alerts (Red/Amber)',   desc: 'Detects drops in prayer activity, attendance gaps, and engagement dips before they become pastoral crises.' },
      { name: 'Engagement Score (0–100)',  desc: 'Every member carries a live spiritual engagement score. See who is thriving and who is at risk.' },
      { name: 'Pastoral Approval Gate',   desc: 'No AI-generated strategy reaches a member without passing through a pastor-controlled approval gate. The machine suggests. The shepherd decides.' },
    ],
  },
  {
    number: '02', colour: 'indigo', tag: 'PROPHETIC INTELLIGENCE LAYER',
    title: 'The Intelligence Engine', forLabel: 'Tech-forward Leaders / Executive Pastors',
    icon: <BrainCircuit size={18} />,
    quote: '"The AI knows your church by name. It was trained on your DNA."',
    features: [
      { name: 'ChurchGPT Companion',             desc: "Multi-modal AI trained on your church's denomination, doctrine, and cultural context. It answers as your church would." },
      { name: 'Sentiment Tracking',              desc: "SOAP journal sentiment engine. Crisis language in a member's prayer entries raises a silent Care Alert for pastoral review." },
      { name: '90-Day Transformation Journey',   desc: 'Guided devotion journey with automated progression, streak rewards, and Spiritual Milestone Ledger sync.' },
      { name: 'Streak Gamification',             desc: 'Members build streaks for devotion and attendance that feed their Engagement Score and appear on their Church Member Profile.' },
    ],
  },
  {
    number: '03', colour: 'amber', tag: 'OPERATIONAL BLUEPRINT',
    title: 'The Ministry Blueprint', forLabel: 'Department Leaders / Ministry Heads',
    icon: <Users size={18} />,
    quote: '"Every department, running on intelligence tuned to its own calling."',
    features: [
      { name: 'AI Growth Blueprints',      desc: 'Each ministry vertical receives tailored strategic recommendations built from its own department engagement data.' },
      { name: 'Pastoral Approval Gate',    desc: 'No Blueprint recommendation reaches a department without pastor review. Theological alignment enforced by design.' },
      { name: 'Skill & Resource Matching', desc: 'Member skills from intake forms are matched intelligently to ministry needs across departments.' },
      { name: 'Department Analytics',      desc: 'Attendance, volunteer hours, event engagement, and growth trajectory — comparative to prior months.' },
    ],
  },
  {
    number: '04', colour: 'emerald', tag: 'CELESTIAL ONBOARDING',
    title: 'The Sanctuary Gateway', forLabel: 'New Churches Joining the Platform',
    icon: <Zap size={18} />,
    quote: '"From registration to fully operational — before Sunday."',
    features: [
      { name: 'Church DNA Capture',        desc: '5-step wizard capturing theological identity, ministry structure, and communication voice before the platform is provisioned.' },
      { name: 'Auto-Provisioning',         desc: '14 Ministry Vertical workspaces, a seeded ChurchGPT model, and Global Registry profile created within minutes of onboarding completion.' },
      { name: 'Magic Link Onboarding',     desc: 'Secure time-limited Magic Links for first access. Entire leadership team onboarded from a phone in one service.' },
      { name: 'The Global Church Registry', desc: 'Verified profile in the Registry created automatically. Discoverable by members, donors, and the Church OS network globally.' },
    ],
  },
  {
    number: '05', colour: 'blue', tag: 'PLATFORM ENGINE',
    title: 'The Command Layer', forLabel: 'Denominational Bodies / Multi-church Operators',
    icon: <Globe size={18} />,
    quote: '"One platform. Every sanctuary. Total intelligence."',
    features: [
      { name: 'Global Registry Oversight', desc: 'Corporate-level visibility into all registered sanctuaries — engagement health, geographic distribution, and PIL model performance across the tenant network.' },
      { name: 'PIL Strategy Engine',       desc: 'Macro-level Prophetic Intelligence for denominations — denominational-wide spiritual trends and at-risk sanctuaries flagged before field leadership raises them.' },
      { name: 'Multi-Tenant Architecture', desc: 'Each church operates in a completely isolated data environment. No data crosses tenant boundaries.' },
      { name: 'Platform Health Pulse',     desc: 'Real-time uptime, AI accuracy, registry throughput, and global engagement metrics from the Corporate Console.' },
    ],
  },
];

const InteractiveArcs = () => {
  const [activeArc, setActiveArc] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 space-y-4">
          <Badge variant="indigo">Platform Capabilities</Badge>
          <h2
            className="text-4xl md:text-5xl font-black text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Intelligence Built for Every Layer.
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            A comprehensive, AI-orchestrated ecosystem designed to strengthen every layer of modern church life — from the secret place to the command centre.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {ARCS.map((arc, i) => (
            <div key={i} className={i === 4 ? 'lg:col-span-2' : ''}>
              <ArcCard
                arc={arc}
                isActive={activeArc === i}
                onToggle={() => setActiveArc(activeArc === i ? null : i)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 5 — FIVE PILLARS
// ════════════════════════════════════════════════════════════════════════════

const PILLARS = [
  {
    number: '01', colour: 'indigo' as PillarColour, tag: 'SPIRITUAL CORE',
    icon: <BookOpen size={20} />,
    title: 'Member Hub & Devotion Engine',
    desc: 'The spiritual Secret Place for every believer. Features ChurchGPT for context-aware theological inquiry, automated SOAP journaling with sentiment analysis, and bilingual scripture immersion.',
    features: ['ChurchGPT Companion', 'Sentiment Tracking', '90-Day Journey', 'Streak Gamification'],
  },
  {
    number: '02', colour: 'rose' as PillarColour, tag: 'ADMINISTRATIVE HEART',
    icon: <Shield size={20} />,
    title: 'Mission Control',
    desc: 'Powered by the Church OS intelligent assistant. Real-time engagement scoring (0–100), predictive Care Alerts (Red/Amber), and automated Victory Briefings. The shepherd sees the whole flock at once.',
    features: ['Engagement Radar', 'Proactive Care Alerts', 'Victory Briefings', 'PIL Oversight'],
  },
  {
    number: '03', colour: 'amber' as PillarColour, tag: 'OPERATIONAL BLUEPRINT',
    icon: <Users size={20} />,
    title: 'Ministry Leadership Dashboard',
    desc: 'Vertical-specific intelligence for department leads. AI-generated Growth Blueprints, a Pastoral Approval Gate for machine insights, and intelligent volunteer-to-ministry resource matching.',
    features: ['Growth Blueprints', 'Approval Gates', 'Skill Matching', 'Dept Analytics'],
  },
  {
    number: '04', colour: 'emerald' as PillarColour, tag: 'DIGITAL GATEWAY',
    icon: <Zap size={20} />,
    title: 'SaaS Onboarding & Growth Portal',
    desc: 'Frictionless provisioning with Theological DNA capture. Automated church setup, Day 1 Growth Strategies, and secure Magic Link onboarding for leadership teams — operational before Sunday.',
    features: ['DNA Capture', 'Auto-Provisioning', 'Magic Links', 'Global Registry'],
  },
  {
    number: '05', colour: 'blue' as PillarColour, tag: 'PLATFORM ENGINE',
    icon: <Globe size={20} />,
    title: 'Corporate Console',
    desc: 'Command-level orchestration for the platform. Global analytics, real-time health monitoring across all sanctuaries, and PIL engine oversight for Church OS PVT LTD and licensed denominational operators.',
    features: ['Global ROI', 'PIL Strategy', 'Multi-Tenant Ops', 'Health Pulse'],
  },
];

const FivePillars = () => {
  const [activePillar, setActivePillar] = useState(0);
  const active = PILLARS[activePillar];
  const ac = pillarColours[active.colour];

  return (
    <section className="py-24 md:py-32 border-t border-white/[.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 space-y-4">
          <Badge variant="slate">Platform Architecture</Badge>
          <h2
            className="text-4xl md:text-5xl font-black text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Five Pillars of Church OS.
          </h2>
        </div>

        {/* Desktop: stepper + detail panel */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12">
          {/* Stepper */}
          <div className="lg:col-span-4 space-y-2">
            {PILLARS.map((p, i) => {
              const isActive = activePillar === i;
              const c = pillarColours[p.colour];
              return (
                <button
                  key={i}
                  onClick={() => setActivePillar(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 ${isActive ? 'bg-white/[.04] border border-white/10' : 'hover:bg-white/[.02] border border-transparent'}`}
                >
                  <div className={`w-0.5 h-10 rounded-full shrink-0 transition-colors duration-200 ${isActive ? c.accent : 'bg-white/10'}`} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-600">{p.number}</p>
                    <p className={`text-sm font-black truncate transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400'}`}>{p.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-8 relative">
            <div
              className="absolute top-0 right-0 text-[200px] font-black leading-none select-none pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.025)', fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {active.number}
            </div>
            <div className="relative rounded-2xl border border-white/[.08] bg-white/[.02] p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${ac.bg}`}>
                  <span className={ac.text}>{active.icon}</span>
                </div>
                <div>
                  <span className={`block text-[9px] font-black uppercase tracking-[.2em] mb-0.5 ${ac.text}`}>{active.tag}</span>
                  <h3 className="text-2xl font-black text-white">{active.title}</h3>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-base">{active.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {active.features.map((feat, i) => (
                  <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${ac.border} ${ac.bg}`}>
                    <Check className={`h-3 w-3 shrink-0 ${ac.text}`} />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${ac.text}`}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <div className="lg:hidden space-y-4">
          {PILLARS.map((p, i) => {
            const c = pillarColours[p.colour];
            return (
              <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${c.bg}`}>
                    <span className={c.text}>{p.icon}</span>
                  </div>
                  <div>
                    <span className={`block text-[9px] font-black uppercase tracking-[.2em] mb-0.5 ${c.text}`}>{p.tag}</span>
                    <h4 className="text-lg font-black text-white">{p.title}</h4>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                <div className="grid grid-cols-2 gap-2">
                  {p.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <Check className={`h-3 w-3 shrink-0 ${c.text}`} />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — FEATURE INTELLIGENCE
// ════════════════════════════════════════════════════════════════════════════

const FeatureIntelligence = ({ healthMetrics }: { healthMetrics: any }) => {
  const router = useRouter();

  const metrics = [
    { label: 'Service Index',    value: healthMetrics?.service_index     ?? 77, color: 'bg-emerald-500' },
    { label: 'Prayer Index',     value: healthMetrics?.prayer_index      ?? 75, color: 'bg-indigo-500' },
    { label: 'Community Index',  value: healthMetrics?.community_index   ?? 68, color: 'bg-blue-500' },
    { label: 'Engagement',       value: healthMetrics?.engagement_index  ?? 50, color: 'bg-amber-500' },
    { label: 'Attendance',       value: healthMetrics?.attendance_index  ?? 12, color: 'bg-rose-500' },
  ];

  return (
    <section className="py-24 md:py-32 border-t border-white/[.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — text */}
          <div className="space-y-8">
            <Badge variant="indigo">Growth Intelligence</Badge>
            <h2
              className="text-4xl md:text-6xl font-black text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Built for <span className="text-indigo-400">Intelligent</span> Ministry.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Go beyond simple admin. Church OS provides a functional suite for membership management, AI sermon transcription, and deep demographic analytics.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-indigo-400" />
                </div>
                <h4 className="text-lg font-black text-white">Predictive AI</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Track engagement dips and pastoral needs before they happen.</p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                </div>
                <h4 className="text-lg font-black text-white">Growth Analytics</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Data-driven insights for location planting and outreach.</p>
              </div>
            </div>
            <Btn variant="outline" size="lg" onClick={() => router.push('/platform/walkthrough/')}>
              Software Walkthrough <ChevronRight className="ml-1 h-4 w-4" />
            </Btn>
          </div>

          {/* Right — live data card */}
          <div className="relative">
            <div className="absolute -inset-8 bg-indigo-500/[.05] blur-[120px] rounded-full pointer-events-none" />
            <div className="relative rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Live Intelligence · JKC</p>
                  <h3 className="text-xl font-black text-white mt-1">Congregation Vitality</h3>
                </div>
                <BarChart3 className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="space-y-4">
                {metrics.map((m, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                      <span className="text-sm font-black text-white">{m.value}</span>
                    </div>
                    <div className="h-1.5 bg-white/[.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* PIL Alert */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <Activity className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-300 leading-relaxed">
                  PIL Alert: Attendance index requires pastoral intervention — score 12/100.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 7 — FEATURED CHURCH
// ════════════════════════════════════════════════════════════════════════════

const FeaturedChurch = ({ jkc, featuredSermon }: { jkc: any; featuredSermon: any }) => {
  const router = useRouter();

  if (!jkc) {
    return (
      <section className="border-t border-white/[.06] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-white/[.03] animate-pulse h-72" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/[.06]">
      <div className="relative min-h-[520px] overflow-hidden">
        {jkc.cover_image_url && (
          <img
            src={jkc.cover_image_url}
            alt={jkc.name}
            className="absolute inset-0 w-full h-full object-cover opacity-[.18]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/92 to-[#0a1628]/60" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl space-y-6">
            <Badge variant="gold">
              <Award size={10} />
              Featured Church
            </Badge>
            <h2
              className="text-4xl md:text-6xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {jkc.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <MapPin size={14} /> {jkc.city}, {jkc.country}
              </span>
              {jkc.pastor_name && (
                <span className="text-slate-400">Led by {jkc.pastor_name}</span>
              )}
            </div>
            {jkc.description && (
              <p className="text-slate-400 leading-relaxed line-clamp-2 max-w-xl">{jkc.description}</p>
            )}

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
              {jkc.member_count && (
                <span className="px-4 py-2 rounded-full bg-white/[.05] border border-white/10 text-xs font-black text-white uppercase tracking-widest">
                  {jkc.member_count} Members
                </span>
              )}
              {jkc.ministry_count && (
                <span className="px-4 py-2 rounded-full bg-white/[.05] border border-white/10 text-xs font-black text-white uppercase tracking-widest">
                  {jkc.ministry_count} Ministries
                </span>
              )}
              {jkc.founding_year && (
                <span className="px-4 py-2 rounded-full bg-white/[.05] border border-white/10 text-xs font-black text-white uppercase tracking-widest">
                  Est. {jkc.founding_year}
                </span>
              )}
              {jkc.is_verified && (
                <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Verified
                </span>
              )}
            </div>

            {/* Latest sermon strip */}
            {featuredSermon && featuredSermon.youtube_url && (
              <div className="p-4 rounded-xl bg-white/[.04] border border-white/10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1">Latest Message</p>
                  <p className="text-sm font-black text-white truncate">{featuredSermon.title}</p>
                </div>
                <a href={featuredSermon.youtube_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Btn variant="primary" size="sm">Watch Now</Btn>
                </a>
              </div>
            )}

            <div className="pt-2">
              <Btn
                size="lg"
                variant="primary"
                onClick={() => router.push('/platform/church/japan-kingdom-church-tokyo/')}
              >
                View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 8 — REGISTRY PREVIEW GRID
// ════════════════════════════════════════════════════════════════════════════

const RegistryPreview = ({
  registryPreview,
  registryCount,
}: {
  registryPreview: any[];
  registryCount: number;
}) => {
  const router = useRouter();

  return (
    <section className="py-24 md:py-32 border-t border-white/[.06]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Badge variant="emerald">Global Registry</Badge>
            <h2
              className="text-4xl md:text-5xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              The Global Church Registry.
            </h2>
            <p className="text-slate-400 text-base">
              {registryCount.toLocaleString()} sanctuaries across 25 countries — and growing.
            </p>
          </div>
          <Btn variant="outline" onClick={() => router.push('/platform/registry/')}>
            Browse All <ArrowRight className="ml-2 h-4 w-4" />
          </Btn>
        </div>

        {/* Church cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {registryPreview.map((church: any, i: number) => (
            <button
              key={i}
              onClick={() => router.push(`/platform/church/${church.slug}/`)}
              className="text-left rounded-2xl border border-white/[.08] bg-white/[.02] p-6 hover:bg-white/[.04] hover:border-white/[.15] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${getAvatarColor(church.name)}`}>
                  {getInitials(church.name)}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {church.is_church_os_client && (
                    <span className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                      Church OS
                    </span>
                  )}
                  {church.is_verified && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors mb-1">
                {church.name}
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                <MapPin size={10} /> {church.city}, {church.country}
              </p>
              {(church.denomination || church.member_count) && (
                <p className="text-[11px] text-slate-600">
                  {church.denomination}
                  {church.denomination && church.member_count ? ' · ' : ''}
                  {church.member_count ? `${church.member_count.toLocaleString()} members` : ''}
                </p>
              )}
              {church.pastor_name && (
                <p className="text-[11px] text-slate-600 mt-1">Led by {church.pastor_name}</p>
              )}
              <div className="mt-5 pt-4 border-t border-white/[.05] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                <span>View Profile</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform text-slate-500" />
              </div>
            </button>
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-10">
          <Btn variant="outline" size="lg" onClick={() => router.push('/platform/registry/')}>
            View All {registryCount.toLocaleString()} Sanctuaries <ArrowRight className="ml-2 h-4 w-4" />
          </Btn>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 9 — PHILANTHROPY BRIDGE
// ════════════════════════════════════════════════════════════════════════════

const PhilanthropyBridge = () => {
  const router = useRouter();

  const transactions = [
    { region: 'Scandinavia',  target: "St. Peter's Global", amt: '$4,250',  type: 'Outreach Grant' },
    { region: 'Texas, USA',   target: 'Grace Sanctuary',    amt: '$1,800',  type: 'Emergency Aid' },
    { region: 'Singapore',    target: 'Zion Hill',          amt: '$12,000', type: 'Expansion Fund' },
  ];

  return (
    <section className="py-24 md:py-32 border-t border-white/[.06] bg-[#050d18]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left */}
          <div className="space-y-8">
            <Badge variant="emerald">Global Giving Network</Badge>
            <h2
              className="text-4xl md:text-6xl font-black text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              A Bridge for{' '}
              <span className="text-emerald-400">Global Assistance.</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Register your ministry to become part of a verified on-chain donation network. Connect with international assistance programs, global donors, and peer-to-peer spiritual aid.
            </p>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-xl h-fit shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-white">Verified Trust Status</h4>
                  <p className="text-sm text-slate-500 mt-1">On-chain verification builds instant credibility for international donors.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-xl h-fit shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-white">Zero-Friction Grants</h4>
                  <p className="text-sm text-slate-500 mt-1">Automated assistance programs for disaster relief and community expansion.</p>
                </div>
              </div>
            </div>
            {/* Fixed: emerald button on dark bg — confirmed in plan */}
            <Btn
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-white"
              onClick={() => {
                trackEvent({ event_type: 'philanthropy_click', page_path: '/platform/', cta_label: 'Become a Verified Beneficiary' });
                router.push('/platform/giving/');
              }}
            >
              Become a Verified Beneficiary
            </Btn>
          </div>

          {/* Right — Aid Network Live card */}
          <div className="relative">
            <div className="absolute -inset-6 bg-emerald-500/[.04] blur-[100px] rounded-full pointer-events-none" />
            <div className="relative rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Aid Network Live</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-1">Real-time Assistance</p>
                </div>
                <PulseDot />
              </div>
              <div className="space-y-3">
                {transactions.map((tx, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[.02] border border-white/[.05] hover:border-emerald-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
                        <HeartHandshake className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-500 truncate">{tx.region} → {tx.target}</p>
                        <p className="text-sm font-black text-white">{tx.type}</p>
                      </div>
                    </div>
                    <span className="text-lg font-mono font-black text-emerald-400 shrink-0 ml-3">{tx.amt}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/[.05] text-center">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">
                  Secured by Church OS Registry Ledger
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 10 — FOOTER
// ════════════════════════════════════════════════════════════════════════════

const Footer = () => {
  const router = useRouter();
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!nlEmail.trim()) return;
    setNlStatus('loading');
    const { error } = await supabase.from('public_inquiries').insert({
      first_name: 'Newsletter',
      last_name: 'Subscriber',
      email: nlEmail.trim(),
      visitor_intent: 'newsletter_signup',
      org_id: CHURCHOS_ORG_ID,
    });
    setNlStatus(error ? 'error' : 'done');
  };

  const FooterCol = ({
    heading,
    links,
  }: {
    heading: string;
    links: { label: string; path: string; external?: boolean }[];
  }) => (
    <div>
      <h4 className="text-[9px] font-black uppercase tracking-[.3em] text-slate-600 mb-6">{heading}</h4>
      <ul className="space-y-3">
        {links.map((link, i) => (
          <li key={i}>
            <button
              onClick={() => {
                if (link.external) window.open(link.path, '_blank', 'noopener,noreferrer');
                else router.push(link.path);
              }}
              className="text-sm font-bold text-slate-500 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-[#050d18] border-t border-white/[.06] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-10 mb-16">

          {/* Brand col — spans 2 */}
          <div className="col-span-2 space-y-6">
            <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-xl">
                <Church className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">ChurchOS</span>
            </button>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
              The world&apos;s most trusted infrastructure for faith communities. Empowering ministries through intelligence and transparency.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open('https://www.churchos-ai.website/', '_blank', 'noopener,noreferrer')}
                className="w-10 h-10 rounded-full bg-white/[.05] flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all"
                title="Church OS Website"
              >
                <Globe size={16} />
              </button>
              <button
                onClick={() => router.push('/platform/support/')}
                className="w-10 h-10 rounded-full bg-white/[.05] flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all"
                title="Support"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={() => {
                  trackEvent({ event_type: 'devotion_click', page_path: '/platform/' });
                  router.push('/welcome/devotion/');
                }}
                className="w-10 h-10 rounded-full bg-white/[.05] flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all"
                title="ChurchGPT"
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          <FooterCol heading="Registry" links={[
            { label: 'Find a Church',     path: '/platform/registry/' },
            { label: 'Verify Profile',    path: '/platform/register/?intent=claim' },
            { label: 'Leader Directory',  path: '/platform/registry/?filter=leaders' },
          ]} />

          <FooterCol heading="Ecosystem" links={[
            { label: 'Growth Engine',  path: '/platform/ai/' },
            { label: 'Philanthropy',   path: '/platform/philanthropy/' },
            { label: 'AI Insights',    path: '/platform/walkthrough/' },
          ]} />

          <FooterCol heading="Company" links={[
            { label: 'Our Mission', path: '/platform/about/' },
            { label: 'Partnering',  path: '/platform/partners/' },
            { label: 'Support Hub', path: '/platform/support/' },
          ]} />

          <FooterCol heading="Legal" links={[
            { label: 'Privacy',         path: '/platform/privacy/' },
            { label: 'Registry Terms',  path: '/platform/terms/' },
            { label: 'Audit Ledger',    path: '/platform/audit/' },
          ]} />

          {/* Newsletter */}
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[.3em] text-slate-600 mb-6">Newsletter</h4>
            {nlStatus === 'done' ? (
              <p className="text-emerald-400 font-bold text-sm">You&apos;re subscribed! 🎉</p>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  value={nlEmail}
                  onChange={e => setNlEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                  className="w-full h-11 px-4 rounded-xl bg-white/[.05] border border-white/10 text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-white/20 transition-colors"
                />
                <Btn
                  variant="primary"
                  className="w-full"
                  disabled={nlStatus === 'loading'}
                  onClick={handleSubscribe}
                >
                  {nlStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </Btn>
                {nlStatus === 'error' && (
                  <p className="text-rose-400 text-xs font-bold">Something went wrong — please try again.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-600">
            &copy; 2026 Church OS PVT LTD
          </p>
          <div className="flex gap-8">
            {[
              { label: 'Privacy',        path: '/platform/privacy/' },
              { label: 'Registry Terms', path: '/platform/terms/' },
              { label: 'Audit Ledger',   path: '/platform/audit/' },
            ].map((link, i) => (
              <button
                key={i}
                onClick={() => router.push(link.path)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const ChurchGPTTeaser = () => {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  
  return (
    <section className="py-24 md:py-32 border-t border-white/[.06]">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
        <div className="space-y-4">
          <Badge variant="indigo">Ask Church Intelligence Anything</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Your AI. Trained on your church's DNA.
          </h2>
          <p className="text-slate-400 text-lg">One question, free. No account needed.</p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if(!question.trim()) return;
          trackEvent({ event_type: 'cta_click', page_path: '/platform/', cta_label: 'ChurchGPT Teaser Ask' });
          router.push(`/churchgpt/?q=${encodeURIComponent(question)}`);
        }} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask anything — theology, growth, pastoral care..."
            className="flex-1 h-12 px-5 rounded-xl bg-white/[.04] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <Btn variant="primary" size="lg" className="shrink-0 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20" type="submit">
            Ask ChurchGPT →
          </Btn>
        </form>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE EXPORT
// ════════════════════════════════════════════════════════════════════════════

export default function PlatformPage() {
  const [jkc, setJkc] = useState<any>(null);
  const [registryCount, setRegistryCount] = useState<number>(784); // fallback to snapshot
  const [campaignTarget, setCampaignTarget] = useState<string>('2.3M'); // fallback
  const [featuredSermon, setFeaturedSermon] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [registryPreview, setRegistryPreview] = useState<any[]>([]);
  const [latestChurch, setLatestChurch] = useState<any>(null);

  useEffect(() => {
    const startTime = Date.now();
    trackEvent({ event_type: 'page_view', page_path: '/platform/' });
    return () => trackTimeOnPage('/platform/', startTime);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const [jkcRes, countRes, statRes, sermonRes, metricsRes, previewRes, latestRes] = await Promise.all([
        supabase
          .from('church_registry')
          .select('name,slug,city,country,denomination,member_count,ministry_count,founding_year,pastor_name,cover_image_url,description,mission_statement,is_verified,is_church_os_client,org_id')
          .eq('slug', 'japan-kingdom-church-tokyo')
          .single(),
        supabase
          .from('church_registry')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('platform_stats')
          .select('stat_value')
          .eq('stat_key', 'registry_campaign_target')
          .single(),
        supabase
          .from('public_sermons')
          .select('title,speaker,scripture,date,youtube_url')
          .eq('org_id', JKC_ORG_ID)
          .eq('is_featured', true)
          .not('youtube_url', 'is', null)
          .order('date', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('church_health_metrics')
          .select('score,attendance_index,engagement_index,service_index,prayer_index,community_index')
          .eq('org_id', JKC_ORG_ID)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('church_registry')
          .select('name,slug,city,country,denomination,member_count,is_verified,is_church_os_client,pastor_name,cover_image_url')
          .eq('is_active', true)
          .order('is_church_os_client', { ascending: false })
          .order('member_count', { ascending: false })
          .limit(6),
        supabase
          .from('church_registry')
          .select('name, country, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (jkcRes.data)                      setJkc(jkcRes.data);
      if (countRes.count !== null)          setRegistryCount(countRes.count);
      if (statRes.data?.stat_value)         setCampaignTarget(statRes.data.stat_value);
      if (sermonRes.data)                   setFeaturedSermon(sermonRes.data);
      if (metricsRes.data)                  setHealthMetrics(metricsRes.data);
      if (previewRes.data?.length)          setRegistryPreview(previewRes.data);
      if (latestRes.data)                   setLatestChurch(latestRes.data);
    };

    fetchAll();
  }, []);

  const tickerItems = [
    `📍 ${latestChurch?.name || 'A church'} just joined the registry`,
    `✉️ ${registryCount} sanctuaries now verified`,
    `🌍 25 countries in the Global Church Registry`,
    `🤝 New visit request received — Japan`,
    `📖 ChurchGPT active across ${registryCount} registered churches`,
    `⚡ PIL running on ${registryCount} sanctuary profiles`,
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <Navbar />
      <main>
        <Hero registryCount={registryCount} campaignTarget={campaignTarget} latestChurch={latestChurch} />
        <StatStrip registryCount={registryCount} />
        <div className="border-b border-white/[.06] bg-white/[.015] py-2.5 overflow-hidden whitespace-nowrap text-xs font-medium text-slate-400">
          <div className="inline-block animate-[scroll_30s_linear_infinite]">
            {tickerItems.map((item, i) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                <span className="mx-6 text-emerald-500 font-bold">·</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <InteractiveArcs />
        <FivePillars />
        <ChurchGPTTeaser />
        <FeatureIntelligence healthMetrics={healthMetrics} />
        <FeaturedChurch jkc={jkc} featuredSermon={featuredSermon} />
        <RegistryPreview registryPreview={registryPreview} registryCount={registryCount} />
        <PhilanthropyBridge />
      </main>
      <Footer />
    </div>
  );
}