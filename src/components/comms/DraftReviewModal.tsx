'use client';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { approveDraft, saveDraftEdits, rejectDraft } from '@/app/actions/comms-draft-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Save, XCircle, ChevronDown, ChevronUp, Code, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DraftReviewModalProps {
  draftId: string;
  open: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function DraftReviewModal({ draftId, open, onClose, onApproved }: DraftReviewModalProps) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ja'>('en');
  const [showReasoning, setShowReasoning] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [subjectEn, setSubjectEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [subjectJa, setSubjectJa] = useState('');
  const [bodyJa, setBodyJa] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!open || !draftId) return;
    setLoading(true);
    supabase
      .from('communication_drafts')
      .select('*')
      .eq('id', draftId)
      .single()
      .then(({ data }) => {
        if (data) {
          setDraft(data);
          setSubjectEn(data.subject_en ?? '');
          setBodyEn(data.body_en ?? '');
          setSubjectJa(data.subject_ja ?? '');
          setBodyJa(data.body_ja ?? '');
        }
        setLoading(false);
      });
  }, [draftId, open]);

  // Cmd+Enter = approve
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleApprove();
    }
  }, [draftId]);

  useEffect(() => {
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  const handleApprove = async () => {
    // Save any edits first
    await saveDraftEdits(draftId, { subject_en: subjectEn, body_en: bodyEn, subject_ja: subjectJa, body_ja: bodyJa });
    setApproving(true);
    const result = await approveDraft(draftId);
    setApproving(false);
    if (result.success) {
      toast.success('Draft approved and sent!');
      onApproved?.();
      onClose();
    } else {
      toast.error(`Failed to send: ${result.error}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveDraftEdits(draftId, { subject_en: subjectEn, body_en: bodyEn, subject_ja: subjectJa, body_ja: bodyJa });
    setSaving(false);
    if (result.success) toast.success('Draft saved');
    else toast.error(`Save failed: ${result.error}`);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setRejecting(true);
    const result = await rejectDraft(draftId, rejectReason);
    setRejecting(false);
    if (result.success) {
      toast.info('Draft rejected');
      onClose();
    } else {
      toast.error(`Reject failed: ${result.error}`);
    }
  };

  // Countdown to auto-send
  const getCountdown = () => {
    if (!draft?.auto_send_at) return null;
    const diff = new Date(draft.auto_send_at).getTime() - Date.now();
    if (diff <= 0) return 'Sending soon…';
    const mins = Math.floor(diff / 60000);
    return `Sends in ${mins} min`;
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            ) : !draft ? (
              <div className="p-8 text-center text-muted-foreground">Draft not found</div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-violet-500/15 text-violet-400 tracking-widest uppercase">
                        {(draft.campaign_type ?? '').replace(/_/g, ' ')}
                      </span>
                      {draft.auto_send_at && (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                          ⏱ {getCountdown()}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        ~{draft.estimated_recipients ?? 0} recipients
                      </span>
                    </div>
                    {/* AI confidence bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Confidence</span>
                      <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                          style={{ width: `${Math.round((draft.ai_confidence ?? 0) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70">
                        {Math.round((draft.ai_confidence ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* AI reasoning (collapsible) */}
                  {draft.ai_reasoning && (
                    <div className="rounded-lg border border-white/5 bg-white/3 overflow-hidden">
                      <button
                        onClick={() => setShowReasoning(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        AI Reasoning
                        {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {showReasoning && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground italic">{draft.ai_reasoning}</div>
                      )}
                    </div>
                  )}

                  {/* Language tabs */}
                  <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
                    {(['en', 'ja'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
                          lang === l ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {l === 'en' ? 'English' : '日本語'}
                      </button>
                    ))}
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                    <input
                      value={lang === 'en' ? subjectEn : subjectJa}
                      onChange={e => lang === 'en' ? setSubjectEn(e.target.value) : setSubjectJa(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                      placeholder="Email subject line…"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Body</label>
                      <button
                        onClick={() => setSourceMode(v => !v)}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                          sourceMode ? 'text-violet-400 hover:text-violet-300' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        {sourceMode ? 'Source' : 'Edit'}
                      </button>
                    </div>
                    {sourceMode ? (
                      /* Source view — raw HTML for advanced users */
                      <textarea
                        value={lang === 'en' ? bodyEn : bodyJa}
                        onChange={e => lang === 'en' ? setBodyEn(e.target.value) : setBodyJa(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-y font-mono"
                        placeholder="Email body (HTML)…"
                      />
                    ) : (
                      /* Edit view — contentEditable so pastors see formatted text */
                      <div
                        key={lang}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: lang === 'en' ? bodyEn : bodyJa }}
                        onBlur={e => {
                          const html = e.currentTarget.innerHTML;
                          if (lang === 'en') setBodyEn(html);
                          else setBodyJa(html);
                        }}
                        data-placeholder="Click to edit…"
                        className={`w-full min-h-[240px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50 transition-colors overflow-auto prose prose-invert max-w-none
                          empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none`}
                      />
                    )}
                  </div>

                  {/* Reject panel */}
                  {showReject && (
                    <div className="space-y-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <label className="text-[10px] font-black uppercase tracking-widest text-red-400">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-red-500/30 text-sm text-foreground focus:outline-none"
                        placeholder="Why is this draft being rejected?"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={rejecting}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Confirm Reject
                        </button>
                        <button onClick={() => setShowReject(false)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10">
                  <button
                    onClick={() => setShowReject(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground/70 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Draft
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve & Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
