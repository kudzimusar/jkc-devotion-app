'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { format } from 'date-fns';
import {
  Zap, Users, Heart, UserPlus, Calendar, BookOpen,
  Mail, Clock, ExternalLink, Search, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const INTENT_LABELS: Record<string, string> = {
  membership:     'Membership Application',
  prayer:         'Prayer Request',
  volunteer:      'Volunteer Application',
  event:          'Event Registration',
  jkgroup:        'jkGroup Request',
  class_hoth:     'Heart of the House',
  class_language: 'Language Class',
  inquiry:        'General Inquiry',
};

const INTENT_COLORS: Record<string, string> = {
  membership:     'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  prayer:         'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  volunteer:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  event:          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  jkgroup:        'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  class_hoth:     'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  class_language: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  inquiry:        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

const FILTER_TABS = [
  { key: 'all',            label: 'All' },
  { key: 'membership',     label: 'Membership' },
  { key: 'prayer',         label: 'Prayer' },
  { key: 'volunteer',      label: 'Volunteer' },
  { key: 'event',          label: 'Event' },
  { key: 'class_hoth',     label: 'Classes' },
  { key: 'class_language', label: 'Language' },
  { key: 'jkgroup',        label: 'jkGroup' },
];

const MC_LINKS: Record<string, string> = {
  membership: '/shepherd/dashboard/requests',
  prayer:     '/shepherd/dashboard/care',
  default:    '/shepherd/dashboard/inquiries',
};

export default function KCCDashboardPage() {
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Resolve org ID once on mount
  useEffect(() => {
    resolvePublicOrgId().then(id => setResolvedOrgId(id));
  }, []);

  // Fetch data once org ID resolves
  useEffect(() => {
    if (!resolvedOrgId) return;
    fetchActivity();
  }, [resolvedOrgId]);

  async function fetchActivity() {
    if (!resolvedOrgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_kcc_activity')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecords(data || []);
    } catch (e: any) {
      console.error('[KCC] fetch error:', e);
      toast.error('Failed to load Kingdom Connect activity');
    } finally {
      setLoading(false);
    }
  }

  // Summary counts (all time)
  const total        = records.length;
  const membershipCt = records.filter(r => r.visitor_intent === 'membership').length;
  const prayerCt     = records.filter(r => r.visitor_intent === 'prayer').length;
  const volunteerCt  = records.filter(r => r.visitor_intent === 'volunteer').length;
  const eventCt      = records.filter(r => r.visitor_intent === 'event').length;

  const summaryCards = [
    { label: 'Total Connections', value: total,        icon: Zap,      color: 'text-violet-500' },
    { label: 'Membership Apps', value: membershipCt, icon: Users,    color: 'text-violet-400' },
    { label: 'Prayer Requests', value: prayerCt,     icon: Heart,    color: 'text-blue-500'   },
    { label: 'Volunteers',      value: volunteerCt,  icon: UserPlus, color: 'text-emerald-500' },
    { label: 'Event Sign-ups',  value: eventCt,      icon: Calendar, color: 'text-amber-500'  },
  ];

  const filtered = records.filter(r => {
    const matchFilter = filter === 'all' || r.visitor_intent === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (r.first_name  || '').toLowerCase().includes(q) ||
      (r.last_name   || '').toLowerCase().includes(q) ||
      (r.email       || '').toLowerCase().includes(q) ||
      (r.visitor_intent || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">Kingdom Connect</h1>
            <p className="text-xs text-muted-foreground font-medium">Live connection requests from the Kingdom Connect Card</p>
          </div>
        </div>
        <button
          onClick={fetchActivity}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards (last 7 days) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-black text-foreground">{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">all time</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === tab.key
                  ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 w-56"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No submissions found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'No KCC activity yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intent</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Time</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const intent     = row.visitor_intent || 'inquiry';
                  const label      = INTENT_LABELS[intent] || intent;
                  const colorClass = INTENT_COLORS[intent] || INTENT_COLORS.inquiry;
                  const fullName   = [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Anonymous';
                  const mcHref     = MC_LINKS[intent] || MC_LINKS.default;

                  return (
                    <tr key={row.id || i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-black text-violet-500">
                              {(row.first_name?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground text-xs truncate max-w-[120px]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {row.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{row.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colorClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground capitalize">{row.how_heard || 'web'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          row.status === 'analyzed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : row.status === 'new'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {row.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{row.created_at ? format(new Date(row.created_at), 'MMM d, h:mm a') : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={mcHref}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-500 hover:text-violet-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Showing {filtered.length} of {records.length} total records
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <BookOpen className="w-3 h-3" />
                <span>Kingdom Connect Activity Log</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
