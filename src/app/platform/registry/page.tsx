'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Church, Search, MapPin, ArrowRight, Menu, X,
  SlidersHorizontal, ChevronDown, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PAGE_SIZE, DENOMINATIONS, COUNTRIES } from '@/lib/platform-constants';
import { trackEvent, trackTimeOnPage } from '@/lib/analytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Navbar ──────────────────────────────────────────────────────────────────
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/[.08] py-3' : 'bg-[#0a1628]/80 backdrop-blur-sm border-b border-white/[.05] py-4'}`}>
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
              className={`text-[11px] font-black uppercase tracking-[.12em] transition-colors ${l.path === '/platform/registry/' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
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

// ─── Church Card ─────────────────────────────────────────────────────────────
const ChurchCard = ({ church, onClick }: { church: any; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-left rounded-2xl border border-white/[.08] bg-white/[.02] p-6 hover:bg-white/[.04] hover:border-white/[.15] transition-all duration-300 group w-full"
  >
    <div className="flex items-start justify-between mb-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${getAvatarColor(church.name)}`}>
        {getInitials(church.name)}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-end">
        {church.is_church_os_client && (
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-wider">Church OS</span>
        )}
        {church.is_verified && (
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider">Verified</span>
        )}
      </div>
    </div>
    <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors mb-1 leading-tight">{church.name}</h4>
    <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
      <MapPin size={9} /> {church.city}, {church.country}
    </p>
    {(church.denomination || church.member_count) && (
      <p className="text-[11px] text-slate-600">
        {church.denomination}{church.denomination && church.member_count ? ' · ' : ''}
        {church.member_count ? `${church.member_count.toLocaleString()} members` : ''}
      </p>
    )}
    {church.pastor_name && <p className="text-[11px] text-slate-600 mt-0.5">Led by {church.pastor_name}</p>}
    <div className="mt-4 pt-3 border-t border-white/[.05] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
      <span>View Profile</span>
      <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform text-slate-500" />
    </div>
  </button>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-6 animate-pulse space-y-3">
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-white/[.05]" />
      <div className="w-16 h-5 rounded-lg bg-white/[.05]" />
    </div>
    <div className="h-4 bg-white/[.05] rounded w-3/4" />
    <div className="h-3 bg-white/[.05] rounded w-1/2" />
    <div className="h-3 bg-white/[.05] rounded w-2/3" />
  </div>
);

// ─── Filter State ─────────────────────────────────────────────────────────────
interface FilterState {
  q: string;
  denomination: string;
  country: string;
  verifiedOnly: boolean;
  clientOnly: boolean;
}

