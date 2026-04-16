'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminCtx } from '../Context';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Globe, Search, Eye, MousePointerClick, Play, Users,
  TrendingUp, AlertTriangle, Bell, Smartphone,
  Monitor, ArrowUpRight, CheckCircle, Clock, Zap,
  RefreshCw, Tablet,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatEventLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const EVENT_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  page_view:             { icon: <Eye size={14} />,              color: 'text-slate-400' },
  church_profile_view:   { icon: <Globe size={14} />,            color: 'text-emerald-400' },
  registry_search:       { icon: <Search size={14} />,           color: 'text-indigo-400' },
  visit_modal_open:      { icon: <Bell size={14} />,             color: 'text-amber-400' },
  join_modal_open:       { icon: <Users size={14} />,            color: 'text-cyan-400' },
  cta_click:             { icon: <MousePointerClick size={14} />,color: 'text-blue-400' },
  video_play:            { icon: <Play size={14} />,             color: 'text-red-400' },
  register_pathway_click:{ icon: <Zap size={14} />,             color: 'text-purple-400' },
  login_portal_click:    { icon: <Users size={14} />,            color: 'text-pink-400' },
  time_on_page:          { icon: <Clock size={14} />,            color: 'text-slate-500' },
  walkthrough_tab:       { icon: <TrendingUp size={14} />,       color: 'text-violet-400' },
  filter_apply:          { icon: <Search size={14} />,           color: 'text-slate-400' },
  search_result_click:   { icon: <MousePointerClick size={14} />,color: 'text-emerald-400' },
};

const STATUS_STYLES: Record<string, string> = {
  new:       'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
  contacted: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
  visited:   'bg-violet-500/10 border border-violet-500/20 text-violet-400',
  no_show:   'bg-rose-500/10 border border-rose-500/20 text-rose-400',
};

const RISK_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high:     'bg-red-500/20 text-red-400 border border-red-500/30',
  warning:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  medium:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  info:     'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  low:      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

