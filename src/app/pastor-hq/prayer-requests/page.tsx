'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePastorCtx } from '../pastor-context';
import { withRoleGuard } from '@/components/auth/withRoleGuard';
import { Heart, RefreshCw, Loader2, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface PrayerRequest {
  id: string;
  request_text: string;
  category: string | null;
  urgency: string;
  status: string;
  is_anonymous: boolean;
  requires_pastoral_contact: boolean;
  created_at: string;
  inquiry_id: string | null;
}

const URGENCY_STYLES: Record<string, string> = {
  High:   'bg-red-500/10 text-red-600 border-red-500/20',
  Normal: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const URGENCY_TABS = ['all', 'High', 'Normal'];

function PrayerRequestsPage() {
  const { orgId } = usePastorCtx();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => {
    if (orgId) fetchPrayers();
  }, [orgId]);

  async function fetchPrayers() {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('id, request_text, category, urgency, status, is_anonymous, requires_pastoral_contact, created_at, inquiry_id')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (!error) setPrayers(data || []);
    setLoading(false);
  }

  async function markAnswered(id: string) {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ status: 'answered', answered_date: new Date().toISOString().split('T')[0] })
      .eq('id', id);
    if (!error) setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: 'answered' } : p));
  }

  const filtered = prayers.filter(p => {
    const matchUrgency = filterUrgency === 'all' || p.urgency === filterUrgency;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchUrgency && matchStatus;
  });

  const highCount = prayers.filter(p => p.urgency === 'High' && p.status === 'active').length;
  const activeCount = prayers.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Prayer Requests</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {activeCount} active &mdash; {highCount} high priority
            </p>
          </div>
        </div>
        <button
          onClick={fetchPrayers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {URGENCY_TABS.map(u => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterUrgency === u
                  ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {u === 'all' ? 'All Urgency' : u}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['active', 'answered', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === s
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No prayer requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prayer => {
            const urgencyStyle = URGENCY_STYLES[prayer.urgency] || URGENCY_STYLES.Normal;
            return (
              <div
                key={prayer.id}
                className="rounded-2xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${urgencyStyle}`}>
                      {prayer.urgency} Urgency
                    </span>
                    {prayer.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                        {prayer.category}
                      </span>
                    )}
                    {prayer.is_anonymous && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20 uppercase tracking-wider">
                        Anonymous
                      </span>
                    )}
                    {prayer.requires_pastoral_contact && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20">
                        <Phone className="w-2.5 h-2.5" />
                        Pastoral Contact
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {prayer.created_at ? format(new Date(prayer.created_at), 'MMM d, yyyy') : '—'}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {prayer.request_text || 'No request text provided.'}
                </p>

                {prayer.status === 'active' && (
                  <div className="pt-1">
                    <button
                      onClick={() => markAnswered(prayer.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-colors"
                    >
                      Mark Answered
                    </button>
                  </div>
                )}
                {prayer.status === 'answered' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Answered
                  </span>
                )}
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground font-semibold text-right pt-1">
            Showing {filtered.length} of {prayers.length} prayer requests
          </p>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(PrayerRequestsPage, ['pastor', 'super_admin', 'owner']);
