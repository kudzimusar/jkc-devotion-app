'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePastorCtx } from '../pastor-context';
import { InquiryList } from '../components/InquiryList';
import { Mail, Search, RefreshCw, Loader2 } from 'lucide-react';
import { withRoleGuard } from '@/components/auth/withRoleGuard';

export interface Inquiry {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  message: string | null;
  prayer_request: string | null;
  visitor_intent: string | null;
  how_heard: string | null;
  status: string;
  created_at: string;
}

const STATUS_TABS = ['all', 'new', 'analyzed', 'responded', 'archived'];

function InquiriesPage() {
  const { orgId } = usePastorCtx();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (orgId) fetchInquiries();
  }, [orgId]);

  async function fetchInquiries() {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('public_inquiries')
      .select('id, first_name, last_name, email, message, prayer_request, visitor_intent, how_heard, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (!error) setInquiries(data || []);
    setLoading(false);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const { error } = await supabase
      .from('public_inquiries')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  }

  const filtered = inquiries.filter(i => {
    const matchFilter = filter === 'all' || i.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.first_name || '').toLowerCase().includes(q) ||
      (i.last_name || '').toLowerCase().includes(q) ||
      (i.email || '').toLowerCase().includes(q) ||
      (i.visitor_intent || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Website Inquiries</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {inquiries.length} total &mdash; {newCount} new
            </p>
          </div>
        </div>
        <button
          onClick={fetchInquiries}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === tab
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email, intent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-56"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Mail className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No inquiries found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {filter !== 'all' ? 'Try a different filter' : 'No submissions yet'}
          </p>
        </div>
      ) : (
        <InquiryList inquiries={filtered} orgId={orgId || ''} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}

export default withRoleGuard(InquiriesPage, ['pastor', 'super_admin', 'owner']);
