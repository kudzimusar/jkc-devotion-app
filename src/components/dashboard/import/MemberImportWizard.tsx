"use client";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Upload, FileText, FileSpreadsheet, File, X, ChevronRight,
  ChevronLeft, Loader2, CheckCircle2, AlertTriangle, Users,
  UserCheck, Sparkles, RotateCcw, Download, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ImportMode = "direct" | "pending";
export type DefaultMemberType = "member" | "visitor" | "leader" | "staff";

export interface ParsedMember {
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  birthdate: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  membership_status: string | null;
  growth_stage: string | null;
  joined_at: string | null;
  baptism_date: string | null;
  salvation_date: string | null;
  marital_status: string | null;
  nationality: string | null;
  occupation: string | null;
  ministry_name: string | null;
  ministry_role: string | null;
  cell_group_name: string | null;
  role_level: number | null;
  household_role: string | null;
  notes: string | null;
  _source_row: number;
  _allocation: "general_member" | "visitor_pipeline" | "ministry_member" | "leadership";
  _warnings: string[];
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
  families: any[];
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
  importedCount, skipped, jobId, onUndo, onClose,
}: {
  importedCount: number; skipped: number; jobId: string;
  onUndo: () => void; onClose?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-emerald-500" />
      </div>
      <div>
        <p className="text-lg font-black text-foreground">{importedCount} members imported</p>
        {skipped > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{skipped} rows skipped (duplicates or missing required data)</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-2">
          Members are now available in your directory.{" "}
          You can undo this entire import within 24 hours.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] font-black uppercase tracking-widest rounded-xl gap-2"
          onClick={onUndo}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo Import
        </Button>
        {onClose && (
          <Button
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest rounded-xl"
            onClick={onClose}
          >
            Done
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
  orgId: string,
  jobId: string,
  importMode: ImportMode,
  defaultMinistryId: string,
  ministries: Ministry[],
  onProgress: (p: number) => void,
): Promise<{ imported: number; skipped: number; profileIds: string[] }> {
  const BATCH = 50;
  let imported = 0;
  let skipped = 0;
  const insertedProfileIds: string[] = [];

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
        stage_date: m.joined_at ?? new Date().toISOString(),
        notes: [m.phone_number, m.email, m.notes].filter(Boolean).join(" | ") || null,
      }));
      const { error: visErr } = await supabase.from("evangelism_pipeline").insert(pipelineRows);
      if (visErr) console.error("Visitor insert error:", visErr);
    }

    // ── Members / leaders → profiles + org_members ────────────────────
    const nonVisitors = chunk.filter((m) => m._allocation !== "visitor_pipeline");
    if (!nonVisitors.length) {
      onProgress(((i + BATCH) / members.length) * 100);
      continue;
    }

    const profileRows = nonVisitors.map((m) => {
      const id = crypto.randomUUID();
      return {
        id,
        org_id: orgId,
        name: m.name ?? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim(),
        email: m.email ?? `import_${id.slice(0, 8)}@placeholder.church`,
        phone_number: m.phone_number ?? null,
        gender: m.gender ?? null,
        birthdate: m.birthdate ?? null,
        address: m.address ?? null,
        city: m.city ?? null,
        country: m.country ?? null,
        membership_status: m.membership_status ?? "member",
        growth_stage: m.growth_stage ?? "member",
        joined_at: m.joined_at ?? null,
        baptism_date: m.baptism_date ?? null,
        salvation_date: m.salvation_date ?? null,
        marital_status: m.marital_status ?? null,
        nationality: m.nationality ?? null,
        occupation: m.occupation ?? null,
        referral_source: "Bulk Import",
        church_background: m.notes ?? null,
      };
    });

    const { data: inserted, error: profileErr } = await supabase
      .from("profiles")
      .insert(profileRows)
      .select("id");

    if (profileErr) { skipped += nonVisitors.length; continue; }
    const ids = (inserted ?? []).map((r: any) => r.id);
    insertedProfileIds.push(...ids);

    // ── org_members ───────────────────────────────────────────────────
    const orgMemberRows = nonVisitors.map((m, idx) => ({
      user_id: ids[idx],
      org_id: orgId,
      role: m._allocation === "leadership" ? "ministry_lead" : "member",
      stage: m.growth_stage ?? "member",
    }));
    await supabase.from("org_members").insert(orgMemberRows);

    // ── membership_requests (pending mode) ────────────────────────────
    if (importMode === "pending") {
      const requestRows = ids.map((uid: string) => ({
        user_id: uid, org_id: orgId, status: "pending",
      }));
      await supabase.from("membership_requests").insert(requestRows);
    }

    // ── member_milestones ─────────────────────────────────────────────
    const milestoneRows = nonVisitors.map((m, idx) => ({
      user_id: ids[idx],
      org_id: orgId,
      first_visit_date: m.joined_at ?? null,
      salvation_date: m.salvation_date ?? null,
      baptism_date: m.baptism_date ?? null,
      membership_date: importMode === "direct" ? (m.joined_at ?? new Date().toISOString().slice(0, 10)) : null,
    })).filter((r: any) => r.salvation_date || r.baptism_date || r.first_visit_date);
    if (milestoneRows.length) {
      const { error: msErr } = await supabase.from("member_milestones").upsert(milestoneRows, { onConflict: "user_id" });
      if (msErr) console.error("Milestone insert error:", msErr);
    }

    // ── ministry_members ──────────────────────────────────────────────
    const ministryRows = nonVisitors
      .map((m, idx) => {
        const mid = m.ministry_name
          ? ministryMap[m.ministry_name.toLowerCase()] ?? defaultMinistryId
          : defaultMinistryId;
        if (!mid) return null;
        return {
          user_id: ids[idx],
          org_id: orgId,
          ministry_id: mid,
          ministry_name: m.ministry_name ?? "",
          ministry_role: m.ministry_role ?? "member",
          is_active: true,
        };
      })
      .filter(Boolean);
    if (ministryRows.length) {
      await supabase.from("ministry_members").insert(ministryRows);
    }

    imported += ids.length;
    onProgress(((i + BATCH) / members.length) * 100);
  }

  // Persist rollback IDs on the job
  await supabase.from("migration_jobs").update({
    status: "complete",
    imported_rows: imported,
    skipped_rows: skipped,
    inserted_profile_ids: insertedProfileIds,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);

  return { imported, skipped, profileIds: insertedProfileIds };
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
  const [skippedCount, setSkippedCount] = useState(0);
  const [jobId, setJobId] = useState("");
  const [busy, setBusy] = useState(false);

  // Load org ministries on mount
  useState(() => {
    supabase.from("ministries").select("id,name,slug").eq("org_id", orgId)
      .then(({ data }) => setMinistries(data ?? []));
  });

  const currentIdx = WIZARD_STEPS.findIndex((s) => s.id === step);
  const progressPct = ((currentIdx + 1) / WIZARD_STEPS.length) * 100;

  // ── File selected → create job row ─────────────────────────────────────
  const handleFileSelected = async (f: File) => {
    if (!ACCEPTED_TYPES[f.type]) {
      toast.error("Unsupported file type. Please upload a CSV, XLSX, PDF, JPG, or PNG.");
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

      const isBinary = ["pdf", "jpg", "png"].includes(type);
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

  // ── Execute import ──────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parseResult || !jobId) return;
    setBusy(true);
    setStep("import");
    setImportProgress(0);
    try {
      const { imported, skipped } = await executeImport(
        parseResult.members, orgId, jobId, importMode,
        defaultMinistryId, ministries,
        (p) => setImportProgress(Math.min(p, 99)),
      );
      setImportedCount(imported);
      setSkippedCount(skipped);
      setImportProgress(100);
      setStep("import"); // stay on import step but show complete UI
      onComplete?.(imported);
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
          accept=".csv,.xlsx,.pdf,.jpg,.jpeg,.png"
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
