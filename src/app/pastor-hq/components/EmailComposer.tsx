'use client';

// ARCHITECTURE NOTE: Uses supabase.functions.invoke() directly
// (Static export constraint prevents API routes)
// JWT passed automatically by Supabase SDK
// FLOW: coce-compose (create draft) → PATCH campaign (subject/body) → coce-dispatch (send)

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, Loader2, Search } from 'lucide-react';

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

interface EmailComposerProps {
  orgId: string;
  userId: string;
  recipientEmail?: string;
  recipientName?: string;
  context?: string;
  onClose: () => void;
}

export function EmailComposer({
  orgId,
  userId,
  recipientEmail,
  recipientName,
  context,
  onClose,
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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.');
      return;
    }
    if (audienceType === 'individual' && !selectedMember?.email && !recipientEmail) {
      setError('Please select a member to send to.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const audiencePayload = getAudiencePayload();

      // Step 1: Create campaign via coce-compose
      // Pass subject as intent so it saves directly — no PATCH needed
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

      // Step 2: Dispatch immediately
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
            {recipientEmail && (
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-500/25"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