const FUNNEL_COLORS: Record<string, string> = {
  newsletter_signup:      '#10b981',
  become_member:          '#6366f1',
  beneficiary_application:'#f59e0b',
  audit_request:          '#3b82f6',
  prayer:                 '#f43f5e',
  event:                  '#a855f7',
  class_hoth:             '#14b8a6',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const StatSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl p-4 animate-pulse space-y-2">
    <div className="h-3 bg-muted rounded w-2/3" />
    <div className="h-7 bg-muted rounded w-1/2" />
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformIntelligencePage() {
  const { orgId } = useAdminCtx();
  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [topProfiles, setTopProfiles] = useState<any[]>([]);
  const [topSearches, setTopSearches] = useState<any[]>([]);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [ctaBreakdown, setCtaBreakdown] = useState<any[]>([]);
  const [pilInsights, setPilInsights] = useState<any[]>([]);
  const [inquiryFunnel, setInquiryFunnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [
      summaryRes,
      topProfilesRes,
      topSearchesRes,
      visitRes,
      recentRes,
      ctaRes,
      pilRes,
      funnelRes,
    ] = await Promise.all([
      // 1. Summary — supabaseAdmin (service role only)
      supabaseAdmin.from('vw_platform_intelligence_summary').select('*').single(),

      // 2. Top viewed church profiles — supabaseAdmin
      supabaseAdmin
        .from('vw_top_church_profiles')
        .select('church_name, city, country, views_7d, views_30d, visit_intent_7d')
        .order('views_7d', { ascending: false })
        .limit(10),

      // 3. Top registry searches — supabaseAdmin
      supabaseAdmin
        .from('vw_top_registry_searches')
        .select('search_query, searches_7d, total_searches, last_searched_at')
        .order('searches_7d', { ascending: false })
        .limit(10),

      // 4. Visit requests — anon client, RLS scopes to orgId
      supabase
        .from('visit_requests')
        .select('id, first_name, last_name, email, church_slug, preferred_service, status, how_heard, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20),

      // 5. Recent platform events — supabaseAdmin
      supabaseAdmin
        .from('platform_page_events')
        .select('event_type, page_path, church_slug, search_query, cta_label, device_type, created_at')
        .order('created_at', { ascending: false })
        .limit(50),

      // 6. CTA click breakdown (last 7d) — supabaseAdmin
      supabaseAdmin
        .from('platform_page_events')
        .select('cta_label')
        .eq('event_type', 'cta_click')
        .not('cta_label', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // 7. Unacknowledged PIL insights for this org — anon client (RLS)
      supabase
        .from('prophetic_insights')
        .select('category, risk_level, insight_title, insight_description, recommended_action, generated_at')
        .eq('org_id', orgId)
        .eq('is_acknowledged', false)
        .order('generated_at', { ascending: false })
        .limit(5),

      // 8. Weekly inquiry funnel — supabaseAdmin
      supabaseAdmin
        .from('vw_global_connection_metrics')
        .select('week, intent_category, submission_count')
        .eq('org_id', orgId)
        .order('week', { ascending: false })
        .limit(40),
    ]);

    if (summaryRes.data) setSummary(summaryRes.data);
    if (topProfilesRes.data) setTopProfiles(topProfilesRes.data);
    if (topSearchesRes.data) setTopSearches(topSearchesRes.data);
    if (visitRes.data) setVisitRequests(visitRes.data);
    if (recentRes.data) setRecentEvents(recentRes.data);
    if (ctaRes.data) {
      const counts: Record<string, number> = {};
      ctaRes.data.forEach((r: any) => { counts[r.cta_label] = (counts[r.cta_label] || 0) + 1; });
      setCtaBreakdown(
        Object.entries(counts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      );
    }
    if (pilRes.data) setPilInsights(pilRes.data);
    if (funnelRes.data) setInquiryFunnel(funnelRes.data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // ── Visit request status update
  const markContacted = async (id: string) => {
    await supabase.from('visit_requests').update({ status: 'contacted' }).eq('id', id);
    setVisitRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'contacted' } : r));
  };

  // ── Weekly inquiry funnel transform
  const funnelChartData = (() => {
    const weeks: Record<string, Record<string, number>> = {};
    inquiryFunnel.forEach((row: any) => {
      const label = new Date(row.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weeks[label]) weeks[label] = {};
      weeks[label][row.intent_category] = (weeks[label][row.intent_category] || 0) + row.submission_count;
    });
    return Object.entries(weeks)
      .map(([week, cats]) => ({ week, ...cats }))
      .reverse();
  })();

  const allFunnelKeys = Array.from(
    new Set(inquiryFunnel.map((r: any) => r.intent_category))
  );

  // ── Device breakdown
  const deviceData = [
    { name: 'Desktop', value: summary?.desktop_sessions_7d || 0, color: '#818cf8' },
    { name: 'Mobile',  value: summary?.mobile_sessions_7d  || 0, color: '#10b981' },
    { name: 'Tablet',  value: summary?.tablet_sessions_7d  || 0, color: '#fbbf24' },
  ].filter(d => d.value > 0);

  const newVisitCount = visitRequests.filter(r => r.status === 'new').length;
  const criticalPilCount = pilInsights.filter(i => i.risk_level === 'critical' || i.risk_level === 'high').length;

  return (
    <div className="p-6 xl:p-8 space-y-8 text-foreground transition-colors duration-500">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-500" />
            </div>
            <h1 className="text-xl font-black text-foreground tracking-wide">Platform Intelligence</h1>
          </div>
          <p className="text-[11px] text-muted-foreground ml-10">
            AI-powered analytics for your church&apos;s digital presence.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Section 1: PIL Status Banner ── */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[.04] p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-400">PIL Intelligence Status</p>
              {pilInsights.length > 0 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {pilInsights.length} unacknowledged{criticalPilCount > 0 ? ` · ${criticalPilCount} critical` : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" />
                  All insights reviewed
                </span>
              )}
            </div>

            {/* Top 2 PIL insights */}
            <div className="space-y-3">
              {loading ? (
                <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
              ) : pilInsights.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 font-medium">No unacknowledged insights. The AI is watching.</p>
              ) : (
                pilInsights.slice(0, 2).map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/50">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider mt-0.5 ${RISK_STYLES[insight.risk_level] || RISK_STYLES.info}`}>
                      {insight.risk_level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{insight.insight_title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{insight.recommended_action}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/shepherd/dashboard/ai/')}
            className="shrink-0 flex items-center gap-1.5 text-[10px] font-black text-violet-400 hover:text-violet-300 uppercase tracking-wider transition-colors"
          >
            View All in AI Command Center <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Section 2: Header Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)
        ) : ([
          { label: 'Sessions (7d)',       value: summary?.sessions_7d      ?? 0, icon: <Users className="w-4 h-4" />,           color: 'text-violet-500' },
          { label: 'Page Views (7d)',     value: summary?.page_views_7d    ?? 0, icon: <Eye className="w-4 h-4" />,             color: 'text-emerald-500' },
          { label: 'Profile Views (7d)', value: summary?.profile_views_7d  ?? 0, icon: <Globe className="w-4 h-4" />,          color: 'text-blue-500' },
          { label: 'Searches (7d)',       value: summary?.searches_7d      ?? 0, icon: <Search className="w-4 h-4" />,          color: 'text-indigo-500' },
          { label: 'Visit Intents (7d)', value: summary?.visit_intents_7d  ?? 0, icon: <Bell className="w-4 h-4" />,           color: 'text-amber-500' },
          { label: 'Video Plays (7d)',   value: summary?.video_plays_7d    ?? 0, icon: <Play className="w-4 h-4" />,            color: 'text-red-500' },
          { label: 'CTA Clicks (7d)',    value: summary?.cta_clicks_7d     ?? 0, icon: <MousePointerClick className="w-4 h-4" />, color: 'text-cyan-500' },
          { label: 'Events (30d)',        value: summary?.events_30d       ?? 0, icon: <TrendingUp className="w-4 h-4" />,      color: 'text-rose-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value.toLocaleString()}</p>
          </div>
        )))}
      </div>

      {/* ── Section 3: Church Profiles + Registry Searches ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Most Viewed Church Profiles */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Most Viewed Church Profiles — 7 days</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : topProfiles.length === 0 ? (
            <div className="p-8 text-center">
              <Globe className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No profile views recorded yet.</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1">Share your registry link to drive traffic.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    {['Church', 'Location', 'Views 7d', 'Visit Intents'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {topProfiles.map((p: any, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-foreground">{p.church_name}</td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-xs font-black text-emerald-500">{p.views_7d ?? 0}</td>
                      <td className="px-4 py-3 text-xs font-black text-amber-500">{p.visit_intent_7d ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Registry Searches */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Top Registry Searches — 7 days</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : topSearches.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No searches recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {topSearches.map((s: any, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-foreground">{s.search_query}</p>
                      {s.last_searched_at && (
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{relativeTime(s.last_searched_at)}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400">
                      {s.searches_7d} searches
                    </span>
                  </div>
                ))}
              </div>
              <div className="m-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-400 leading-relaxed">
                  <span className="font-black">⚡ Harvest Signals</span> — these search terms show where potential members are looking.
                  The PIL uses these patterns to identify growth corridors.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 4: Visit Requests ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Visit Requests</h2>
            {visitRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-black text-muted-foreground border border-border">
                {visitRequests.length}
              </span>
            )}
            {newVisitCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 animate-pulse">
                {newVisitCount} New
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : visitRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground/40">No visit requests yet.</p>
            <p className="text-[11px] text-muted-foreground/30 mt-1 max-w-sm mx-auto">
              When visitors click &ldquo;I Want to Visit&rdquo; on any church profile, their details will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  {['Name', 'Email', 'Service', 'How They Found Us', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {visitRequests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-foreground whitespace-nowrap">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{r.email || '—'}</td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{r.preferred_service || '—'}</td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{r.how_heard || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[r.status] || STATUS_STYLES.new}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'new' && (
                        <button
                          onClick={() => markContacted(r.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-widest whitespace-nowrap"
                        >
                          Mark Contacted
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 5: CTA Performance + Device Breakdown ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* CTA Clicks Bar Chart */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">CTA Performance — 7 days</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-48 bg-muted rounded-xl animate-pulse" />
            ) : ctaBreakdown.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No CTA clicks recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, ctaBreakdown.length * 44)}>
                <BarChart data={ctaBreakdown} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" width={170} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device Breakdown Pie Chart */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Device Breakdown — 7 days</h2>
          </div>
          <div className="p-5 flex items-center justify-center">
            {loading ? (
              <div className="w-40 h-40 bg-muted rounded-full animate-pulse" />
            ) : deviceData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No device data yet.</p>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <PieChart width={160} height={160}>
                  <Pie
                    data={deviceData}
                    cx={75}
                    cy={75}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                  />
                </PieChart>
                <div className="space-y-2.5">
                  {deviceData.map((d, i) => {
                    const total = deviceData.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    const Icon = d.name === 'Desktop' ? Monitor : d.name === 'Mobile' ? Smartphone : Tablet;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-[11px] font-bold text-muted-foreground">{d.name}</span>
                        <span className="text-[11px] font-black text-foreground ml-1">{pct}%</span>
                        <span className="text-[10px] text-muted-foreground/40">({d.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 6: Weekly Inquiry Funnel ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Weekly Connection Funnel</h2>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Submissions by intent from the platform surface.</p>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-48 bg-muted rounded-xl animate-pulse" />
          ) : funnelChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">No inquiry data yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelChartData} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {allFunnelKeys.map(key => (
                    <Bar key={key} dataKey={key} stackId="a" fill={FUNNEL_COLORS[key] || '#94a3b8'} radius={key === allFunnelKeys[allFunnelKeys.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* ── Section 7: Live Event Stream ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Recent Platform Events</h2>
          <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground/40">No events recorded yet.</p>
            <p className="text-[11px] text-muted-foreground/30 mt-1">Platform analytics will appear here as visitors engage with the site.</p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
            <div className="divide-y divide-border/30">
              {recentEvents.map((e: any, i) => {
                const evConfig = EVENT_ICONS[e.event_type] || { icon: <Eye size={14} />, color: 'text-slate-400' };
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors">
                    <span className={`flex-shrink-0 ${evConfig.color}`}>{evConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-foreground">{formatEventLabel(e.event_type)}</span>
                      {(e.church_slug || e.page_path) && (
                        <span className="ml-2 text-[10px] text-muted-foreground/50 truncate">
                          {e.church_slug || e.page_path}
                        </span>
                      )}
                      {e.search_query && (
                        <span className="ml-2 text-[10px] text-indigo-400/70">&ldquo;{e.search_query}&rdquo;</span>
                      )}
                    </div>
                    {e.device_type && (
                      <span className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-[8px] font-black text-muted-foreground uppercase tracking-wider flex-shrink-0">
                        {e.device_type}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/40 flex-shrink-0">{relativeTime(e.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
