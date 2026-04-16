'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Church, Menu, X } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = [
    { label: 'Global Registry', path: '/platform/registry/' }, { label: 'AI Growth Engine', path: '/platform/ai/' },
    { label: 'Philanthropy', path: '/platform/philanthropy/' }, { label: 'Devotion', path: '/welcome/devotion/' },
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
          <hr className="border-white/10" /><button onClick={() => { router.push('/platform/register/'); setMobileOpen(false); }} className="bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl">Get Started</button>
        </div>
      )}
    </nav>
  );
};

// ─── Legal section ────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'overview', title: '1. Overview',
    body: 'Church OS PVT LTD (&ldquo;Church OS&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is committed to protecting the privacy of every church, pastor, and member that uses the platform. This Privacy Policy describes how we collect, use, and protect information across all Church OS surfaces — the public platform, the member portal, Mission Control, and the Global Church Registry.',
  },
  {
    id: 'collect', title: '2. Data We Collect',
    body: 'We collect information that you explicitly provide to us. This includes: member profiles (name, email, phone, address), devotion journal entries and SOAP reflections, attendance records, giving and stewardship records, prayer requests submitted through the platform, and church registry information submitted during onboarding. We do not collect data through advertising networks, third-party trackers, or behavioural profiling tools.',
  },
  {
    id: 'use', title: '3. How We Use Data',
    body: 'Your data is used exclusively to power the Church OS platform and its features — including the Prophetic Intelligence Layer (PIL), pastoral Victory Briefings, ministry engagement analytics, and the Giving Bridge. Your data is never used for advertising purposes, never sold to third parties, and never shared outside of your church&apos;s tenant environment without your explicit consent.',
  },
  {
    id: 'sacred', title: '4. Sacred Data Architecture',
    body: 'Church OS is built on a Sacred Data Architecture principle: no data crosses tenant boundaries. A denomination running 200 churches on Church OS sees consolidated, anonymised analytics only — individual member data is never shared across organisations. Each church is a fully isolated data environment. This is not a configuration option. It is enforced at the database level.',
  },
  {
    id: 'japan', title: '5. Japan Data Law Compliance',
    body: 'Church OS processes personal data for its primary tenant (Japan Kingdom Church) in accordance with Japan&apos;s Act on the Protection of Personal Information (APPI). Users in Japan have the right to request disclosure, correction, suspension of use, and deletion of their personal data. To exercise these rights, contact privacy@churchos.ai with your request.',
  },
  {
    id: 'gdpr', title: '6. GDPR Notes',
    body: 'For users in the European Economic Area (EEA), Church OS acts as a data processor. The church organisation that has contracted Church OS is the data controller. Data subject rights under GDPR — including the right to access, rectification, erasure, restriction, portability, and objection — are the responsibility of the data controller (your church). Church OS will cooperate fully with lawful data subject requests communicated through your church administrator.',
  },
  {
    id: 'retention', title: '7. Data Retention',
    body: 'Member and church data is retained for the duration of the church&apos;s active Church OS subscription. Upon subscription termination or church account deletion, all associated personal data is purged within 90 days unless a longer retention period is required by applicable law. Anonymised aggregate analytics data may be retained for platform improvement purposes.',
  },
  {
    id: 'contact', title: '8. Contact',
    body: 'For privacy enquiries, data subject requests, or concerns about how Church OS handles your information, contact us at privacy@churchos.ai. We aim to respond to all privacy requests within 10 business days.',
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />
      <div className="pt-24 pb-24">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-12 border-b border-white/[.06]">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-400 mb-4">Legal</span>
          <h1 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Privacy Policy</h1>
          <p className="text-slate-400 mt-3 text-sm">Church OS PVT LTD · Last updated: April 2026</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-4 gap-12 items-start">

            {/* Sticky nav — desktop */}
            <div className="hidden lg:block lg:col-span-1 sticky top-24">
              <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 space-y-1">
                {SECTIONS.map(s => (
                  <a key={s.id} href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className={`block px-3 py-2 rounded-xl text-xs font-bold transition-colors ${activeSection === s.id ? 'bg-white/[.06] text-white' : 'text-slate-500 hover:text-white hover:bg-white/[.03]'}`}>
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 space-y-10">
              {SECTIONS.map(s => (
                <div key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl font-black text-white">{s.title}</h2>
                  <p className="text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
                </div>
              ))}
              <div className="pt-8 border-t border-white/[.06]">
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-600">&copy; 2026 Church OS PVT LTD · privacy@churchos.ai</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
