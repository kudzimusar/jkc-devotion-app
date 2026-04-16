'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Church, Menu, X, Check, ArrowRight, BookOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CHURCHOS_ORG_ID } from '@/lib/platform-constants';

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

// ─── Mock transaction data ────────────────────────────────────────────────────
const TRANSACTIONS = [
  { ref: 'TXN-0044', from: "New Life Assembly, USA",     to: "St. Peter's Global, Kenya",    amt: '$4,250',  program: 'Outreach Grant',    date: 'Mar 2026' },
  { ref: 'TXN-0043', from: 'Grace Baptist, Canada',      to: 'Zion Hill Sanctuary, Nigeria', amt: '$12,500', program: 'Expansion Fund',    date: 'Mar 2026' },
  { ref: 'TXN-0042', from: 'Aid-Grant-Pool',             to: 'Hope Centre, Zimbabwe',        amt: '$5,000',  program: 'Emergency Aid',     date: 'Feb 2026' },
  { ref: 'TXN-0041', from: 'Kingdom Harvest, UK',        to: 'Calvary Mission, Uganda',      amt: '$1,500',  program: 'Outreach Stipend',  date: 'Feb 2026' },
  { ref: 'TXN-0040', from: 'Dayspring Church, Australia', to: 'Refuge Ministries, Ethiopia', amt: '$3,200',  program: 'Missions Grant',    date: 'Jan 2026' },
];

const ROLES = ['Media', 'Government', 'NGO / Charity', 'Academic Research', 'Donor Due Diligence', 'Other'] as const;
type Role = typeof ROLES[number];

// ─── Audit Request Form ───────────────────────────────────────────────────────
const AuditRequestForm = () => {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Media');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const input = 'w-full h-12 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-amber-500/40 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contactName.trim() || !email.trim() || !message.trim()) return;
    setStatus('loading');
    const { error } = await supabase.from('public_inquiries').insert({
      first_name: orgName.trim(),
      last_name: contactName.trim(),
      email: email.trim(),
      message: `[Audit Request] Role: ${role}. ${message.trim()}`,
      visitor_intent: 'audit_request',
      org_id: CHURCHOS_ORG_ID,
    });
    setStatus(error ? 'error' : 'done');
  };

  if (status === 'done') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-amber-400" />
        </div>
        <h4 className="text-xl font-black text-white">Audit Request Received.</h4>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">We will respond within 5 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Organisation Name <span className="text-rose-400">*</span></label>
          <input type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="The Guardian, USAID, etc." className={input} />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Contact Name <span className="text-rose-400">*</span></label>
          <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Your name" className={input} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Email <span className="text-rose-400">*</span></label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@organisation.org" className={input} />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Role / Purpose</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)} className={`${input} appearance-none cursor-pointer`}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Message <span className="text-rose-400">*</span></label>
        <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4}
          placeholder="Describe what you need the audit report for and what period it should cover..."
          className="w-full px-4 py-3 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-amber-500/40 transition-colors resize-none" />
      </div>
      {status === 'error' && <p className="text-rose-400 text-xs font-bold">Something went wrong. Please try again.</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none">
        {status === 'loading' ? 'Submitting...' : 'Request Audit Report →'}
      </button>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[.05] blur-[180px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px] font-black uppercase tracking-[.14em] text-amber-400">
            <BookOpen size={10} /> Public Ledger
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter max-w-3xl leading-[.88]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            The Giving Bridge Audit Ledger.
          </h1>
          <p className="text-lg text-slate-400 max-w-xl">Every transaction. Fully transparent. Permanently recorded.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-20">

        {/* Explanation */}
        <section className="max-w-3xl space-y-5">
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>About This Ledger</h2>
          <p className="text-slate-400 leading-relaxed">
            The Audit Ledger is the public-facing record of all approved Giving Bridge transactions. It is designed to give donors, partner organisations, governments, and the general public full visibility into how funds move through the Church OS network. Every entry is timestamped and immutable.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Transparency is not optional at Church OS. The Giving Bridge is built on the premise that verified, public accountability unlocks greater global generosity. When donors know exactly where funds land — and can see the outcomes — trust compounds. The Audit Ledger is that accountability layer.
          </p>
        </section>

        {/* Transaction table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Transaction Ledger</h2>
            <button onClick={() => router.push('/platform/philanthropy/')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              Giving Bridge Overview <ArrowRight size={14} />
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-white/[.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[.06] bg-white/[.03]">
                  {['Ref', 'From', 'To', 'Amount', 'Programme', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-[.2em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.04]">
                {TRANSACTIONS.map((tx, i) => (
                  <tr key={i} className="hover:bg-white/[.02] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500 font-bold">{tx.ref}</td>
                    <td className="px-5 py-4 text-slate-300 font-medium text-xs">{tx.from}</td>
                    <td className="px-5 py-4 text-slate-300 font-medium text-xs">{tx.to}</td>
                    <td className="px-5 py-4 font-mono font-black text-emerald-400 text-sm">{tx.amt}</td>
                    <td className="px-5 py-4 text-xs text-slate-400">{tx.program}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                        <Check size={9} /> Verified
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {TRANSACTIONS.map((tx, i) => (
              <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500 font-bold">{tx.ref}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider"><Check size={8} /> Verified</span>
                </div>
                <div className="text-xs text-slate-400"><span className="text-slate-600">From: </span>{tx.from}</div>
                <div className="text-xs text-slate-400"><span className="text-slate-600">To: </span>{tx.to}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-emerald-400 text-base">{tx.amt}</span>
                  <span className="text-xs text-slate-500">{tx.program} · {tx.date}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-600 font-medium text-center pt-2">
            This ledger is updated as transactions are approved. Full on-chain records launch Q3 2026.
          </p>
        </section>

        {/* Request Full Audit form */}
        <section className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px] font-black uppercase tracking-[.14em] text-amber-400">For Media · Governments · NGOs</span>
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Request Full Audit Report</h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              For media organisations, government bodies, NGOs, and donors requiring a comprehensive transaction audit, submit a request below. A full audit report includes transaction metadata, beneficiary verification records, and outcome reports for all approved grants.
            </p>
            <p className="text-slate-400 leading-relaxed text-sm">
              All audit requests are reviewed by Church OS PVT LTD leadership. We aim to respond within 5 business days. Sensitive beneficiary information is redacted in public audit reports in accordance with our Privacy Policy.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-8">
            <AuditRequestForm />
          </div>
        </section>

      </div>

      <div className="border-t border-white/[.06] bg-[#050d18] py-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-700">&copy; 2026 Church OS PVT LTD · audit@churchos.ai</p>
      </div>
    </div>
  );
}
