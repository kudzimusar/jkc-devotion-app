'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ThreadDetail } from './ThreadDetail';
import { DraftReviewModal } from './DraftReviewModal';
import { NewsletterTypeSelector } from './NewsletterTypeSelector';
import { EmailComposer } from '@/app/pastor-hq/components/EmailComposer';
import {
  Mail, MessageCircle, Smartphone, AlertTriangle, Loader2, Plus, BarChart3,
  Globe, FileText, Inbox, ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type CommsUserRole =
  | 'super_admin' | 'owner' | 'pastor' | 'shepherd' | 'admin'
  | 'ministry_lead' | 'ministry_leader' | 'elder' | 'deacon' | 'member';

interface CommsTabProps {
  userId: string;
  orgId: string;
  userRole: CommsUserRole;
  scopedMinistryId?: string;
  defaultTab?: string;
}

interface ConnectedAccount {
  id: string;
  email_address: string;
  display_name: string | null;
  provider: string;
  account_color: string | null;
  can_send_from: boolean;
  show_in_unified_inbox: boolean;
}

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail, line: MessageCircle, sms: Smartphone,
};
const TONE_COLORS: Record<string, string> = {
  crisis: 'bg-red-500/20 text-red-400',
  urgent: 'bg-orange-500/20 text-orange-400',
  joy: 'bg-emerald-500/20 text-emerald-400',
  gratitude: 'bg-blue-500/20 text-blue-400',
  neutral: 'bg-white/10 text-muted-foreground',
  confusion: 'bg-yellow-500/20 text-yellow-400',
  anger: 'bg-red-500/20 text-red-400',
};
const PRIORITY_COLORS: Record<string, string> = {
  crisis: 'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};
const PROVIDER_LABELS: Record<string, string> = {
  gmail: 'Gmail', outlook: 'Outlook', yahoo: 'Yahoo', icloud: 'iCloud',
  imap: 'IMAP', church_os: 'Church OS', custom_domain: 'Custom Domain',
};

const INBOX_FILTERS = ['All', 'Unread', 'Crisis', 'Email', 'LINE', 'SMS'];

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommsTab({
  userId, orgId, userRole, scopedMinistryId, defaultTab,
}: CommsTabProps) {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(defaultTab ?? 'inbox');
  const [threads, setThreads] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [lineEvents, setLineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inboxFilter, setInboxFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState<string | null>(null); // null=All
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [showNewsletterSelector, setShowNewsletterSelector] = useState(false);

  // Connected accounts (for filter chips + compose dropdown)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // Compose dropdown
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeAccount, setComposeAccount] = useState<ConnectedAccount | null | undefined>(undefined);
  // undefined = not composing; null = Church OS; ConnectedAccount = external
  const composeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('dashboard_comms_config')
      .select('*')
      .eq('role', userRole)
      .single()
      .then(({ data }) => setConfig(data));
  }, [userRole]);

  // Load connected accounts for filter bar and compose dropdown
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('connected_email_accounts')
      .select('id, email_address, display_name, provider, account_color, can_send_from, show_in_unified_inbox')
      .eq('member_id', userId)
      .eq('connection_status', 'active')
      .order('is_primary', { ascending: false })
      .then(({ data }) => setConnectedAccounts(data ?? []));
  }, [userId]);

  useEffect(() => {
    if (!orgId) return;
    loadTabData(activeTab);
  }, [activeTab, orgId, userId]);

  // Close compose dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (composeRef.current && !composeRef.current.contains(e.target as Node)) {
        setComposeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'inbox') {
        // Use v_unified_inbox to merge Church OS + external emails
        const { data } = await supabase
          .from('v_unified_inbox')
          .select('*')
          .eq('org_id', orgId)
          .eq('owner_id', userId)
          .order('occurred_at', { ascending: false })
          .limit(50);
        setThreads(data ?? []);
      } else if (tab === 'drafts') {
        const { data } = await supabase
          .from('communication_drafts')
          .select('*')
          .eq('org_id', orgId)
          .in('review_status', ['pending_review', 'in_review'])
          .order('auto_send_at', { ascending: true, nullsFirst: false });
        setDrafts(data ?? []);
      } else if (tab === 'newsletters') {
        const { data } = await supabase
          .from('newsletters')
          .select('*, communication_campaigns(total_sent, total_opened, sent_at)')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(30);
        setNewsletters(data ?? []);
      } else if (tab === 'social') {
        const { data } = await supabase
          .from('communication_events')
          .select('*')
          .eq('org_id', orgId)
          .eq('channel', 'line')
          .order('occurred_at', { ascending: false })
          .limit(10);
        setLineEvents(data ?? []);
      } else if (tab === 'analytics') {
        const { data } = await supabase
          .from('v_campaign_engagement')
          .select('*')
          .eq('org_id', orgId)
          .order('sent_at', { ascending: false })
          .limit(30);
        setAnalytics(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(item => {
    // Account filter (chips above INBOX_FILTERS)
    if (accountFilter === 'church_os') {
      if (item.source_type !== 'church_os') return false;
    } else if (accountFilter) {
      if (item.account_email !== accountFilter) return false;
    }
    // Channel / priority filters
    if (inboxFilter === 'Unread') return !item.is_read;
    if (inboxFilter === 'Crisis') return (item.ai_urgency_score ?? 0) >= 80 || item.priority === 'crisis';
    if (inboxFilter === 'Email') return item.channel === 'email' || item.source_type === 'external';
    if (inboxFilter === 'LINE') return item.channel === 'line';
    if (inboxFilter === 'SMS') return item.channel === 'sms';
    return true;
  });

  const tabs = [
    { key: 'inbox',       label: 'Inbox',       icon: Inbox,   show: true },
    { key: 'drafts',      label: 'Drafts',       icon: FileText, show: config?.show_drafts ?? userRole !== 'member' },
    { key: 'newsletters', label: 'Newsletters',  icon: Mail,    show: config?.show_newsletters ?? false },
    { key: 'social',      label: 'Social',       icon: Globe,   show: config?.show_social_media ?? false },
    { key: 'analytics',   label: 'Analytics',    icon: BarChart3, show: config?.show_analytics ?? false },
  ].filter(t => t.show);

  if (selectedThread) {
    return (
      <div className="h-[600px]">
        <ThreadDetail
          threadId={selectedThread}
          onClose={() => { setSelectedThread(null); loadTabData('inbox'); }}
        />
      </div>
    );
  }

  // Accounts that are visible in the unified inbox (for filter chips)
  const inboxAccounts = connectedAccounts.filter(a => a.show_in_unified_inbox);
  // Accounts that can send (for compose dropdown)
  const sendAccounts = connectedAccounts.filter(a => a.can_send_from);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === key
                ? 'bg-violet-600 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* ── INBOX ── */}
          {activeTab === 'inbox' && (
            <div className="space-y-3">
              {/* Account filter chips */}
              {inboxAccounts.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setAccountFilter(null)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                      accountFilter === null
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAccountFilter('church_os')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                      accountFilter === 'church_os'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    Church OS
                  </button>
                  {inboxAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setAccountFilter(acc.email_address)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                        accountFilter === acc.email_address
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: acc.account_color || '#94a3b8' }}
                      />
                      {acc.email_address.split('@')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Channel filter chips + Compose dropdown */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1.5 flex-wrap">
                  {INBOX_FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => setInboxFilter(f)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                        inboxFilter === f
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Compose dropdown */}
                <div className="relative" ref={composeRef}>
                  <button
                    onClick={() => setComposeOpen(o => !o)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Compose
                    <ChevronDown className={`w-3 h-3 transition-transform ${composeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {composeOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                      {sendAccounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => { setComposeAccount(acc); setComposeOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left hover:bg-white/5 transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: acc.account_color || '#94a3b8' }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{acc.display_name || acc.email_address}</p>
                            <p className="text-[10px] text-muted-foreground">{PROVIDER_LABELS[acc.provider] || acc.provider}</p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-border">
                        <button
                          onClick={() => { setComposeAccount(null); setComposeOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                          <div>
                            <p className="font-bold text-foreground">Church OS</p>
                            <p className="text-[10px] text-muted-foreground">via Brevo</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {filteredThreads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No messages found</p>
              ) : (
                <div className="space-y-1">
                  {filteredThreads.map(item => {
                    const isExternal = item.source_type === 'external';
                    const dotColor = isExternal
                      ? (item.account_color || '#94a3b8')
                      : '#7c3aed'; // violet for Church OS
                    const viaLabel = isExternal
                      ? `via ${PROVIDER_LABELS[item.provider] || item.provider || 'Email'}`
                      : 'via Church OS';
                    const ChIcon = CHANNEL_ICONS[item.channel ?? 'email'] ?? Mail;
                    const isUnread = !item.is_read;
                    const isHighPriority =
                      item.priority === 'crisis' ||
                      item.priority === 'urgent' ||
                      (item.ai_urgency_score ?? 0) >= 80;

                    return (
                      <button
                        key={item.id}
                        onClick={() => item.thread_id ? setSelectedThread(item.thread_id) : undefined}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/5 ${
                          isHighPriority
                            ? 'border border-red-500/20 bg-red-500/5'
                            : 'border border-white/5'
                        } ${!item.thread_id ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {/* Account color dot */}
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <ChIcon className="w-4 h-4 text-muted-foreground shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                              {item.subject ?? '(No subject)'}
                            </p>
                            {isUnread && (
                              <span className="shrink-0 w-4 h-4 rounded-full bg-violet-500 text-[9px] font-black text-white flex items-center justify-center">
                                •
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.from_name ?? item.from_email ?? ''}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50">{viaLabel}</p>
                          <p className="text-xs text-muted-foreground/60 truncate">
                            {item.preview ?? item.snippet ?? ''}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(item.occurred_at)}
                          </span>
                          {item.ai_tone && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${TONE_COLORS[item.ai_tone] ?? TONE_COLORS.neutral}`}>
                              {item.ai_tone}
                            </span>
                          )}
                          {isHighPriority && (
                            <span className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS['crisis']}`}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {item.priority ?? 'urgent'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── DRAFTS ── */}
          {activeTab === 'drafts' && (
            <div className="space-y-3">
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No drafts awaiting review</p>
              ) : drafts.map(draft => {
                const countdown = draft.auto_send_at ? (() => {
                  const diff = new Date(draft.auto_send_at).getTime() - Date.now();
                  if (diff <= 0) return 'Sending soon…';
                  const m = Math.floor(diff / 60000);
                  return `Sends in ${m}m`;
                })() : null;

                return (
                  <div key={draft.id} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 uppercase tracking-widest">
                            {(draft.campaign_type ?? '').replace(/_/g, ' ')}
                          </span>
                          {countdown && <span className="text-[10px] font-bold text-amber-400">⏱ {countdown}</span>}
                          <span className="text-[10px] text-muted-foreground">{draft.estimated_recipients ?? 0} recipients</span>
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">{draft.subject_en}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDraft(draft.id)}
                        className="shrink-0 px-4 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">AI Confidence</span>
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.round((draft.ai_confidence ?? 0) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70">
                        {Math.round((draft.ai_confidence ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── NEWSLETTERS ── */}
          {activeTab === 'newsletters' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewsletterSelector(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New
                </button>
              </div>
              {newsletters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No newsletters yet</p>
              ) : newsletters.map(nl => {
                const camp = Array.isArray(nl.communication_campaigns)
                  ? nl.communication_campaigns[0]
                  : nl.communication_campaigns;
                return (
                  <div key={nl.id} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {nl.subject ?? nl.title ?? 'Newsletter'}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {camp?.sent_at ? new Date(camp.sent_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                    {camp && (
                      <div className="flex gap-4">
                        <div className="text-[10px] text-muted-foreground">
                          Sent: <span className="text-foreground font-bold">{camp.total_sent ?? 0}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Opened: <span className="text-emerald-400 font-bold">{camp.total_opened ?? 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SOCIAL (LINE) ── */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LINE Messages</p>
              {lineEvents.length === 0 ? (
                <div className="p-6 rounded-xl border border-white/10 bg-white/3 text-center">
                  <p className="text-sm text-muted-foreground">No LINE messages yet</p>
                  <button className="mt-3 px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground">
                    Connect LINE
                  </button>
                </div>
              ) : lineEvents.map(event => (
                <div key={event.id} className="p-3 rounded-xl border border-white/10 bg-white/3 flex items-start gap-3">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/80 line-clamp-2">{event.preview ?? '(LINE message)'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(event.occurred_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              {userRole === 'super_admin' ? (
                <a
                  href="/super-admin/analytics/communications"
                  className="block px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400 text-xs font-black uppercase tracking-widest text-center hover:bg-violet-500/15"
                >
                  View Platform Analytics →
                </a>
              ) : analytics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Last 30 Campaigns — Open Rate
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.slice(0, 10).map(d => ({
                      name: (d.campaign_type ?? '').replace('newsletter_', '').substring(0, 8),
                      rate: d.open_rate ?? 0,
                    }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                      <Bar dataKey="rate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedDraft && (
        <DraftReviewModal
          draftId={selectedDraft}
          open={!!selectedDraft}
          onClose={() => { setSelectedDraft(null); loadTabData('drafts'); }}
          onApproved={() => loadTabData('drafts')}
        />
      )}
      <NewsletterTypeSelector
        open={showNewsletterSelector}
        onClose={() => setShowNewsletterSelector(false)}
        orgId={orgId}
      />

      {/* Email Composer (from compose dropdown) */}
      {composeAccount !== undefined && (
        <EmailComposer
          orgId={orgId}
          userId={userId}
          fromAccount={composeAccount}
          onClose={() => setComposeAccount(undefined)}
        />
      )}
    </div>
  );
}
