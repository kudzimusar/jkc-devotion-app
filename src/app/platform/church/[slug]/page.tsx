'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Church, MapPin, Users, Calendar, Globe, Phone, Mail,
  ExternalLink, Play, ArrowRight, Award, ShieldCheck,
  Menu, X, Check, AlertTriangle, Clock, Youtube,
  Facebook, Instagram, Twitter, Music2, Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { JKC_ORG_ID, JKC_SLUG } from '@/lib/platform-constants';

// ─── Suppress unused import warnings for constants used in logic ──────────────
void JKC_ORG_ID;
void JKC_SLUG;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface ServiceTime {
  day: string;
  time: string;
  type: string;
}

interface SocialMedia {
  youtube?:   string;
  facebook?:  string;
  instagram?: string;
  twitter?:   string;
  tiktok?:    string;
}

interface ChurchData {
  id: string;
  name: string;
  slug: string;
  denomination: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  pastor_name: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  description: string | null;
  mission_statement: string | null;
  founding_year: number | null;
  member_count: number | null;
  ministry_count: number | null;
  service_times: ServiceTime[] | null;
  social_media: SocialMedia | null;
  is_verified: boolean;
  is_church_os_client: boolean;
  org_id: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getCategoryStyle(category: string | null): string {
  const map: Record<string, string> = {
    worship:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    care:     'bg-rose-500/10 text-rose-300 border-rose-500/20',
    outreach: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    admin:    'bg-slate-500/10 text-slate-300 border-slate-500/20',
    media:    'bg-amber-500/10 text-amber-300 border-amber-500/20',
  };
  return map[(category ?? '').toLowerCase()] ?? 'bg-white/5 text-slate-300 border-white/10';
}

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
    { label: 'Global Registry',  path: '/platform/registry/' },
    { label: 'AI Growth Engine', path: '/platform/ai/' },
    { label: 'Philanthropy',     path: '/platform/philanthropy/' },
    { label: 'Devotion',         path: '/welcome/devotion/' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/[.08] py-3' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
            <Church className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">Church<span className="text-emerald-400">OS</span></span>
        </button>
        <div className="hidden lg:flex items-center gap-10">
          {links.map(l => (
            <button key={l.path} onClick={() => router.push(l.path)}
              className="text-[11px] font-black uppercase tracking-[.12em] text-slate-400 hover:text-white transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/platform/login/')} className="hidden sm:flex text-sm font-bold text-slate-400 hover:text-white transition-colors px-3 py-2">Sign In</button>
          <button onClick={() => router.push('/platform/register/')} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">Get Started</button>
          <button className="lg:hidden p-1 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a1628]/98 backdrop-blur-xl border-b border-white/[.08] p-6 flex flex-col gap-4">
          {links.map(l => (
            <button key={l.path} onClick={() => { router.push(l.path); setMobileOpen(false); }}
              className="text-left text-sm font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors">{l.label}</button>
          ))}
          <hr className="border-white/10" />
          <button onClick={() => { router.push('/platform/register/'); setMobileOpen(false); }} className="bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl">Get Started</button>
        </div>
      )}
    </nav>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingState = () => (
  <div className="min-h-screen bg-[#0a1628] text-white">
    <Navbar />
    <div className="h-[45vh] min-h-[400px] animate-pulse bg-white/[.04]" />
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-8">
      <div className="h-8 bg-white/[.04] rounded-xl w-1/3 animate-pulse" />
      <div className="h-4 bg-white/[.04] rounded w-2/3 animate-pulse" />
      <div className="h-4 bg-white/[.04] rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

// ─── Not found ────────────────────────────────────────────────────────────────
const NotFound = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-white/[.04] border border-white/[.08] flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-slate-500" />
          </div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Sanctuary not found.
          </h1>
          <p className="text-slate-400 leading-relaxed">This sanctuary could not be found in the Global Church Registry. It may have been removed or the link may be incorrect.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push('/platform/registry/')} className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 h-12 rounded-xl transition-colors">
              Back to Registry <ArrowRight size={16} />
            </button>
            <button onClick={() => router.push('/platform/')} className="inline-flex items-center justify-center border border-white/20 text-white hover:bg-white/5 font-bold px-6 h-12 rounded-xl transition-colors">
              Church OS Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Modal base ───────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#0f1e38] border border-white/[.10] rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
      <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors">
        <X size={20} />
      </button>
      {children}
    </div>
  </div>
);

// ─── Visit Modal ──────────────────────────────────────────────────────────────
const VisitModal = ({ church, onClose }: { church: ChurchData; onClose: () => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredService, setPreferredService] = useState('');
  const [message, setMessage] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const serviceTimes = church.service_times ?? [];
  const serviceOptions = serviceTimes.map(st => `${st.type} — ${st.day} ${st.time}`);

  const inputStyle = 'w-full h-12 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setFirstNameError('Please enter your first name');
      return;
    }
    setFirstNameError('');
    setStatus('loading');
    const { error } = await supabase.from('visit_requests').insert({
      org_id: church.org_id,
      church_slug: church.slug,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
      preferred_service: preferredService || null,
      message: message.trim() || null,
      how_heard: 'platform_registry',
      source: 'platform_web',
    });
    setStatus(error ? 'error' : 'done');
  };

