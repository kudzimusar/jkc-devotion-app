"use client";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Upload, FileText, FileSpreadsheet, File, X, ChevronRight,
  ChevronLeft, Loader2, CheckCircle2, AlertTriangle, Users,
  Sparkles, RotateCcw, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ImportMode = "direct" | "pending";
export type DefaultMemberType = "member" | "visitor" | "leader" | "staff";

export interface ParsedMember {
  // Identity
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  nationality: string | null;
  preferred_language: string | null;
  // Church status
  membership_status: string | null;
  growth_stage: string | null;
  date_joined_church: string | null;
  first_visit_date: string | null;
  membership_date: string | null;
  baptism_status: string | null;
  baptism_date: string | null;
  salvation_date: string | null;
  marital_status: string | null;
  wedding_anniversary: string | null;
  foundations_completed: boolean | null;
  tithe_status: boolean | null;
  // Vocation & skills
  occupation: string | null;
  industry: string | null;
  education_level: string | null;
  skill_notes: string | null;
  // Church role
  role: string | null;
  ministry_name: string | null;
  ministry_role: string | null;
  cell_group_name: string | null;
  role_level: number | null;
  household_role: string | null;
  ordained_date: string | null;
  leadership_training_date: string | null;
  // Import intelligence
  pastoral_note: string | null;
  _household_key: string | null;
  secondary_ministry_names: string[];
  notes: string | null;
  // Meta
  _source_row: number;
  _allocation: "general_member" | "visitor_pipeline" | "ministry_member" | "leadership";
  _warnings: string[];
}

export interface ImportedFamily {
  family_key: string;
  family_name: string;
  head_name: string;
  spouse_name: string | null;
  children_names: string[];
  total_members: number;
  has_children: boolean;
}

export interface AllocationSummary {
  general_members: number;
  visitors: number;
  leadership: number;
  ministry_members: number;
  by_ministry: Record<string, number>;
}

export interface AIParseResult {
  document_type: string;
  total_rows: number;
  column_mapping: Record<string, string>;
  ai_confidence: Record<string, number>;
  members: ParsedMember[];
  families: ImportedFamily[];
  departments_found: string[];
  allocation_summary: AllocationSummary;
  warnings: string[];
}

interface Ministry { id: string; name: string; slug: string; }

export interface MemberImportWizardProps {
  orgId: string;
  onComplete?: (importedCount: number) => void;
  onClose?: () => void;
  /** If provided, pre-fills the default ministry */
  defaultMinistryId?: string;
  /** Compact mode — for embedding inside onboarding */
  compact?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: "upload",   label: "Upload" },
  { id: "configure", label: "Configure" },
  { id: "analyze",  label: "AI Analysis" },
  { id: "review",   label: "Review" },
  { id: "preview",  label: "Preview" },
  { id: "import",   label: "Import" },
] as const;
type WizardStep = typeof WIZARD_STEPS[number]["id"];