// ─── Registry Content (uses hooks — wrapped in Suspense below) ────────────────
function RegistryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get('q') ?? '',
    denomination: '',
    country: '',
    verifiedOnly: false,
    clientOnly: false,
  });
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [churches, setChurches] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedCountRef = useRef(0);

  useEffect(() => {
    try { setBannerDismissed(sessionStorage.getItem('registry_banner_dismissed') === 'true'); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    trackEvent({ event_type: 'page_view', page_path: '/platform/registry/' });
    return () => trackTimeOnPage('/platform/registry/', startTime);
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { sessionStorage.setItem('registry_banner_dismissed', 'true'); } catch { /* noop */ }
  };

  // Fetch on filter change (reset)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let query = supabase
        .from('church_registry')
        .select('name,slug,city,country,denomination,member_count,is_verified,is_church_os_client,pastor_name,cover_image_url', { count: 'exact' })
        .eq('is_active', true)
        .order('is_church_os_client', { ascending: false })
        .order('member_count', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (filters.q.trim()) {
        query = query.or(
          `name.ilike.%${filters.q.trim()}%,city.ilike.%${filters.q.trim()}%,country.ilike.%${filters.q.trim()}%,denomination.ilike.%${filters.q.trim()}%,pastor_name.ilike.%${filters.q.trim()}%`
        );
      }
      if (filters.denomination) query = query.eq('denomination', filters.denomination);
      if (filters.country)      query = query.eq('country', filters.country);
      if (filters.verifiedOnly) query = query.eq('is_verified', true);
      if (filters.clientOnly)   query = query.eq('is_church_os_client', true);

      const { data, count } = await query;
      if (!cancelled) {
        const results = data ?? [];
        setChurches(results);
        setTotalCount(count ?? 0);
        loadedCountRef.current = results.length;
        setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [filters]);

  // Load more (append)
  const handleLoadMore = async () => {
    trackEvent({ event_type: 'load_more_click', page_path: '/platform/registry/' });
    setLoadingMore(true);
    const offset = loadedCountRef.current;
    let query = supabase
      .from('church_registry')
      .select('name,slug,city,country,denomination,member_count,is_verified,is_church_os_client,pastor_name,cover_image_url', { count: 'exact' })
      .eq('is_active', true)
      .order('is_church_os_client', { ascending: false })
      .order('member_count', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (filters.q.trim()) {
      query = query.or(
        `name.ilike.%${filters.q.trim()}%,city.ilike.%${filters.q.trim()}%,country.ilike.%${filters.q.trim()}%,denomination.ilike.%${filters.q.trim()}%,pastor_name.ilike.%${filters.q.trim()}%`
      );
    }
    if (filters.denomination) query = query.eq('denomination', filters.denomination);
    if (filters.country)      query = query.eq('country', filters.country);
    if (filters.verifiedOnly) query = query.eq('is_verified', true);
    if (filters.clientOnly)   query = query.eq('is_church_os_client', true);

    const { data } = await query;
    const more = data ?? [];
    setChurches(prev => [...prev, ...more]);
    loadedCountRef.current = offset + more.length;
    setLoadingMore(false);
  };

  const handleInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, q: val }));
      if (val.trim().length > 1) {
        trackEvent({
          event_type: 'registry_search',
          page_path: '/platform/registry/',
          search_query: val.trim(),
        });
      }
    }, 300);
  };

  const clearFilters = () => {
    setInputValue('');
    setFilters({ q: '', denomination: '', country: '', verifiedOnly: false, clientOnly: false });
  };

  const selectStyle = 'w-full h-11 px-3 rounded-xl bg-white/[.04] border border-white/[.08] text-slate-300 text-sm font-medium focus:outline-none focus:border-white/20 appearance-none cursor-pointer';
  const hasFilters = inputValue || filters.denomination || filters.country || filters.verifiedOnly || filters.clientOnly;
  const hasMore = churches.length < totalCount;

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased overflow-x-hidden">
      <Navbar />
      <div className="pt-20">

        {/* Hero strip */}
        <div className="bg-[#050d18] border-b border-white/[.06] py-12 px-6">
          <div className="max-w-7xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">
              Global Registry
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The Global Church Registry.
            </h1>
            <p className="text-slate-400 text-base">
              <span className="text-white font-black">{totalCount > 0 ? totalCount.toLocaleString() : '784+'}</span> sanctuaries&nbsp;&middot;&nbsp;
              <span className="text-white font-black">25</span> countries&nbsp;&middot;&nbsp;
              <span className="text-white font-black">783</span> verified
            </p>
          </div>
        </div>

        {/* Campaign banner */}
        {!bannerDismissed && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-amber-300">
                We&apos;re on a mission to register <strong className="font-black">2.3M</strong> sanctuaries globally. Is your church listed?{' '}
                <button onClick={() => router.push('/platform/register/?intent=claim')} className="underline font-black hover:text-amber-200 transition-colors">
                  Register Now &rarr;
                </button>
              </p>
              <button onClick={dismissBanner} className="text-amber-400 hover:text-amber-200 shrink-0 transition-colors"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-5">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-white/[.08] bg-white/[.02] text-sm font-bold text-slate-300"
            >
              <SlidersHorizontal size={15} />
              Filters {hasFilters ? '(active)' : ''}
              <ChevronDown size={15} className={`ml-auto transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 items-start">

            {/* Sidebar filters */}
            <div className={`lg:col-span-1 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-5 lg:sticky lg:top-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[.2em] text-slate-400">Filters</h3>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors">Clear All</button>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => handleInput(e.target.value)}
                    placeholder="Search sanctuaries..."
                    className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Denomination */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-2">Denomination</label>
                  <select value={filters.denomination} onChange={e => {
                    const value = e.target.value;
                    trackEvent({ event_type: 'filter_apply', page_path: '/platform/registry/', cta_label: `denomination:${value || 'all'}` });
                    setFilters(f => ({ ...f, denomination: value }));
                  }} className={selectStyle}>
                    <option value="">All Denominations</option>
                    {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-2">Country</label>
                  <select value={filters.country} onChange={e => {
                    const value = e.target.value;
                    trackEvent({ event_type: 'filter_apply', page_path: '/platform/registry/', cta_label: `country:${value || 'all'}` });
                    setFilters(f => ({ ...f, country: value }));
                  }} className={selectStyle}>
                    <option value="">All Countries</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  {[
                    { label: 'Verified only', key: 'verifiedOnly' as const },
                    { label: 'Church OS clients only', key: 'clientOnly' as const },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => {
                          trackEvent({ event_type: 'filter_apply', page_path: '/platform/registry/', cta_label: `${item.key}:${!filters[item.key]}` });
                          setFilters(f => ({ ...f, [item.key]: !f[item.key] }));
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${filters[item.key] ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 border-white/20 hover:border-white/40'}`}
                      >
                        {filters[item.key] && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors select-none">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Count */}
              {!loading && (
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Showing <span className="text-white font-black">{churches.length.toLocaleString()}</span> of&nbsp;
                  <span className="text-white font-black">{totalCount.toLocaleString()}</span> sanctuaries
                  {hasFilters ? ' matching filters' : ''}
                </p>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : churches.length === 0 ? (
                <div className="text-center py-24 space-y-4 rounded-2xl border border-white/[.05] bg-white/[.01]">
                  <p className="text-2xl font-black text-slate-500">No sanctuaries found</p>
                  <p className="text-slate-600 text-sm">Try adjusting your search or filters.</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors">
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {churches.map((church: any, i: number) => (
                      <ChurchCard
                        key={`${church.slug}-${i}`}
                        church={church}
                        onClick={() => {
                          trackEvent({
                            event_type: 'search_result_click',
                            page_path: '/platform/registry/',
                            church_slug: church.slug,
                            cta_label: church.name,
                          });
                          router.push(`/platform/church/${church.slug}/`);
                        }}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center pt-2">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 rounded-xl border border-white/[.08] bg-white/[.02] text-sm font-bold text-slate-300 hover:bg-white/[.05] hover:border-white/[.15] transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingMore ? 'Loading...' : `Load More · ${(totalCount - churches.length).toLocaleString()} remaining`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page export (Suspense wrapper required for useSearchParams) ──────────────
export default function RegistryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-slate-400 font-bold animate-pulse">Loading Registry...</p>
      </div>
    }>
      <RegistryContent />
    </Suspense>
  );
}