  if (status === 'done') {
    return (
      <Modal onClose={onClose}>
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              We&apos;ll see you Sunday!
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">We look forward to meeting you. The church team will be in touch if you provided an email.</p>
          </div>
          <button onClick={onClose} className="w-full h-12 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-400">Plan Your Visit</span>
          <h3 className="text-2xl font-black text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            I Want to Visit
          </h3>
          <p className="text-slate-400 text-sm mt-1">{church.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setFirstNameError(''); }}
                placeholder="Your name" className={`${inputStyle} ${firstNameError ? 'border-rose-500/50' : ''}`} />
              {firstNameError && <p className="text-rose-400 text-xs font-bold mt-1">{firstNameError}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Optional" className={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="So we can follow up with you" className={inputStyle} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Preferred Service</label>
            {serviceOptions.length > 0 ? (
              <select value={preferredService} onChange={e => setPreferredService(e.target.value)}
                className={`${inputStyle} appearance-none cursor-pointer`}>
                <option value="">Select a service time</option>
                {serviceOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            ) : (
              <input type="text" value={preferredService} onChange={e => setPreferredService(e.target.value)}
                placeholder="Which service would you like to attend?" className={inputStyle} />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Anything you'd like us to know before you visit?"
              className="w-full px-4 py-3 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-colors resize-none" />
          </div>

          {status === 'error' && (
            <p className="text-rose-400 text-xs font-bold">Something went wrong. Please try again.</p>
          )}

          <button type="submit" disabled={status === 'loading'}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none">
            {status === 'loading' ? 'Sending...' : "I'll Be There →"}
          </button>
        </form>
      </div>
    </Modal>
  );
};

// ─── Join Modal ───────────────────────────────────────────────────────────────
const JoinModal = ({ church, onClose }: { church: ChurchData; onClose: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const inputStyle = 'w-full h-12 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('loading');
    const parts = name.trim().split(' ');
    const { error } = await supabase.from('public_inquiries').insert({
      first_name: parts[0],
      last_name: parts.slice(1).join(' ') || null,
      email: email.trim(),
      visitor_intent: 'join_church',
      org_id: church.org_id ?? '00000000-0000-0000-0000-000000000000',
      message: `Membership interest for ${church.name}`,
    });
    setStatus(error ? 'error' : 'done');
  };

  if (status === 'done') {
    return (
      <Modal onClose={onClose}>
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Welcome to the Family.
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">Your interest has been received. The church team will be in touch shortly to guide you through the membership process.</p>
          </div>
          <button onClick={onClose} className="w-full h-12 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-400">Membership</span>
          <h3 className="text-2xl font-black text-white mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Join Our Church
          </h3>
          <p className="text-slate-400 text-sm mt-1">{church.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" className={inputStyle} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" className={inputStyle} />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed border border-white/[.06] rounded-xl p-4 bg-white/[.02]">
            By submitting, you&apos;ll be connected with the church team who will guide you through the membership process.
          </p>

          {status === 'error' && <p className="text-rose-400 text-xs font-bold">Something went wrong. Please try again.</p>}

          <button type="submit" disabled={status === 'loading'}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none">
            {status === 'loading' ? 'Submitting...' : 'Submit Interest →'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function ChurchProfilePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [church, setChurch] = useState<ChurchData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [streamStatus, setStreamStatus] = useState<{ status: string; stream_url?: string } | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);

      // Step 1: Core registry row
      const { data: churchData, error: churchError } = await supabase
        .from('church_registry')
        .select('id,name,slug,denomination,city,country,address,pastor_name,website,email,phone,cover_image_url,logo_url,description,mission_statement,founding_year,member_count,ministry_count,service_times,social_media,is_verified,is_church_os_client,org_id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!churchData || churchError) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setChurch(churchData as ChurchData);

      // Step 2: Only if Church OS client with a valid org_id
      if (churchData.is_church_os_client && churchData.org_id) {
        const [ministriesRes, sermonsRes, eventsRes, streamRes] = await Promise.all([
          supabase
            .from('ministries')
            .select('name,description,category,icon')
            .eq('org_id', churchData.org_id)
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('public_sermons')
            .select('title,speaker,scripture,date,youtube_url,is_featured')
            .eq('org_id', churchData.org_id)
            .not('youtube_url', 'is', null)
            .order('date', { ascending: false })
            .limit(3),
          supabase
            .from('events')
            .select('name,event_type,event_date,location,description')
            .eq('org_id', churchData.org_id)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(5),
          supabase
            .from('live_streams')
            .select('status,stream_url')
            .eq('org_id', churchData.org_id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single(),
        ]);

        if (ministriesRes.data) setMinistries(ministriesRes.data);
        if (sermonsRes.data)   setSermons(sermonsRes.data);
        if (eventsRes.data)    setEvents(eventsRes.data);
        if (streamRes.data)    setStreamStatus(streamRes.data as { status: string; stream_url?: string });
      }

      setLoading(false);
    };

    fetchData();
  }, [slug]);

  if (loading) return <LoadingState />;
  if (notFound || !church) return <NotFound />;

  const isLive = streamStatus?.status === 'live';
  const socialMedia = church.social_media ?? {};
  const serviceTimes: ServiceTime[] = church.service_times ?? [];

  const heroStyle = church.cover_image_url
    ? { backgroundImage: `url(${church.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased">
      <Navbar />

      {/* ── SECTION 1: HERO ─────────────────────────────────────────── */}
      <section className="relative h-[45vh] min-h-[400px] overflow-hidden" style={heroStyle}>
        {/* Overlay */}
        <div className={`absolute inset-0 ${church.cover_image_url ? 'bg-slate-900/75' : 'bg-gradient-to-br from-[#0a1628] via-[#0f2040] to-[#0a1628]'}`} />

        {/* Ambient gradient when no image */}
        {!church.cover_image_url && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/[.07] blur-[180px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/[.07] blur-[140px] rounded-full" />
          </div>
        )}

        {/* Content anchored bottom-left */}
        <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl space-y-4">
          {/* Badge */}
          {church.is_church_os_client ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[9px] font-black uppercase tracking-[.18em] text-amber-400">
              <Award size={9} /> Featured Church · Church OS Client
            </span>
          ) : church.is_verified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase tracking-[.18em] text-emerald-400">
              <ShieldCheck size={9} /> Verified Sanctuary
            </span>
          ) : null}

          {/* Church name */}
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {church.name}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {church.denomination && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-black text-white uppercase tracking-wider">
                {church.denomination}
              </span>
            )}
            {church.pastor_name && (
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Users size={13} /> {church.pastor_name}
              </span>
            )}
            {church.city && church.country && (
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <MapPin size={13} /> {church.city}, {church.country}
              </span>
            )}
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2">
            {church.member_count && (
              <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs font-black text-white backdrop-blur-sm">
                {church.member_count.toLocaleString()} Members
              </span>
            )}
            {church.ministry_count && (
              <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs font-black text-white backdrop-blur-sm">
                {church.ministry_count} Ministries
              </span>
            )}
            {church.founding_year && (
              <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs font-black text-white backdrop-blur-sm">
                Est. {church.founding_year}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: ACTION BAR ───────────────────────────────────── */}
      <div className="border-b border-white/[.06] bg-[#0a1628]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setShowVisitModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 h-11 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/20"
          >
            I Want to Visit
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/5 font-bold px-5 h-11 rounded-xl transition-colors text-sm"
          >
            Join Our Church
          </button>
          <button
            onClick={() => router.push(`/platform/giving/?beneficiary=${church.slug}`)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 h-11 rounded-xl transition-colors text-sm"
          >
            Support This Ministry
          </button>
          {church.is_church_os_client && socialMedia.youtube && (
            isLive ? (
              <a href={streamStatus?.stream_url ?? socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 h-11 rounded-xl transition-colors text-sm shadow-lg shadow-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Watch Live Now
              </a>
            ) : (
              <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-700/80 hover:bg-red-600 text-white font-bold px-5 h-11 rounded-xl transition-colors text-sm">
                <Youtube size={16} /> Watch on YouTube
              </a>
            )
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">

        {/* ── SECTION 3: ABOUT ─────────────────────────────────────── */}
        {(church.mission_statement || church.description || church.address || church.phone || church.email || church.website) && (
          <section className="grid lg:grid-cols-3 gap-12">
            {/* Left: narrative */}
            {(church.mission_statement || church.description) && (
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  About This Sanctuary
                </h2>
                {church.mission_statement && (
                  <blockquote className="border-l-4 border-emerald-500/60 pl-6 italic text-slate-300 text-lg leading-relaxed"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    &ldquo;{church.mission_statement}&rdquo;
                  </blockquote>
                )}
                {church.description && (
                  <p className="text-slate-400 leading-relaxed">{church.description}</p>
                )}
              </div>
            )}

            {/* Right: info card */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Church Details</h3>
                {church.address && (
                  <div className="flex gap-3">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-300 leading-relaxed">{church.address}</p>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(church.address)}`} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                )}
                {church.phone && (
                  <div className="flex gap-3 items-center">
                    <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                    <a href={`tel:${church.phone}`} className="text-sm text-slate-300 hover:text-white transition-colors">{church.phone}</a>
                  </div>
                )}
                {church.email && (
                  <div className="flex gap-3 items-center">
                    <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                    <a href={`mailto:${church.email}`} className="text-sm text-slate-300 hover:text-white transition-colors">{church.email}</a>
                  </div>
                )}
                {church.website && (
                  <div className="flex gap-3 items-center">
                    <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                    <a href={church.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
                      Visit Website <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                {church.founding_year && (
                  <div className="flex gap-3 items-center">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <p className="text-sm text-slate-300">Founded {church.founding_year}</p>
                  </div>
                )}
                {church.denomination && (
                  <div className="flex gap-3 items-center">
                    <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
                    <p className="text-sm text-slate-300">{church.denomination}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 4: SERVICE TIMES ─────────────────────────────── */}
        {serviceTimes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Join Us
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                {serviceTimes.length} {serviceTimes.length === 1 ? 'Service' : 'Services'}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {serviceTimes.map((st, i) => (
                <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-400">{st.type}</span>
                  </div>
                  <p className="text-base font-black text-white">{st.day}</p>
                  <p className="text-sm text-slate-400 font-bold">{st.time}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 5: MINISTRIES (CLIENT ONLY) ─────────────────── */}
        {church.is_church_os_client && ministries.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Active Ministries
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                {ministries.length} Initiatives
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ministries.map((m: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 space-y-3 hover:bg-white/[.03] transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white">{m.name}</h4>
                    {m.category && (
                      <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getCategoryStyle(m.category)}`}>
                        {m.category}
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 6: SERMONS (CLIENT ONLY) ────────────────────── */}
        {church.is_church_os_client && sermons.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Recent Messages
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {sermons.map((s: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-white leading-snug line-clamp-2 flex-1">{s.title?.trim()}</h4>
                    {s.is_featured && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-wider shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-500 font-medium">
                    {s.speaker && <p>{s.speaker}</p>}
                    {s.scripture && <p className="text-indigo-400">{s.scripture}</p>}
                    <p>{formatDate(s.date)}</p>
                  </div>
                  <a href={s.youtube_url} target="_blank" rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 bg-red-700/80 hover:bg-red-600 text-white font-bold px-4 h-10 rounded-xl transition-colors text-xs w-full">
                    <Play size={13} fill="currentColor" /> Watch Now
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 7: EVENTS (CLIENT ONLY) ─────────────────────── */}
        {church.is_church_os_client && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Upcoming Events
            </h2>
            {events.length === 0 ? (
              <div className="rounded-2xl border border-white/[.06] bg-white/[.01] p-10 text-center space-y-2">
                <Calendar className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-slate-500 font-bold">No upcoming events scheduled.</p>
                <p className="text-slate-600 text-sm">Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center shrink-0">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                        {new Date(ev.event_date).toLocaleString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-black text-white leading-none">
                        {new Date(ev.event_date).getDate()}
                      </p>
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-white">{ev.name}</h4>
                        {ev.event_type && (
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {ev.event_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{formatEventDate(ev.event_date)}</p>
                      {ev.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {ev.location}</p>
                      )}
                      {ev.description && (
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 8: SOCIAL MEDIA ──────────────────────────────── */}
        {(socialMedia.youtube || socialMedia.facebook || socialMedia.instagram || socialMedia.twitter || socialMedia.tiktok) && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Connect Online
            </h2>
            <div className="flex flex-wrap gap-3">
              {socialMedia.youtube && (
                <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-red-700/20 border border-red-500/20 text-red-400 hover:bg-red-700/30 font-bold text-sm transition-colors">
                  <Youtube size={16} /> YouTube
                </a>
              )}
              {socialMedia.facebook && (
                <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-blue-700/20 border border-blue-500/20 text-blue-400 hover:bg-blue-700/30 font-bold text-sm transition-colors">
                  <Facebook size={16} /> Facebook
                </a>
              )}
              {socialMedia.instagram && (
                <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-pink-700/20 border border-pink-500/20 text-pink-400 hover:bg-pink-700/30 font-bold text-sm transition-colors">
                  <Instagram size={16} /> Instagram
                </a>
              )}
              {socialMedia.twitter && (
                <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-slate-700/20 border border-slate-500/20 text-slate-400 hover:bg-slate-700/30 font-bold text-sm transition-colors">
                  <Twitter size={16} /> Twitter / X
                </a>
              )}
              {socialMedia.tiktok && (
                <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 h-11 rounded-xl bg-slate-700/20 border border-slate-500/20 text-slate-400 hover:bg-slate-700/30 font-bold text-sm transition-colors">
                  <Music2 size={16} /> TikTok
                </a>
              )}
            </div>
          </section>
        )}

      </div>

      {/* ── SECTION 9: NON-CLIENT BANNER ─────────────────────────────── */}
      {!church.is_church_os_client && (
        <div className="border-t border-amber-500/20 bg-amber-500/[.06]">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-base font-black text-amber-300">
                This church is not yet on Church OS.
              </p>
              <p className="text-sm text-amber-400/70">Help them join the global network and unlock the full intelligence platform.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => router.push(`/platform/register/?intent=claim&church=${church.slug}`)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 h-11 rounded-xl transition-colors text-sm"
              >
                Register This Church
              </button>
              <button
                onClick={() => router.push('/platform/register/')}
                className="inline-flex items-center border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold px-5 h-11 rounded-xl transition-colors text-sm"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[.06] bg-[#050d18] py-8 text-center">
        <button onClick={() => router.push('/platform/registry/')}
          className="text-slate-500 hover:text-white text-sm font-bold transition-colors inline-flex items-center gap-1">
          <ArrowRight size={14} className="rotate-180" /> Back to Global Registry
        </button>
        <p className="text-[10px] font-black uppercase tracking-[.4em] text-slate-700 mt-4">
          &copy; 2026 Church OS PVT LTD
        </p>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      {showVisitModal && <VisitModal church={church} onClose={() => setShowVisitModal(false)} />}
      {showJoinModal  && <JoinModal  church={church} onClose={() => setShowJoinModal(false)} />}

      {/* Live indicator */}
      {isLive && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 shadow-lg shadow-red-500/30 text-white text-xs font-black uppercase tracking-widest">
            <Activity size={12} />
            Live Now
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
