'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Church, Menu, X, Shield, Users, BrainCircuit, ArrowRight, Globe } from 'lucide-react';

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

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      icon: <Shield size={24} />, colour: 'emerald',
      title: 'Sacred Data Architecture',
      desc: 'Member data is never shared across tenant boundaries, never sold, and never used to train external models. Every church operates in a completely isolated data environment. What happens in your sanctuary stays in your sanctuary.',
    },
    {
      icon: <Users size={24} />, colour: 'indigo',
      title: 'Shepherds Before Systems',
      desc: 'Every AI-generated action requires explicit pastoral approval before reaching a member. The Prophetic Intelligence Layer suggests. The Pastoral Approval Gate decides. Technology serves the shepherd — not the other way around.',
    },
    {
      icon: <BrainCircuit size={24} />, colour: 'amber',
      title: 'Intelligence in Service of Grace',
      desc: 'The PIL exists to help pastors be more present, not to replace pastoral judgement. Church intelligence is a tool of grace — freeing leaders from administrative burden so they can do what they were called to do.',
    },
  ];

  const colmap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  };

  const stats = [
    { v: '784', l: 'Sanctuaries' }, { v: '25', l: 'Countries' },
    { v: '14', l: 'Ministry Verticals' }, { v: '92%', l: 'PIL Accuracy' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-500/[.05] blur-[180px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">Our Mission</span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter max-w-3xl leading-[.88]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            The Digital Nervous System for the Global Church.
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-24">

        {/* The Vision */}
        <section className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Vision</h2>
            <p className="text-slate-400 leading-relaxed">Church OS is building the world&apos;s most trusted infrastructure for faith communities. Not a management system. Not a CRM. An intelligent operating platform that understands the unique rhythms of pastoral ministry and amplifies a shepherd&apos;s capacity to care, lead, and grow.</p>
            <p className="text-slate-400 leading-relaxed">The global church is fragmented. Thousands of denominations operate in isolation, with no shared infrastructure, no accountability layer, and no intelligence beyond what an overworked administrator can manually generate. Church OS changes that.</p>
          </div>
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Company</h2>
            <p className="text-slate-400 leading-relaxed">Church OS PVT LTD is an independent SaaS company founded by <strong className="text-white font-black">Shadreck Kudzanai Musarurwa</strong>. Operating globally, with our primary live tenant at Japan Kingdom Church (JKC) in Tokyo, Japan.</p>
            <p className="text-slate-400 leading-relaxed">The company is privately held and mission-driven. Growth is measured not by DAU metrics, but by the number of shepherd hours returned to pastoral care rather than administrative burden.</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe size={14} /> <span>Headquartered globally · Primary tenant: Tokyo, Japan</span>
            </div>
          </div>
        </section>

        {/* The Platform Story */}
        <section className="rounded-3xl border border-white/[.08] bg-white/[.02] p-10 space-y-6">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Platform Story</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Where It Started</span>
              <p className="text-slate-400 leading-relaxed">It started at Japan Kingdom Church, Tokyo, in 2024. A multicultural, multilingual congregation navigating the complexity of pastoral care across cultural barriers, languages, and time zones. The tools available were built for Western megachurches — not for a 350-member bilingual community in East Asia.</p>
              <p className="text-slate-400 leading-relaxed">What began as a custom solution for JKC is now a platform designed for every church, every denomination, on every continent.</p>
            </div>
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">Where It&apos;s Going</span>
              <p className="text-slate-400 leading-relaxed">The goal is the Global Church Registry reaching 2.3 million verified sanctuaries — every denomination, every continent represented. The Giving Bridge connecting verified churches with global resources. The Prophetic Intelligence Layer helping every pastor lead with data and discernment simultaneously.</p>
              <p className="text-slate-400 leading-relaxed">Church OS is not just a product. It is the infrastructure layer for the next era of global ministry.</p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="space-y-8">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => {
              const c = colmap[v.colour];
              return (
                <div key={i} className={`rounded-2xl border p-8 space-y-5 ${c.border} ${c.bg}/30`}>
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>{v.icon}</div>
                  <h3 className="text-lg font-black text-white">{v.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Impact numbers */}
        <section className="border-y border-white/[.06] py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-4xl font-black text-white">{s.v}</p>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-6 pb-8">
          <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Join the Mission.</h2>
          <button onClick={() => router.push('/platform/register/')}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 h-14 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-base">
            Get Started <ArrowRight size={18} />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-700 mt-8">&copy; 2026 Church OS PVT LTD</p>
        </section>
      </div>
    </div>
  );
}
