'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Church, Menu, X, HeartHandshake, ArrowRight,
  Shield, Check, BookOpen, ChevronRight, Coins,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CHURCHOS_ORG_ID } from '@/lib/platform-constants';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => {
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

// ─── Intent → select option mapping ─────────────────────────────────────────
const INTENT_PARAM_MAP: Record<string, string> = {
  beneficiary: 'Apply for Assistance',
  donor:       'Become a Giving Partner',
};

const APPLICATION_TYPES = ['Apply for Assistance', 'Become a Giving Partner', 'General Inquiry'] as const;
type ApplicationType = typeof APPLICATION_TYPES[number];

const INTENT_INSERT_MAP: Record<ApplicationType, string> = {
  'Apply for Assistance':    'beneficiary_application',
  'Become a Giving Partner': 'donor_inquiry',
  'General Inquiry':         'general_inquiry',
};

// ─── Application Form ─────────────────────────────────────────────────────────
const ApplicationForm = ({ defaultType }: { defaultType: ApplicationType }) => {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [applicationType, setApplicationType] = useState<ApplicationType>(defaultType);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const input = 'w-full h-12 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/40 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contactName.trim() || !email.trim() || !description.trim()) return;
    setStatus('loading');
    const { error } = await supabase.from('public_inquiries').insert({
      first_name: orgName.trim(),
      last_name: contactName.trim(),
      email: email.trim(),
      message: `[${applicationType}] Country: ${country}. ${description.trim()}`,
      visitor_intent: INTENT_INSERT_MAP[applicationType],
      org_id: CHURCHOS_ORG_ID,
    });
    setStatus(error ? 'error' : 'done');
  };

  if (status === 'done') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h4 className="text-xl font-black text-white">Application Received.</h4>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">The Church OS Philanthropy team will follow up within 48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Church / Organisation Name <span className="text-rose-400">*</span></label>
          <input type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Your ministry name" className={input} />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Your Name <span className="text-rose-400">*</span></label>
          <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Pastor / Contact name" className={input} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Email <span className="text-rose-400">*</span></label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@ministry.org" className={input} />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Country</label>
          <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Where is your church?" className={input} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Application Type</label>
        <select value={applicationType} onChange={e => setApplicationType(e.target.value as ApplicationType)} className={`${input} appearance-none cursor-pointer`}>
          {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Description <span className="text-rose-400">*</span></label>
        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={5}
          placeholder="Describe your ministry and what you're applying for..."
          className="w-full px-4 py-3 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/40 transition-colors resize-none" />
      </div>
      {status === 'error' && <p className="text-rose-400 text-xs font-bold">Something went wrong. Please try again.</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none">
        {status === 'loading' ? 'Submitting...' : 'Submit Application →'}
      </button>
    </form>
  );
};

// ─── Giving Content (uses useSearchParams) ─────────────────────────────────
function GivingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentParam = searchParams.get('intent') ?? '';
  const defaultType = (INTENT_PARAM_MAP[intentParam] as ApplicationType) ?? 'General Inquiry';

  const programs = [
    { name: 'Emergency Aid Fund',       amount: 'Up to $5,000', desc: 'Crisis response for churches affected by natural disasters, political conflict, or sudden financial emergency.', colour: 'rose' },
    { name: 'Church Growth Grant',      amount: '$5,000–$50,000', desc: 'Funding for verified churches to expand facilities, plant new locations, or launch major community programmes.', colour: 'emerald' },
    { name: 'Missions Partnership Grant', amount: 'Variable',   desc: 'Pooled funding for verified international missions — connecting sending churches with field missionaries.', colour: 'indigo' },
    { name: 'Community Outreach Stipend', amount: 'Up to $1,500/mo', desc: 'Monthly recurring support for churches running verified food pantries, homeless outreach, or addiction recovery.', colour: 'amber' },
  ];

  const colBg: Record<string, string> = {
    rose: 'border-rose-500/20 bg-rose-500/[.03]', emerald: 'border-emerald-500/20 bg-emerald-500/[.03]',
    indigo: 'border-indigo-500/20 bg-indigo-500/[.03]', amber: 'border-amber-500/20 bg-amber-500/[.03]',
  };
  const colText: Record<string, string> = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20', emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const steps = [
    'Register your sanctuary in The Global Church Registry.',
    'Complete Verified Trust Status verification (documentation required).',
    'Submit a programme application with your ministry impact report.',
    'Church OS review team evaluates within 10 business days.',
    'Upon approval — funding flows through the on-chain trust ledger.',
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-emerald-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0a1628] to-[#0a1628]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/[.08] blur-[180px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">
              <HeartHandshake size={10} /> The Giving Bridge
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[.88]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Churches giving<br />to churches.
            </h1>
            <p className="text-xl text-emerald-300/80 leading-relaxed max-w-xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Because the mission is bigger than any one congregation.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">

        {/* Section 1 — The Vision */}
        <section className="max-w-3xl space-y-5">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            What Is The Giving Bridge?
          </h2>
          <p className="text-slate-400 leading-relaxed text-base">
            The Giving Bridge is a peer-to-peer verified ministry funding network built into the Church OS platform. Unlike generic crowdfunding, every beneficiary is verified through Church OS&apos;s on-chain trust layer before they can receive funds. Donors know exactly where every dollar goes. Recipients receive structured assistance linked to measurable ministry outcomes.
          </p>
          <p className="text-slate-400 leading-relaxed text-base">
            The Giving Bridge is not a charity. It is an infrastructure layer — a secure, transparent network that connects the global body of Christ with the financial tools to accomplish the mission at scale. Whether a church needs emergency support or wants to sponsor a global missionary partnership, The Giving Bridge is the route.
          </p>
        </section>

        {/* Section 2 — Four Programs */}
        <section className="space-y-8">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Four Assistance Programmes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((p, i) => (
              <div key={i} className={`rounded-2xl border p-7 space-y-4 ${colBg[p.colour]}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-white">{p.name}</h3>
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shrink-0 ${colText[p.colour]}`}>
                    {p.amount}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — How To Apply */}
        <section className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">Beneficiary Path</span>
              <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>How to Apply</h2>
            </div>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm font-black text-emerald-400 shrink-0">{i + 1}</div>
                    {i < steps.length - 1 && <div className="w-px flex-1 bg-white/[.06] my-1" />}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed pt-2 pb-6">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 — How To Give */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px] font-black uppercase tracking-[.14em] text-amber-400">Donor Path</span>
              <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>How to Give</h2>
            </div>
            <div className="space-y-5">
              {[
                { icon: <Coins size={18} />, text: 'Any verified Church OS client can allocate a percentage of their digital giving to The Giving Bridge pool.' },
                { icon: <ChevronRight size={18} />, text: 'Choose to give to a specific church, a specific programme category, or the general emergency fund.' },
                { icon: <BookOpen size={18} />, text: 'Receive quarterly impact reports showing where giving landed and the outcomes produced.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/[.06] bg-white/[.02]">
                  <div className="text-amber-400 shrink-0 mt-0.5">{item.icon}</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/platform/register/?intent=church')}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 h-12 rounded-xl transition-colors shadow-lg shadow-amber-500/20 text-sm">
              Register My Church <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* Section 5 — Application Form */}
        <section id="apply">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">Apply Now</span>
              <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Submit Your Application</h2>
              <p className="text-slate-400 leading-relaxed text-sm">All applications are reviewed by the Church OS Philanthropy team within 10 business days. You will receive a confirmation email upon submission.</p>
              <div className="p-5 rounded-2xl border border-white/[.08] bg-white/[.02] space-y-3">
                {[
                  'All applicants must be registered in the Global Church Registry',
                  'Verified Trust Status required for grant amounts over $1,000',
                  'Ministry impact report required for Growth Grants',
                ].map((r, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-400">
                    <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> {r}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-8">
              <ApplicationForm defaultType={defaultType} />
            </div>
          </div>
        </section>
      </div>

      {/* Section 6 — Trust Statement */}
      <div className="border-t border-white/[.06] bg-[#050d18] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <Shield className="h-8 w-8 text-emerald-400 mx-auto" />
          <blockquote className="text-base text-slate-400 leading-relaxed italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            &ldquo;The Giving Bridge operates on Church OS&apos;s Sacred Data Architecture. Every transaction is recorded in the Spiritual Milestone Ledger — immutable, transparent, and auditable by any registered church at any time.&rdquo;
          </blockquote>
          <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-600">&copy; 2026 Church OS PVT LTD</p>
        </div>
      </div>
    </div>
  );
}

export default function GivingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><p className="text-slate-400 font-bold animate-pulse">Loading...</p></div>}>
      <GivingContent />
    </Suspense>
  );
}
