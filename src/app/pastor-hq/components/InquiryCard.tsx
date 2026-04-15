'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Mail, Clock, Reply } from 'lucide-react';
import { EmailComposer } from './EmailComposer';
import type { Inquiry } from '../inquiries/page';

const INTENT_LABELS: Record<string, string> = {
  membership:     'Membership',
  prayer:         'Prayer',
  prayer_request: 'Prayer Request',
  volunteer:      'Volunteer',
  event:          'Event',
  jkgroup:        'jkGroup',
  class_hoth:     'Heart of the House',
  class_language: 'Language Class',
  first_visit:    'First Visit',
  inquiry:        'General Inquiry',
};

const INTENT_COLORS: Record<string, string> = {
  membership:     'bg-violet-500/10 text-violet-600 border-violet-500/20',
  prayer:         'bg-blue-500/10 text-blue-600 border-blue-500/20',
  prayer_request: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  volunteer:      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  event:          'bg-amber-500/10 text-amber-600 border-amber-500/20',
  jkgroup:        'bg-pink-500/10 text-pink-600 border-pink-500/20',
  class_hoth:     'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  class_language: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  first_visit:    'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-amber-500/10 text-amber-600 border-amber-500/20',
  analyzed:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  responded: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  archived:  'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

interface InquiryCardProps {
  inquiry: Inquiry;
  orgId: string;
  onStatusChange: (id: string, status: string) => void;
}

export function InquiryCard({ inquiry, orgId, onStatusChange }: InquiryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const fullName = [inquiry.first_name, inquiry.last_name].filter(Boolean).join(' ') || 'Anonymous';
  const intent = inquiry.visitor_intent || 'inquiry';
  const intentLabel = INTENT_LABELS[intent] || intent;
  const intentColor = INTENT_COLORS[intent] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  const statusColor = STATUS_COLORS[inquiry.status] || STATUS_COLORS.new;
  const messageText = inquiry.message || inquiry.prayer_request || '';

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-black text-blue-500">
              {(inquiry.first_name?.[0] || '?').toUpperCase()}
            </span>
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{fullName}</p>
            {inquiry.email && (
              <p className="text-[10px] text-muted-foreground truncate">{inquiry.email}</p>
            )}
          </div>

          {/* Intent badge */}
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex-shrink-0 ${intentColor}`}>
            {intentLabel}
          </span>

          {/* Status badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusColor}`}>
            {inquiry.status}
          </span>

          {/* Time */}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
            <Clock className="w-3 h-3" />
            {inquiry.created_at ? format(new Date(inquiry.created_at), 'MMM d') : '—'}
          </div>

          <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-border/50 p-4 space-y-4 bg-muted/20">
            {messageText && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{messageText}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {inquiry.how_heard && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Source</p>
                  <p className="font-semibold capitalize">{inquiry.how_heard}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Submitted</p>
                <p className="font-semibold">
                  {inquiry.created_at ? format(new Date(inquiry.created_at), 'MMM d, yyyy h:mm a') : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={inquiry.status}
                onChange={e => onStatusChange(inquiry.id, e.target.value)}
                className="h-8 px-3 rounded-lg border border-border bg-background text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="new">New</option>
                <option value="analyzed">Analyzed</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>

              {inquiry.email && (
                <button
                  onClick={() => setShowComposer(true)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showComposer && inquiry.email && (
        <EmailComposer
          orgId={orgId}
          recipientEmail={inquiry.email}
          recipientName={fullName}
          context={intentLabel}
          onClose={() => setShowComposer(false)}
        />
      )}
    </>
  );
}
