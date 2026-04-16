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

const SECTIONS = [
  {
    id: 'what', title: '1. What the Registry Is',
    body: 'The Global Church Registry (&ldquo;the Registry&rdquo;) is a public directory of verified Christian sanctuaries operated by Church OS PVT LTD. It serves as the foundational layer of the Church OS network — providing transparent, searchable profiles for registered and verified faith communities worldwide.',
  },
  {
    id: 'who', title: '2. Who Can Register',
    body: 'Any active Christian church, ministry, or faith-based organisation may apply for a Registry listing. Registration is free. A basic listing requires only a church name, location, and pastoral contact. Verified Trust Status — required for participation in The Giving Bridge — requires additional documentation.',
  },
  {
    id: 'verification', title: '3. Verification Requirements',
    body: 'Verified status requires: proof of incorporation, registration, or active pastoral leadership; a confirmed ministry address; and evidence of active ministry activity (website, social presence, or documented community engagement). Church OS reserves the right to reject or remove listings that do not meet these standards, that contain inaccurate information, or whose ministry activities are inconsistent with the values of the Church OS network.',
  },
  {
    id: 'acceptable', title: '4. Acceptable Use',
    body: 'Registry listings may not be used to solicit donations outside of The Giving Bridge programme. Contact details visible in the Registry may not be scraped, harvested, or used for unsolicited outreach, bulk emailing, or spam of any kind. Any organisation found to be misusing Registry data will have their listing removed and their access to the Church OS network suspended.',
  },
  {
    id: 'ip', title: '5. Intellectual Property',
    body: 'Church names, logos, descriptions, and content submitted to the Registry remain the intellectual property of the respective churches and ministries. By submitting information to the Registry, you grant Church OS PVT LTD a non-exclusive, royalty-free licence to display and index this information within the platform. You may request removal or modification of your listing at any time.',
  },
  {
    id: 'termination', title: '6. Termination',
    body: 'Church OS may remove a Registry listing for: violation of these terms, submission of fraudulent or misleading information, ministry activities that are harmful or illegal, or at the direct request of the church or ministry itself. Churches removed for terms violations may reapply after a 90-day review period.',
  },
  {
    id: 'governing', title: '7. Governing Law',
    body: 'These terms are governed by the laws of the jurisdiction in which Church OS PVT LTD is incorporated. Any disputes arising from these terms or from participation in the Registry shall be subject to the exclusive jurisdiction of the courts of that jurisdiction, unless otherwise required by applicable local law.',
  },
  {
    id: 'contact', title: '8. Contact',
    body: 'For questions about these terms, Registry listing modifications, verification requests, or removal requests, contact legal@churchos.ai. We aim to respond within 10 business days.',
  },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('what');

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-6 py-12 border-b border-white/[.06]">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-400 mb-4">Legal</span>
          <h1 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Registry Terms of Service</h1>
          <p className="text-slate-400 mt-3 text-sm">Church OS PVT LTD · Last updated: April 2026</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-4 gap-12 items-start">
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
            <div className="lg:col-span-3 space-y-10">
              {SECTIONS.map(s => (
                <div key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl font-black text-white">{s.title}</h2>
                  <p className="text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
                </div>
              ))}
              <div className="pt-8 border-t border-white/[.06]">
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-slate-600">&copy; 2026 Church OS PVT LTD · legal@churchos.ai</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
