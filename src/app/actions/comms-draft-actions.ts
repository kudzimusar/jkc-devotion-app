'use server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Levenshtein ratio: 0 = identical, 1 = completely different */
function editDistance(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a || !b) return 1;
  const lenA = a.length, lenB = b.length;
  // Use character count ratio as a lightweight proxy
  const longer = Math.max(lenA, lenB);
  const shorter = Math.min(lenA, lenB);
  return parseFloat(((longer - shorter) / longer).toFixed(2));
}

export async function approveDraft(draftId: string): Promise<{ success: boolean; campaign_id?: string; error?: string }> {
  // Fetch the draft
  const { data: draft, error: fetchErr } = await supabaseAdmin
    .from('communication_drafts')
    .select('*')
    .eq('id', draftId)
    .single();

  if (fetchErr || !draft) {
    return { success: false, error: fetchErr?.message ?? 'Draft not found' };
  }

  // Mark as approved
  await supabaseAdmin
    .from('communication_drafts')
    .update({ review_status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', draftId);

  // Create a campaign from the draft and dispatch immediately
  const { data: campaign, error: campErr } = await supabaseAdmin
    .from('communication_campaigns')
    .insert({
      org_id: draft.org_id,
      title: draft.subject_en ?? `Draft: ${draft.campaign_type}`,
      campaign_type: draft.campaign_type,
      subject_en: draft.subject_en,
      subject_ja: draft.subject_ja,
      body_en: draft.body_en,
      body_ja: draft.body_ja,
      channels: ['email'],
      audience_scope: draft.audience_scope,
      audience_filter: draft.audience_filter,
      status: 'draft',
      trigger_type: 'manual',
      ai_drafted: true,
      draft_id: draftId,
    })
    .select('id')
    .single();

  if (campErr || !campaign) {
    return { success: false, error: campErr?.message ?? 'Campaign insert failed' };
  }

  // Resolve recipient emails and insert delivery rows
  try {
    const recipients: { member_id?: string; recipient_email: string }[] = [];

    if (draft.audience_scope === 'individual' && draft.recipient_id) {
      // Try member_communication_profiles first
      const { data: mcp } = await supabaseAdmin
        .from('member_communication_profiles')
        .select('member_id, email')
        .eq('member_id', draft.recipient_id)
        .single();

      if (mcp?.email) {
        recipients.push({ member_id: draft.recipient_id, recipient_email: mcp.email });
      } else {
        // Fall back to auth user record
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(draft.recipient_id);
        if (user?.email) {
          recipients.push({ member_id: draft.recipient_id, recipient_email: user.email });
        }
      }
    } else {
      // Org-wide: gather all active communication profiles
      const { data: profiles } = await supabaseAdmin
        .from('member_communication_profiles')
        .select('member_id, email')
        .eq('org_id', draft.org_id)
        .not('email', 'is', null);

      for (const p of profiles ?? []) {
        if (p.email) recipients.push({ member_id: p.member_id, recipient_email: p.email });
      }
    }

    if (recipients.length > 0) {
      await supabaseAdmin.from('communication_deliveries').insert(
        recipients.map(r => ({
          campaign_id: campaign.id,
          org_id: draft.org_id,
          member_id: r.member_id ?? null,
          recipient_email: r.recipient_email,
          channel: 'email',
          status: 'pending',
        }))
      );
    }
  } catch (deliveryErr) {
    // Non-fatal: deliveries are best-effort; dispatch still proceeds
    console.warn('[approveDraft] delivery insert warning:', deliveryErr);
  }

  // Fire coce-dispatch
  const dispatchRes = await fetch(`${SUPABASE_URL}/functions/v1/coce-dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ campaign_id: campaign.id }),
  });

  if (!dispatchRes.ok) {
    const errText = await dispatchRes.text();
    console.error('[approveDraft] dispatch error:', errText);
    return { success: false, error: `Dispatch failed: ${errText}` };
  }

  return { success: true, campaign_id: campaign.id };
}

export async function saveDraftEdits(
  draftId: string,
  edits: { subject_en?: string; body_en?: string; subject_ja?: string; body_ja?: string }
): Promise<{ success: boolean; error?: string }> {
  const { data: draft } = await supabaseAdmin
    .from('communication_drafts')
    .select('original_ai_subject_en, original_ai_body_en')
    .eq('id', draftId)
    .single();

  const distance = editDistance(
    draft?.original_ai_body_en ?? '',
    edits.body_en ?? ''
  );

  const { error } = await supabaseAdmin
    .from('communication_drafts')
    .update({
      ...edits,
      review_status: 'in_review',
      edit_distance: distance,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', draftId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rejectDraft(draftId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('communication_drafts')
    .update({
      review_status: 'rejected',
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', draftId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function draftNewsletter(params: {
  org_id: string;
  newsletter_type: string;
  audience_scope: string;
  user_input?: Record<string, any>;
  snapshot_id?: string;
}): Promise<{ draft_id?: string; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/coce-ai-brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_id: params.org_id,
      trigger_source: 'manual',
      campaign_type: `newsletter_${params.newsletter_type}`,
      audience_scope: params.audience_scope,
      context_data: { user_input: params.user_input ?? {}, snapshot_id: params.snapshot_id },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { error: err };
  }

  const data = await res.json();
  return { draft_id: data.draft_id };
}
