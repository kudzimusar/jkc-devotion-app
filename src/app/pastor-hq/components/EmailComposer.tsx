'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, Loader2 } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailComposerProps {
  orgId: string;
  recipientEmail?: string;
  recipientName?: string;
  context?: string;
  onClose: () => void;
}

export function EmailComposer({
  orgId,
  recipientEmail,
  recipientName,
  context,
  onClose,
}: EmailComposerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'individual' | 'segment'>(
    recipientEmail ? 'individual' : 'segment'
  );
  const [segment, setSegment] = useState('all_members');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('email_templates')
      .select('*')
      .eq('org_id', orgId)
      .then(({ data }) => setTemplates(data || []));
  }, [orgId]);

  function applyTemplate(id: string) {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    setSelectedTemplate(id);
    setSubject(t.subject);
    let b = t.body;
    if (recipientName) b = b.replace(/{member_name}/g, recipientName);
    if (context) b = b.replace(/{inquiry_topic}/g, context);
    setBody(b);
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        org_id: orgId,
        channel: 'email',
        subject,
        body,
        audience_scope: audience === 'individual' ? 'direct_reply' : segment,
      };
      if (audience === 'individual' && recipientEmail) {
        payload.recipient_email = recipientEmail;
        payload.recipient_name = recipientName || '';
      }

      const { error: fnError } = await supabase.functions.invoke('coce-dispatch', {
        body: payload,
      });

      if (fnError) throw fnError;
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to send. Check Brevo configuration.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
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
          {/* Success */}
          {sent && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold text-center">
              Email dispatched successfully
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Template */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Load Template
              </label>
              <select
                value={selectedTemplate}
                onChange={e => applyTemplate(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background text-xs font-medium px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="">— Select a template —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Audience */}
          {!recipientEmail && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Audience
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    value="segment"
                    checked={audience === 'segment'}
                    onChange={() => setAudience('segment')}
                    className="accent-violet-600"
                  />
                  Segment
                </label>
              </div>
              <select
                value={segment}
                onChange={e => setSegment(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background text-xs font-medium px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="all_members">All Members</option>
                <option value="visitors">New Visitors</option>
                <option value="volunteers">Volunteers</option>
                <option value="leaders">Leaders</option>
              </select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full h-10 rounded-xl border border-border bg-background text-xs font-medium px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              className="w-full rounded-xl border border-border bg-background text-xs font-medium p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || sent}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-violet-500/25"
          >
            {sending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Send Email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
