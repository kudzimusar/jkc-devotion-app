'use client';

// ARCHITECTURE NOTE: Uses supabase.functions.invoke() directly
// FLOW: coce-ai-brain (create draft) → DraftReviewModal (review/edit) → approveDraft (send)

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DraftReviewModal } from '@/components/comms/DraftReviewModal';
import { approveDraft, saveDraftEdits } from '@/app/actions/comms-draft-actions';
import { X, Send, Loader2, Search, Zap, Save } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  audience_scope: string;
}

interface MemberResult {
  id: string;
  name: string;
  email: string;
}

interface FromAccount {
  id: string;
  email_address: string;
  display_name: string | null;
  provider: string;
  account_color: string | null;
}

interface EmailComposerProps {
  orgId: string;
  userId: string;
  recipientEmail?: string;
  recipientName?: string;
  context?: string;
  onClose: () => void;
  /** When set, sends via the external account instead of Church OS (Brevo) */
  fromAccount?: FromAccount | null;
}

export function EmailComposer({
  orgId,
  userId,
  recipientEmail,
  recipientName,
  context,
  onClose,
  fromAccount,
}: EmailComposerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState<'individual' | 'segment'>(
    recipientEmail ? 'individual' : 'segment'
  );
  const [segment, setSegment] = useState('org_wide');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(
    recipientEmail ? { id: '', name: recipientName || '', email: recipientEmail } : null
  );
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  // AI brain draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDraftReview, setShowDraftReview] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    supabase
      .from('email_templates')
      .select('id, name, subject, body, category, audience_scope')
      .eq('org_id', orgId)
      .order('category')
      .then(({ data }) => setTemplates(data || []));
  }, [orgId]);

  // Member search typeahead — debounced, 2+ chars
  useEffect(() => {
    if (memberSearch.length < 2) { setMemberResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('org_id', orgId)
        .or(`name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%`)
        .limit(6);
      setMemberResults((data || []).filter(m => m.email));
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, orgId]);

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    setSelectedTemplate(id);
    setSubject(t.subject);
    let b = t.body;
    const name = selectedMember?.name || recipientName || 'Friend';
    b = b.replace(/{member_name}/g, name);
    if (context) b = b.replace(/{inquiry_topic}/g, context);
    b = b.replace(/{body}/g, '');
    setBody(b);
    if (t.audience_scope === 'individual') setAudienceType('individual');
  }

  // Maps UI segment labels → valid audience_scope + filter for coce-dispatch
  function getAudiencePayload(): {
    audience_scope: string;
    target_id: string;
    audience_filter: Record<string, string>;
  } {
    if (audienceType === 'individual') {
      return {
        audience_scope: 'individual',
        target_id: selectedMember?.email || recipientEmail || '',
        audience_filter: { target_id: selectedMember?.email || recipientEmail || '' },
      };
    }
    const segmentMap: Record<string, { scope: string; filter: Record<string, string> }> = {
      org_wide:     { scope: 'org_wide',  filter: {} },
      new_visitors: { scope: 'segment',   filter: { segment: 'new_visitors' } },
      members:      { scope: 'segment',   filter: { segment: 'members' } },
      leaders:      { scope: 'role',      filter: { role: 'leaders' } },
      volunteers:   { scope: 'role',      filter: { role: 'volunteers' } },
    };
    const mapped = segmentMap[segment] || segmentMap.org_wide;
    return {
      audience_scope: mapped.scope,
      target_id: mapped.filter.segment || mapped.filter.role || '',
      audience_filter: mapped.filter,
    };
  }

  /** Draft with AI brain (preferred path) */
  async function handleDraftWithAI() {
    if (!body.trim()) { setError('Please write your message intent first.'); return; }
    const audiencePayload = getAudiencePayload();
    setDrafting(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coce-ai-brain`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: orgId,
            trigger_source: 'manual',
            campaign_type: 'broadcast',
            audience_scope: audiencePayload.audience_scope,
            audience_filter: audiencePayload.audience_filter || null,
            recipient_id: selectedMember?.id || null,
            human_requested_by: userId,
            context_data: { intent: body, subject_hint: subject },
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraftId(data.draft_id);
      setAiConfidence(data.confidence);
      setAiReasoning(data.reasoning);
      // Pre-fill subject/body from AI if empty
      if (!subject && data.subject_en) setSubject(data.subject_en);
      if (data.body_en) setBody(data.body_en);
      setShowDraftReview(true);
    } catch (e: any) {
      setError(e?.message || 'AI draft failed. Try again or send directly.');
    } finally {
      setDrafting(false);
    }
  }

  /** Save current form as a draft without sending */
  async function handleSaveAsDraft() {
    if (!draftId) {
      // Create a draft first
      await handleDraftWithAI();
      return;
    }
    setSending(true);
    await saveDraftEdits(draftId, { subject_en: subject, body_en: body });
    setSending(false);
    setSent(true);
    setTimeout(onClose, 1500);
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.');
      return;
    }
    if (audienceType === 'individual' && !selectedMember?.email && !recipientEmail) {
      setError('Please select a member to send to.');
      return;
    }

    // External account send path
    if (fromAccount) {
      setSending(true);
      setError('');
      try {
        const toEmails = audienceType === 'individual' && selectedMember?.email
          ? [selectedMember.email]
          : recipientEmail
          ? [recipientEmail]
          : [];
        if (toEmails.length === 0) {
          setError('Please select a recipient.');
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-send-from-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              account_id: fromAccount.id,
              to: toEmails,
              subject,
              body_text: body,
              body_html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || 'Failed to send');
        }
        setSent(true);
        setTimeout(onClose, 1500);
      } catch (e: any) {
        setError(e?.message || 'Failed to send via external account.');
      } finally {
        setSending(false);
      }
      return;
    }

    // If we have a draft from AI, approve it
    if (draftId) {
      setSending(true);
      setError('');
      try {
        await saveDraftEdits(draftId, { subject_en: subject, body_en: body });
        const result = await approveDraft(draftId);
        if (!result.success) throw new Error(result.error);
        setSent(true);
        setTimeout(onClose, 1500);
      } catch (e: any) {
        setError(e?.message || 'Failed to send.');
      } finally {
        setSending(false);
      }
      return;
    }

    // Legacy path: direct coce-compose → coce-dispatch
    setSending(true);
    setError('');
    try {
      const audiencePayload = getAudiencePayload();
      const { data: composeData, error: composeError } = await supabase.functions.invoke('coce-compose', {
        body: {
          org_id: orgId,
          intent: body,
          subject_override: subject,
          campaign_type: 'newsletter',
          audience_scope: audiencePayload.audience_scope,
          target_id: audiencePayload.target_id || null,
          audience_filter: audiencePayload.audience_filter || null,
          channels: ['email'],
          created_by: userId,
        },
      });
      if (composeError) throw composeError;
      const campaignId = composeData?.campaign_id;
      if (!campaignId) throw new Error('No campaign ID returned from compose');
      const { error: dispatchError } = await supabase.functions.invoke('coce-dispatch', {
        body: { campaign_id: campaignId },
      });
      if (dispatchError) throw dispatchError;
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-card rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-black text-lg uppercase tracking-tight">Email sent successfully</p>
        </div>
      </div>
    );
  }

  const templatesByCategory = templates.reduce<Record<string, EmailTemplate[]>>((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">Compose Email</h2>
            {fromAccount && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: fromAccount.account_color || '#94a3b8' }}
                />
                <p className="text-[10px] text-muted-foreground font-medium">
                  Sending from {fromAccount.display_name
                    ? `${fromAccount.display_name} (${fromAccount.email_address})`
                    : fromAccount.email_address}
                </p>
              </div>
            )}
            {recipientEmail && !fromAccount && (
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                To: {recipientName ? `${recipientName} (${recipientEmail})` : recipientEmail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Template selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
              Load Template
            </label>
            <select
              value={selectedTemplate}
              onChange={e => applyTemplate(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="">— Select a template —</option>
              {Object.entries(templatesByCategory).map(([cat, temps]) => (
                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                  {temps.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
              Audience
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={audienceType === 'individual'}
                  onChange={() => setAudienceType('individual')}
                  className="accent-violet-600"
                />
                Individual Member
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={audienceType === 'segment'}
                  onChange={() => setAudienceType('segment')}
                  className="accent-violet-600"
                />
                Segment
              </label>
            </div>

            {audienceType === 'segment' ? (
              <select
                value={segment}
                onChange={e => setSegment(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="org_wide">All Members</option>
                <option value="new_visitors">New Visitors</option>
                <option value="members">Full Members</option>
                <option value="leaders">Leaders</option>
                <option value="volunteers">Volunteers / Partners</option>
              </select>
            ) : (
              <div>
                {selectedMember ? (
                  <div className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                    <span className="text-sm font-medium">
                      {selectedMember.name} {selectedMember.email ? `— ${selectedMember.email}` : ''}
                    </span>
                    <button
                      onClick={() => { setSelectedMember(null); setMemberSearch(''); }}
                      className="text-muted-foreground hover:text-foreground ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search member by name or email..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full border border-border rounded-xl pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                    {memberResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {memberResults.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMember(m); setMemberSearch(''); setMemberResults([]); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex flex-col"
                          >
                            <span className="font-medium">{m.name}</span>
                            <span className="text-muted-foreground text-xs">{m.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Compose your message..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>

        {/* AI confidence panel (shown after AI draft) */}
        {aiConfidence !== null && (
          <div className="px-6 pb-2">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">AI Confidence</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-400" style={{ width: `${Math.round(aiConfidence * 100)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-violet-300">{Math.round(aiConfidence * 100)}%</span>
              </div>
              {aiReasoning && <p className="text-xs text-muted-foreground italic">{aiReasoning}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-border flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAsDraft}
              disabled={sending || drafting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDraftWithAI}
              disabled={drafting || sending || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-black uppercase tracking-wider hover:bg-amber-500/25 disabled:opacity-50 transition-all"
            >
              {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Draft with AI
            </button>
            <button
              onClick={handleSend}
              disabled={sending || drafting || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-500/25"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Now</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Draft Review Modal */}
      {draftId && (
        <DraftReviewModal
          draftId={draftId}
          open={showDraftReview}
          onClose={() => { setShowDraftReview(false); }}
          onApproved={() => { setSent(true); setTimeout(onClose, 1500); }}
        />
      )}
    </div>
  );
}
