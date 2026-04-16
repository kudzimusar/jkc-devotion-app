'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Church, Shield, Users, Globe, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const PORTALS = [
  {
    icon: <Shield size={22} />,
    colour: 'emerald',
    forLabel: 'FOR CHURCH LEADERS & PASTORS',
    desc: 'Access Mission Control, manage your congregation, and view your church\'s intelligence dashboard.',
    cta: 'Sign In as Church Leader',
    path: '/shepherd/dashboard/',
  },
  {
    icon: <Users size={22} />,
    colour: 'indigo',
    forLabel: 'FOR CHURCH MEMBERS',
    desc: 'Access The Secret Place, your devotion journal, ChurchGPT, and your Spiritual Milestone Ledger.',
    cta: 'Sign In as Member',
    path: '/onboarding/signup/',
  },
  {
    icon: <Globe size={22} />,
    colour: 'blue',
    forLabel: 'FOR CHURCH OS ADMINISTRATORS',
    desc: 'Access Mission Control corporate view, tenant management, and platform analytics.',
    cta: 'Sign In as Administrator',
    path: '/corporate/login/',
  },
] as const;

type PortalColour = 'emerald' | 'indigo' | 'blue';

const cMap: Record<PortalColour, { card: string; iconBg: string; iconText: string; tag: string; btn: string; }> = {
  emerald: {
    card:     'border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-500/[.03]',
    iconBg:   'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    tag:      'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    btn:      'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20',
  },
  indigo: {
    card:     'border-indigo-500/25 hover:border-indigo-500/40 hover:bg-indigo-500/[.03]',
    iconBg:   'bg-indigo-500/10',
    iconText: 'text-indigo-400',
    tag:      'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    btn:      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
  },
  blue: {
    card:     'border-blue-500/25 hover:border-blue-500/40 hover:bg-blue-500/[.03]',
    iconBg:   'bg-blue-500/10',
    iconText: 'text-blue-400',
    tag:      'text-blue-400 border-blue-500/20 bg-blue-500/10',
    btn:      'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
  },
};

export default function LoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    trackEvent({ event_type: 'page_view', page_path: '/platform/login/' });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[.05] blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/[.04] blur-[140px] rounded-full" />
        <div className="absolute inset-0 opacity-[.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 max-w-2xl mx-auto w-full">
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
          <div className="max-w-lg w-full mx-auto space-y-10">

            {/* Heading */}
            <div className="text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-300">
                Secure Access
              </span>
              <h1 className="text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Welcome back to Church OS.
              </h1>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Select the right access portal for your role.
              </p>
            </div>

            {/* Portal cards — vertical stack */}
            <div className="space-y-4">
              {PORTALS.map((portal) => {
                const c = cMap[portal.colour as PortalColour];
                return (
                  <div key={portal.path} className={`rounded-2xl border bg-white/[.02] p-6 space-y-4 transition-all duration-200 ${c.card}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${c.iconBg} ${c.iconText} shrink-0`}>
                        {portal.icon}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[.18em] ${c.tag}`}>
                        {portal.forLabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{portal.desc}</p>
                    <button
                      onClick={() => {
                        let cta_label = 'Admin Login';
                        if (portal.forLabel.includes('LEADER')) cta_label = 'Church Leader Login';
                        else if (portal.forLabel.includes('MEMBER')) cta_label = 'Member Login';
                        trackEvent({ event_type: 'login_portal_click', page_path: '/platform/login/', cta_label });
                        router.push(portal.path);
                      }}
                      className={`w-full h-11 rounded-xl font-bold transition-all text-sm ${c.btn}`}
                    >
                      {portal.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button onClick={() => router.push('/platform/register/')} className="font-black text-white hover:text-emerald-400 transition-colors">
                Get Started &rarr;
              </button>
            </p>

          </div>
        </main>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-700">
            &copy; 2026 Church OS PVT LTD
          </p>
        </div>
      </div>
    </div>
  );
}
