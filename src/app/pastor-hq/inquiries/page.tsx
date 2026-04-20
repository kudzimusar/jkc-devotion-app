'use client';

// SCHEMA NOTE: Real data uses first_name + last_name (not single 'name' field)
// SCHEMA NOTE: visitor_intent is a direct enum (not FK join to inquiry_types)
// SCHEMA NOTE: Status enum: 'new' | 'in_progress' | 'responded' | 'archived'


import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePastorCtx } from '../pastor-context';
import { Mail, Search, RefreshCw, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';


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
  const { orgId, userId } = usePastorCtx();
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
        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="divide-y divide-border/50">
            {filtered.map(inquiry => (
              <div key={inquiry.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{inquiry.first_name} {inquiry.last_name}</h3>
                      <p className="text-[10px] text-muted-foreground">{inquiry.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inquiry.visitor_intent && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">
                        {inquiry.visitor_intent}
                      </span>
                    )}
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                      inquiry.status === 'new' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {inquiry.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground/70 line-clamp-2 italic mb-3">"{inquiry.message}"</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">
                    Received {format(new Date(inquiry.created_at), 'MMM dd, HH:mm')}
                  </span>
                  <a href={`mailto:${inquiry.email}`} className="text-[9px] font-black text-blue-500 uppercase hover:underline">Reply Now</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InquiriesPage;
