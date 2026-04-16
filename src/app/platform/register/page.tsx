'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Church, Users, Globe, Search, ArrowRight, HeartHandshake, Shield,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// ─── Pathway Config ───────────────────────────────────────────────────────────
const PATHWAYS = [
  {
    intent: 'church',
    tag: 'REGISTER YOUR SANCTUARY',
    icon: <Church size={24} />,
    colour: 'emerald',
    title: 'I lead a church or ministry',
    desc: 'Claim or create your verified church profile. Begin the 5-step Celestial Onboarding Process and join The Global Church Registry.',
    badge: 'Verification Required · Typically 2–5 days',
    cta: 'Begin Church Registration',
    onClick: (router: ReturnType<typeof useRouter>) => {
      trackEvent({ event_type: 'register_pathway_click', page_path: '/platform/register/', cta_label: 'Register Sanctuary' });
      router.push('/onboarding/');
    },
  },
  {
    intent: 'member',
    tag: 'JOIN AS A MEMBER',
    icon: <Users size={24} />,
    colour: 'indigo',
    title: "I'm a church member",
    desc: "Find your church and access The Secret Place — devotionals, ChurchGPT, your Spiritual Milestone Ledger, and community connection.",
    badge: 'Free · Instant Access',
    cta: 'Create Member Profile',
    onClick: (router: ReturnType<typeof useRouter>) => {
      trackEvent({ event_type: 'register_pathway_click', page_path: '/platform/register/', cta_label: 'Join as Member' });
      router.push('/onboarding/signup/');
    },
  },
  {
    intent: 'giving',
    tag: 'JOIN THE GIVING BRIDGE',
    icon: <HeartHandshake size={24} />,
    colour: 'amber',
    title: 'I want to give or support',
    desc: 'Connect your organisation with verified ministries globally. Become a donor, apply for assistance, or sponsor a church plant.',
    badge: 'Verified · On-Chain Transparency',
    cta: 'Explore The Giving Bridge',
    onClick: (router: ReturnType<typeof useRouter>) => {
      trackEvent({ event_type: 'register_pathway_click', page_path: '/platform/register/', cta_label: 'Giving Bridge' });
      router.push('/platform/giving/');
    },
  },
  {
    intent: 'explore',
    tag: 'BROWSE THE REGISTRY',
    icon: <Search size={24} />,
    colour: 'blue',
    title: "I'm just exploring",
    desc: 'No account needed. Browse 784 verified sanctuaries, find churches near you, and see the global reach of the Church OS network.',
    badge: 'Public Access · No account required',
    cta: 'Open The Global Church Registry',
    onClick: (router: ReturnType<typeof useRouter>) => {
      trackEvent({ event_type: 'register_pathway_click', page_path: '/platform/register/', cta_label: 'Browse Registry' });
      router.push('/platform/registry/');
    },
  },
] as const;

type PathwayColour = 'emerald' | 'indigo' | 'amber' | 'blue';

const colourMap: Record<PathwayColour, {
  border: string; iconBg: string; iconText: string; tag: string; badge: string; btn: string; glow: string;
}> = {
  emerald: {
    border:    'border-emerald-500/30 bg-emerald-500/[.03]',
    iconBg:    'bg-emerald-500/10',
    iconText:  'text-emerald-400',
    tag:       'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    badge:     'text-emerald-400/70 border-emerald-500/15 bg-emerald-500/[.06]',
    btn:       'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20',
    glow:      'ring-2 ring-emerald-500/40',
  },
  indigo: {
    border:    'border-indigo-500/30 bg-indigo-500/[.03]',
    iconBg:    'bg-indigo-500/10',
    iconText:  'text-indigo-400',
    tag:       'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    badge:     'text-indigo-400/70 border-indigo-500/15 bg-indigo-500/[.06]',
    btn:       'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    glow:      'ring-2 ring-indigo-500/40',
  },
  amber: {
    border:    'border-amber-500/30 bg-amber-500/[.03]',
    iconBg:    'bg-amber-500/10',
    iconText:  'text-amber-400',
    tag:       'text-amber-400 border-amber-500/20 bg-amber-500/10',
    badge:     'text-amber-400/70 border-amber-500/15 bg-amber-500/[.06]',
    btn:       'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20',
    glow:      'ring-2 ring-amber-500/40',
  },
  blue: {
    border:    'border-blue-500/30 bg-blue-500/[.03]',
    iconBg:    'bg-blue-500/10',
    iconText:  'text-blue-400',
    tag:       'text-blue-400 border-blue-500/20 bg-blue-500/10',
    badge:     'text-blue-400/70 border-blue-500/15 bg-blue-500/[.06]',
    btn:       'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    glow:      'ring-2 ring-blue-500/40',
  },
};

// ─── Register Content ─────────────────────────────────────────────────────────
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentParam = searchParams.get('intent') ?? '';

  // Map claim → church so claim intent highlights the church card
  const activeIntent = intentParam === 'claim' ? 'church' : intentParam;

  React.useEffect(() => {
    trackEvent({ event_type: 'page_view', page_path: '/platform/register/' });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-500/[.05] blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/[.05] blur-[160px] rounded-full" />
        <div className="absolute inset-0 opacity-[.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 max-w-6xl mx-auto w-full">
          <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
              <Church className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">Church<span className="text-emerald-400">OS</span></span>
          </button>
          <button onClick={() => router.push('/platform/')} className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowRight size={14} className="rotate-180" /> Back
          </button>
        </div>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-4xl w-full mx-auto space-y-12">

            {/* Heading */}
            <div className="text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-300">
                <Globe size={10} /> Join the Global Sanctuary
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                How do you want to join?
              </h1>
              <p className="text-slate-400 text-base max-w-lg mx-auto">
                Choose your path. Each one is built for where you are right now.
              </p>
            </div>

            {/* Pathway cards */}
            <div className="grid md:grid-cols-2 gap-5">
              {PATHWAYS.map((pathway) => {
                const c = colourMap[pathway.colour as PathwayColour];
                const isHighlighted = activeIntent === pathway.intent;
                return (
                  <div
                    key={pathway.intent}
                    className={`rounded-2xl border p-8 space-y-6 transition-all duration-300 ${c.border} ${isHighlighted ? c.glow : ''}`}
                  >
                    {/* Tag */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[.2em] ${c.tag}`}>
                      {pathway.tag}
                    </span>

                    {/* Icon + title */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${c.iconBg} ${c.iconText} shrink-0`}>
                        {pathway.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white leading-tight">{pathway.title}</h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed">{pathway.desc}</p>

                    {/* Badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-bold ${c.badge}`}>
                      {pathway.badge}
                    </span>

                    {/* CTA */}
                    <button
                      onClick={() => pathway.onClick(router)}
                      className={`w-full h-12 rounded-xl font-bold transition-all text-sm ${c.btn}`}
                    >
                      {pathway.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sign in link */}
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button onClick={() => router.push('/platform/login/')} className="font-black text-white hover:text-emerald-400 transition-colors">
                Sign In &rarr;
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-slate-400 font-bold animate-pulse">Loading...</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