const ACCEPTED_TYPES: Record<string, string> = {
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const CONFIDENCE_COLOR = (v: number) =>
  v >= 85 ? "text-emerald-500" : v >= 65 ? "text-amber-500" : "text-red-400";

const ALLOCATION_BADGE: Record<string, { label: string; class: string }> = {
  general_member:   { label: "Member",   class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  visitor_pipeline: { label: "Visitor",  class: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  ministry_member:  { label: "Ministry", class: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  leadership:       { label: "Leader",   class: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

// ── Step 6: Complete ──────────────────────────────────────────────────────

function StepComplete({
  importedCount, visitorsCount, skipped, jobId, onUndo, onClose,
}: {
  importedCount: number; visitorsCount: number; skipped: number; jobId: string;
  onUndo: () => void; onClose?: () => void;
}) {
  const total = importedCount + visitorsCount;
  const hasResults = total > 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center",
        hasResults ? "bg-emerald-500/10" : "bg-amber-500/10"
      )}>
        <CheckCircle2 className={cn("w-9 h-9", hasResults ? "text-emerald-500" : "text-amber-500")} />
      </div>

      <div>
        <p className="text-lg font-black text-foreground">
          {hasResults ? `${total} people processed` : "No new records added"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {hasResults ? "Import complete — here's where everyone landed:" : "All rows were duplicates or already exist."}
        </p>
      </div>

      {/* Breakdown */}
      {hasResults && (
        <div className="w-full grid grid-cols-2 gap-2">
          {importedCount > 0 && (
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{importedCount}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                Added to Directory
              </p>
            </div>
          )}
          {visitorsCount > 0 && (
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">{visitorsCount}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                Added to Visitor Pipeline
              </p>
            </div>
          )}
          {skipped > 0 && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-lg font-black text-muted-foreground">{skipped}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 mt-0.5">
                Skipped (duplicates)
              </p>
            </div>
          )}
        </div>
      )}

      {importedCount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          New members are live in your directory. You can undo this import within 24 hours.
        </p>
      )}

      <div className="flex gap-3">
        {importedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest rounded-xl gap-2"
            onClick={onUndo}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo Import
          </Button>
        )}
        {onClose && (
          <Button
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest rounded-xl"
            onClick={onClose}
          >
            {importedCount > 0 ? "View Members" : "Close"}
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground opacity-60">Job ID: {jobId}</p>
    </div>
  );
}

// ── Import execution helpers ──────────────────────────────────────────────

async function executeImport(
  members: ParsedMember[],
  families: ImportedFamily[],
  orgId: string,
  orgName: string,
  churchSlug: string,
  jobId: string,
  fileName: string,
  importMode: ImportMode,
  defaultMinistryId: string,
  ministries: Ministry[],
  supabaseUrl: string,
  supabaseAnonKey: string,
  onProgress: (p: number) => void,
): Promise<{ imported: number; skipped: number; visitors: number; profileIds: string[] }> {
  const BATCH = 50;
  let imported = 0;
  let skipped = 0;
  let visitorsAdded = 0;
  const insertedProfileIds: string[] = [];
  // name → profileId map for family linking
  const nameToProfileId: Record<string, string> = {};
  // members pending welcome email
  const welcomeQueue: { profile_id: string; name: string; email: string; ministry_name: string | null; role: string | null }[] = [];

  const ministryMap: Record<string, string> = {};
  for (const m of ministries) ministryMap[m.name.toLowerCase()] = m.id;

  for (let i = 0; i < members.length; i += BATCH) {
    const chunk = members.slice(i, i + BATCH);

    // ── Visitors → evangelism_pipeline ────────────────────────────────
    const visitors = chunk.filter((m) => m._allocation === "visitor_pipeline");
    if (visitors.length) {
      const pipelineRows = visitors.map((m) => ({
        org_id: orgId,
        prospect_name: m.name ?? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim(),
        stage: "first_service",
        stage_date: m.date_joined_church ?? new Date().toISOString(),
        notes: [m.phone_number, m.email, m.pastoral_note, m.notes].filter(Boolean).join(" | ") || null,
      }));
      const { error: visErr } = await supabase.from("evangelism_pipeline").insert(pipelineRows);
      if (visErr) console.error("Visitor insert error:", visErr);
      else visitorsAdded += visitors.length;
    }

    // ── Members / leaders → profiles (one row at a time to isolate failures) ──
    const nonVisitors = chunk.filter((m) => m._allocation !== "visitor_pipeline");
    if (!nonVisitors.length) {
      onProgress(((i + BATCH) / members.length) * 100);
      continue;
    }

    for (const m of nonVisitors) {
      const id = crypto.randomUUID();
      const fullName = m.name ?? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
      const email = m.email ?? `import_${id.slice(0, 8)}@placeholder.church`;

      const profileRow = {
        id,
        org_id: orgId,
        name: fullName,
        email,
        phone_number: m.phone_number ?? null,
        gender: m.gender ?? null,
        birthdate: m.date_of_birth ?? null,
        address: m.address ?? null,
        city: m.city ?? null,
        country: m.country ?? null,
        postal_code: m.postal_code ?? null,
        nationality: m.nationality ?? null,
        preferred_language: m.preferred_language ?? null,
        membership_status: m.membership_status ?? "member",
        growth_stage: m.growth_stage ?? "member",
        joined_at: m.date_joined_church ?? null,
        first_visit_date: m.first_visit_date ?? m.date_joined_church ?? null,
        membership_date: m.membership_date ?? null,
        baptism_status: m.baptism_status ?? null,
        baptism_date: m.baptism_date ?? null,
        salvation_date: m.salvation_date ?? null,
        marital_status: m.marital_status ?? null,
        wedding_anniversary: m.wedding_anniversary ?? null,
        foundations_completed: m.foundations_completed ?? null,
        tithe_status: m.tithe_status ?? null,
        occupation: m.occupation ?? null,
        industry: m.industry ?? null,
        education_level: m.education_level ?? null,
        skill_notes: m.skill_notes ?? null,
        role: m.role ?? null,
        ordained_date: m.ordained_date ?? null,
        leadership_training_date: m.leadership_training_date ?? null,
        church_background: m.notes ?? null,
        referral_source: "Bulk Import",
      };

      const { data: inserted, error: profileErr } = await supabase
        .from("profiles")
        .upsert(profileRow, { onConflict: "email,org_id", ignoreDuplicates: false })
        .select("id")
        .single();

      if (profileErr || !inserted) { skipped++; continue; }

      insertedProfileIds.push(inserted.id);
      if (fullName) nameToProfileId[fullName.toLowerCase()] = inserted.id;
      if (m.first_name && m.last_name) {
        nameToProfileId[`${m.first_name} ${m.last_name}`.toLowerCase()] = inserted.id;
      }

      // ── org_members ─────────────────────────────────────────────────
      await supabase.from("org_members").upsert({
        user_id: inserted.id,
        org_id: orgId,
        role: m._allocation === "leadership" ? "ministry_lead" : "member",
        stage: m.growth_stage ?? "member",
      }, { onConflict: "user_id,org_id", ignoreDuplicates: true });

      // ── membership_requests (pending mode) ──────────────────────────
      if (importMode === "pending") {
        await supabase.from("membership_requests").upsert(
          { user_id: inserted.id, org_id: orgId, status: "pending" },
          { onConflict: "user_id,org_id", ignoreDuplicates: true }
        );
      }

      // ── member_milestones ───────────────────────────────────────────
      if (m.salvation_date || m.baptism_date || m.date_joined_church) {
        await supabase.from("member_milestones").upsert({
          user_id: inserted.id,
          org_id: orgId,
          first_visit_date: m.first_visit_date ?? m.date_joined_church ?? null,
          salvation_date: m.salvation_date ?? null,
          baptism_date: m.baptism_date ?? null,
          membership_date: importMode === "direct"
            ? (m.membership_date ?? m.date_joined_church ?? new Date().toISOString().slice(0, 10))
            : null,
        }, { onConflict: "user_id" });
      }

      // ── primary ministry ────────────────────────────────────────────
      const mid = m.ministry_name
        ? ministryMap[m.ministry_name.toLowerCase()] ?? defaultMinistryId
        : defaultMinistryId;
      if (mid) {
        await supabase.from("ministry_members").upsert({
          user_id: inserted.id,
          org_id: orgId,
          ministry_id: mid,
          ministry_name: m.ministry_name ?? "",
          ministry_role: m.ministry_role ?? "member",
          is_active: true,
        }, { onConflict: "user_id,ministry_id", ignoreDuplicates: true });
      }

      // ── secondary ministries from AI ────────────────────────────────
      for (const secName of (m.secondary_ministry_names ?? [])) {
        const secMid = ministryMap[secName.toLowerCase()];
        if (secMid && secMid !== mid) {
          await supabase.from("ministry_members").upsert({
            user_id: inserted.id,
            org_id: orgId,
            ministry_id: secMid,
            ministry_name: secName,
            ministry_role: "member",
            is_active: true,
          }, { onConflict: "user_id,ministry_id", ignoreDuplicates: true });
        }
      }

      // ── pastoral_notes ──────────────────────────────────────────────
      if (m.pastoral_note) {
        await supabase.from("pastoral_notes").insert({
          member_user_id: inserted.id,
          org_id: orgId,
          category: "import_note",
          note: m.pastoral_note,
          is_resolved: false,
        });
      }

      // ── member_communication_profiles (mailing list) ────────────────
      if (m.email && !m.email.includes("@placeholder.church")) {
        await supabase.from("member_communication_profiles").upsert({
          org_id: orgId,
          member_id: inserted.id,
          email: m.email,
          phone_e164: m.phone_number ?? null,
          preferred_language: m.preferred_language ?? "en",
          preferred_channel: "email",
          member_status: m.membership_status === "visitor" ? "visitor" : "active",
          notification_preferences: {},
          engagement_score: 0,
          receive_devotion_email: true,
          receive_weekly_digest: true,
          receive_pastoral_letters: true,
          receive_event_announcements: true,
          receive_ministry_updates: true,
          receive_prayer_bulletin: true,
          receive_giving_appeals: false,
          receive_testimonies: true,
          receive_sms: false,
          receive_in_app: true,
        }, { onConflict: "org_id,member_id", ignoreDuplicates: true });

        welcomeQueue.push({
          profile_id: inserted.id,
          name: fullName,
          email: m.email,
          ministry_name: m.ministry_name ?? null,
          role: m.role ?? m.ministry_role ?? null,
        });
      }

      imported++;
    }

    onProgress(((i + BATCH) / members.length) * 100);
  }

  // ── Family / household linking ─────────────────────────────────────────
  for (const family of (families ?? [])) {
    const headId = family.head_name
      ? nameToProfileId[family.head_name.toLowerCase()] ?? null
      : null;
    const spouseId = family.spouse_name
      ? nameToProfileId[family.spouse_name.toLowerCase()] ?? null
      : null;

    if (!headId) continue;

    const { data: household } = await supabase.from("households").upsert({
      org_id: orgId,
      household_name: family.family_name,
      head_user_id: headId,
      spouse_user_id: spouseId ?? null,
      total_members: family.total_members ?? 1,
      has_children: family.has_children ?? false,
    }, { onConflict: "head_user_id", ignoreDuplicates: false }).select("id").single();

    if (!household) continue;

    // Link head
    await supabase.from("household_members").upsert({
      org_id: orgId,
      household_id: household.id,
      user_id: headId,
      full_name: family.head_name,
      relationship: "head",
    }, { onConflict: "household_id,user_id", ignoreDuplicates: true });

    // Link spouse
    if (spouseId && family.spouse_name) {
      await supabase.from("household_members").upsert({
        org_id: orgId,
        household_id: household.id,
        user_id: spouseId,
        full_name: family.spouse_name,
        relationship: "spouse",
      }, { onConflict: "household_id,user_id", ignoreDuplicates: true });
    }

    // Link children (by name — some may not be in the sheet)
    for (const childName of (family.children_names ?? [])) {
      const childId = nameToProfileId[childName.toLowerCase()] ?? null;
      await supabase.from("household_members").upsert({
        org_id: orgId,
        household_id: household.id,
        user_id: childId ?? null,
        full_name: childName,
        relationship: "child",
      }, { onConflict: "household_id,user_id", ignoreDuplicates: true });
    }
  }

  // ── Welcome emails via member-import-welcome edge function ────────────
  if (welcomeQueue.length > 0) {
    fetch(`${supabaseUrl}/functions/v1/member-import-welcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({
        org_id: orgId,
        org_name: orgName,
        church_slug: churchSlug,
        members: welcomeQueue,
      }),
    }).catch((e) => console.error("Welcome email trigger failed:", e));
  }

  // ── Broadcast to Mission Control (admin_ai_insights) ──────────────────
  if (imported > 0 || visitorsAdded > 0) {
    const parts = [];
    if (imported > 0) parts.push(`${imported} added to directory`);
    if (visitorsAdded > 0) parts.push(`${visitorsAdded} added to visitor pipeline`);
    await supabase.from("admin_ai_insights").insert({
      org_id: orgId,
      insight_type: "member_import",
      priority: "info",
      message: `${imported + visitorsAdded} people imported from "${fileName}" — ${parts.join(", ")}`,
      suggested_action: "Review newly imported members in your directory and visitor pipeline.",
      metadata: {
        job_id: jobId,
        file_name: fileName,
        imported,
        visitors: visitorsAdded,
        skipped,
        families_linked: (families ?? []).length,
        welcome_emails_queued: welcomeQueue.length,
      },
    });
  }

  // ── Persist job completion ─────────────────────────────────────────────
  await supabase.from("migration_jobs").update({
    status: "complete",
    imported_rows: imported,
    skipped_rows: skipped,
    inserted_profile_ids: insertedProfileIds,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);

  return { imported, skipped, visitors: visitorsAdded, profileIds: insertedProfileIds };
}

async function undoImport(jobId: string, orgId: string): Promise<void> {
  const { data: job } = await supabase
    .from("migration_jobs")
    .select("inserted_profile_ids, rollback_available")
    .eq("id", jobId)
    .single();

  if (!job?.rollback_available) throw new Error("Rollback window has expired (24 hours).");
  if (!job.inserted_profile_ids?.length) throw new Error("No profiles to roll back.");

  await supabase.from("profiles")
    .delete()
    .in("id", job.inserted_profile_ids)
    .eq("org_id", orgId);

  await supabase.from("migration_jobs").update({
    status: "rolled_back",
    rollback_available: false,
  }).eq("id", jobId);
}

// ── Step 4: Mapping Review ────────────────────────────────────────────────

function StepReview({ result }: { result: AIParseResult }) {
  const { allocation_summary: alloc, warnings, departments_found } = result;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Members",    val: alloc.general_members,  color: "text-emerald-500" },
          { label: "Visitors",   val: alloc.visitors,         color: "text-blue-500" },
          { label: "Leaders",    val: alloc.leadership,       color: "text-amber-500" },
          { label: "Ministry",   val: alloc.ministry_members, color: "text-violet-500" },
        ].map((s) => (
          <div key={s.label} className="bg-muted/60 rounded-xl p-3 text-center">
            <p className={cn("text-lg font-black", s.color)}>{s.val}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Column mapping confidence */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          AI Field Mapping Confidence
        </p>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] text-[9px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2 bg-muted/40 border-b border-border">
            <span>Source Column</span>
            <span>Mapped To</span>
            <span>Confidence</span>
          </div>
          <div className="divide-y divide-border max-h-40 overflow-y-auto">
            {Object.entries(result.column_mapping).map(([src, dst]) => {
              const conf = result.ai_confidence[dst] ?? result.ai_confidence[src] ?? 70;
              return (
                <div key={src} className="grid grid-cols-[1fr_1fr_auto] px-3 py-2 text-[11px]">
                  <span className="font-medium text-foreground truncate">{src}</span>
                  <span className="text-muted-foreground truncate">{dst}</span>
                  <span className={cn("font-black text-right", CONFIDENCE_COLOR(conf))}>{conf}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Departments found */}
      {departments_found.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            Departments / Ministries Detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {departments_found.map((d) => (
              <Badge key={d} variant="secondary" className="text-[10px]">
                {d} <span className="ml-1 opacity-60">{alloc.by_ministry[d] ?? ""}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Warnings</p>
          </div>
          {warnings.slice(0, 5).map((w, i) => (
            <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400">{w}</p>
          ))}
          {warnings.length > 5 && (
            <p className="text-[10px] text-amber-600">+{warnings.length - 5} more warnings</p>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        {result.total_rows} rows detected · Review the preview before importing
      </p>
    </div>
  );
}

// ── Step 5: Preview ────────────────────────────────────────────────────────

function StepPreview({
  members,
  page, setPage,
}: {
  members: ParsedMember[];
  page: number;
  setPage: (p: number) => void;
}) {
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  const slice = members.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {members.length} members to import
        </p>
        <p className="text-[10px] text-muted-foreground">
          Page {page + 1} of {totalPages}
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr] text-[9px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2 bg-muted/40 border-b border-border">
          <span>Name</span>
          <span>Email / Phone</span>
          <span>Ministry</span>
          <span>Type</span>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {slice.map((m, i) => {
            const alloc = ALLOCATION_BADGE[m._allocation] ?? ALLOCATION_BADGE.general_member;
            return (
              <div key={i} className={cn(
                "grid grid-cols-[2fr_2fr_1fr_1fr] px-3 py-2 text-[11px]",
                m._warnings.length > 0 && "bg-amber-500/5"
              )}>
                <span className="font-medium text-foreground truncate">
                  {m.name || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "—"}
                </span>
                <span className="text-muted-foreground truncate">
                  {m.email ?? m.phone_number ?? "—"}
                </span>
                <span className="text-muted-foreground truncate">
                  {m.ministry_name ?? "—"}
                </span>
                <span>
                  <Badge className={cn("text-[9px] px-1.5 py-0 font-bold border-0", alloc.class)}>
                    {alloc.label}
                  </Badge>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1 rounded-lg hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={cn(
                "w-6 h-6 rounded-lg text-[10px] font-bold",
                page === i ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="p-1 rounded-lg hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Configure ─────────────────────────────────────────────────────

function StepConfigure({
  file,
  ministries,
  importMode, setImportMode,
  memberType, setMemberType,
  defaultMinistryId, setDefaultMinistryId,
}: {
  file: File;
  ministries: Ministry[];
  importMode: ImportMode; setImportMode: (v: ImportMode) => void;
  memberType: DefaultMemberType; setMemberType: (v: DefaultMemberType) => void;
  defaultMinistryId: string; setDefaultMinistryId: (v: string) => void;
}) {
  const FileIcon = file.type === "application/pdf" ? FileText :
    file.type.includes("sheet") || file.type.includes("csv") ? FileSpreadsheet : File;

  const OptionCard = ({
    active, onClick, title, desc,
  }: { active: boolean; onClick: () => void; title: string; desc: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
      )}
    >
      <p className={cn("text-xs font-black uppercase tracking-widest", active ? "text-primary" : "text-foreground")}>
        {title}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* File summary */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>

      {/* Import mode */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          Import Mode
        </p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard
            active={importMode === "direct"}
            onClick={() => setImportMode("direct")}
            title="Direct Import"
            desc="Members go straight to Active status. Use for migrating from your previous system."
          />
          <OptionCard
            active={importMode === "pending"}
            onClick={() => setImportMode("pending")}
            title="Pending Review"
            desc="All imports enter a pastoral approval queue before becoming active."
          />
        </div>
      </div>

      {/* Default member type */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          Default Member Type <span className="font-normal">(AI overrides per row if detected)</span>
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["member", "visitor", "leader", "staff"] as DefaultMemberType[]).map((t) => (
            <button
              key={t}
              onClick={() => setMemberType(t)}
              className={cn(
                "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                memberType === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Default ministry (optional) */}
      {ministries.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            Default Ministry <span className="font-normal">(optional — for unmatched rows)</span>
          </p>
          <select
            value={defaultMinistryId}
            onChange={(e) => setDefaultMinistryId(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No default ministry</option>
            {ministries.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Step 3: AI Analysis ────────────────────────────────────────────────────

const ANALYSIS_MESSAGES = [
  "Reading file structure…",
  "Detecting column headers…",
  "Mapping fields with AI…",
  "Identifying departments…",
  "Detecting family units…",
  "Building member profiles…",
  "Finalising allocations…",
];

function StepAnalyze({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-black text-foreground">Analysing with Gemini AI</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <div className="w-full max-w-xs space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground text-right">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────

export function MemberImportWizard({
  orgId, onComplete, onClose, defaultMinistryId: initialMinistryId = "", compact = false,
}: MemberImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("direct");
  const [memberType, setMemberType] = useState<DefaultMemberType>("member");
  const [defaultMinistryId, setDefaultMinistryId] = useState(initialMinistryId);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMsg, setAnalyzeMsg] = useState(ANALYSIS_MESSAGES[0]);
  const [parseResult, setParseResult] = useState<AIParseResult | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [jobId, setJobId] = useState("");
  const [busy, setBusy] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [churchSlug, setChurchSlug] = useState("");

  // Load org info + ministries on mount
  useState(() => {
    supabase.from("ministries").select("id,name,slug").eq("org_id", orgId)
      .then(({ data }) => setMinistries(data ?? []));
    supabase.from("organizations").select("name,church_slug").eq("id", orgId).single()
      .then(({ data }) => {
        if (data) { setOrgName(data.name ?? ""); setChurchSlug(data.church_slug ?? ""); }
      });
  });

  const currentIdx = WIZARD_STEPS.findIndex((s) => s.id === step);

  // ── File selected → create job row ─────────────────────────────────────
  const handleFileSelected = async (f: File) => {
    if (!ACCEPTED_TYPES[f.type]) {
      toast.error("Unsupported file type. Please upload a CSV, XLSX, DOCX, PDF, JPG, or PNG.");
      return;
    }
    // 10MB check
    if (f.size > 10 * 1024 * 1024) {
      toast.warning("File is larger than 10MB. Processing may take longer.");
    }

    setFile(f);
    const type = ACCEPTED_TYPES[f.type] ?? f.name.split(".").pop() ?? "unknown";
    const { data: job, error } = await supabase.from("migration_jobs").insert({
      org_id: orgId,
      file_name: f.name,
      file_size: f.size,
      file_type: type,
      import_mode: importMode,
      default_member_type: memberType,
      status: "uploading",
    }).select("id").single();
    if (error || !job) { toast.error("Could not create import job."); return; }
    setJobId(job.id);
    setStep("configure");
  };

  // ── Run AI analysis ─────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file || !jobId) return;
    setStep("analyze");
    setAnalyzeProgress(0);

    // Cycle through analysis messages
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % ANALYSIS_MESSAGES.length;
      setAnalyzeMsg(ANALYSIS_MESSAGES[msgIdx]);
      setAnalyzeProgress((p) => Math.min(p + 12, 88));
    }, 900);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const type = ACCEPTED_TYPES[file.type] ?? file.name.split(".").pop() ?? "txt";

      const isBinary = ["pdf", "jpg", "png", "docx", "doc"].includes(type);
      let body: Record<string, any> = {
        job_id: jobId,
        org_id: orgId,
        file_type: type,
        org_ministries: ministries,
      };

      if (isBinary) {
        // Convert to base64 for Gemini Vision
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        body.file_content = btoa(binary);
      } else {
        // CSV/XLSX/TXT: extract client-side to JSON text
        const buf = await file.arrayBuffer();
        if (type === "txt" || type === "csv") {
          body.file_content_text = new TextDecoder().decode(buf);
        } else {
          const wb = XLSX.read(buf, { type: "array" });
          const sheets: string[] = [];
          for (const sheetName of wb.SheetNames) {
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
            sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
          }
          body.file_content_text = sheets.join("\n\n");
        }
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/member-import-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify(body),
      });

      clearInterval(msgTimer);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "AI analysis failed");
      }

      const result: AIParseResult = await resp.json();
      setParseResult(result);
      setAnalyzeProgress(100);
      setTimeout(() => setStep("review"), 400);
    } catch (err: any) {
      clearInterval(msgTimer);
      toast.error(err.message ?? "Analysis failed. Please try again.");
      setStep("configure");
    }
  };

  // ── Execute import (server-side via edge function) ──────────────────────
  const handleImport = async () => {
    if (!jobId) return;
    setBusy(true);
    setStep("import");
    setImportProgress(0);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      setImportProgress(20);

      const resp = await fetch(`${supabaseUrl}/functions/v1/member-import-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          action: "execute",
          job_id: jobId,
          org_id: orgId,
          import_mode: importMode,
        }),
      });

      setImportProgress(90);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Import failed");
      }

      const result = await resp.json();
      setImportedCount(result.imported ?? 0);
      setSkippedCount(result.skipped ?? 0);
      setImportProgress(100);
      setStep("import");
      onComplete?.(result.imported ?? 0);
    } catch (err: any) {
      toast.error(err.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Undo ────────────────────────────────────────────────────────────────
  const handleUndo = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      await undoImport(jobId, orgId);
      toast.success("Import rolled back successfully.");
      onClose?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const canProceed = () => {
    if (step === "configure") return !!file;
    if (step === "review") return !!parseResult;
    if (step === "preview") return !!parseResult;
    return false;
  };

  const handleNext = () => {
    if (step === "configure") { handleAnalyze(); return; }
    if (step === "review") { setStep("preview"); return; }
    if (step === "preview") { handleImport(); return; }
  };

  const isComplete = step === "import" && importProgress === 100 && !busy;

  return (
    <div className={cn("flex flex-col gap-0", compact ? "h-full" : "")}>
      {/* Header progress */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-black text-foreground tracking-tight">Import Members</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Step {currentIdx + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[currentIdx]?.label}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {WIZARD_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < currentIdx ? "bg-primary" :
                i === currentIdx ? "bg-primary/60" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {step === "upload" && <StepUpload onFileSelected={handleFileSelected} />}
            {step === "configure" && file && (
              <StepConfigure
                file={file}
                ministries={ministries}
                importMode={importMode} setImportMode={setImportMode}
                memberType={memberType} setMemberType={setMemberType}
                defaultMinistryId={defaultMinistryId} setDefaultMinistryId={setDefaultMinistryId}
              />
            )}
            {step === "analyze" && (
              <StepAnalyze progress={analyzeProgress} message={analyzeMsg} />
            )}
            {step === "review" && parseResult && (
              <StepReview result={parseResult} />
            )}
            {step === "preview" && parseResult && (
              <StepPreview
                members={parseResult.members}
                page={previewPage}
                setPage={setPreviewPage}
              />
            )}
            {step === "import" && !isComplete && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <p className="text-sm font-black text-foreground">Importing members…</p>
                <div className="w-full max-w-xs space-y-1.5">
                  <Progress value={importProgress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground text-right">{Math.round(importProgress)}%</p>
                </div>
              </div>
            )}
            {isComplete && (
              <StepComplete
                importedCount={importedCount}
                visitorsCount={visitorsCount}
                skipped={skippedCount}
                jobId={jobId}
                onUndo={handleUndo}
                onClose={onClose}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      {!["upload", "analyze", "import"].includes(step) && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5"
            onClick={() => {
              const prev: Record<string, WizardStep> = {
                configure: "upload", review: "configure", preview: "review",
              };
              setStep(prev[step] ?? "upload");
            }}
            disabled={busy}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <Button
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest rounded-xl gap-1.5"
            onClick={handleNext}
            disabled={!canProceed() || busy}
          >
            {step === "preview" ? "Import Now" : "Continue"}
            {step !== "preview" && <ChevronRight className="w-3.5 h-3.5" />}
            {(busy) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Upload ─────────────────────────────────────────────────────────

function StepUpload({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }, [onFileSelected]);

  const FileTypeChip = ({ label, icon }: { label: string; icon: string }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
      {icon} {label}
    </span>
  );

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            Drop your membership file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse your files
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {[
            { label: "CSV", icon: "📊" }, { label: "Excel", icon: "📗" },
            { label: "PDF", icon: "📄" }, { label: "Image", icon: "🖼️" },
          ].map((t) => <FileTypeChip key={t.label} {...t} />)}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.docx,.doc,.pdf,.jpg,.jpeg,.png"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f); }}
        />
      </div>

      <div className="bg-muted/50 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Our AI reads any column structure — no template required. It maps your data
          automatically, handles multiple departments in one file, and flags duplicates
          before anything is saved.
        </p>
      </div>
    </div>
  );
}
