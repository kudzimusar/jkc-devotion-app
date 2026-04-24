"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Sparkles,
  ArrowLeft,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Mail,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MinistryReportModal } from "./MinistryReportModal";
import { MinistryBroadcastModal } from "./MinistryBroadcastModal";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";

interface MinistryIntelligenceSiloProps {
  ministryId: string;
  ministrySlug: string;
  onBack: () => void;
  onOpenProfile: () => void;
  forcedRole?: string;
}

export function MinistryIntelligenceSilo({
  ministryId,
  ministrySlug,
  onBack,
  onOpenProfile,
  forcedRole,
}: MinistryIntelligenceSiloProps) {
  const adminCtx = useAdminCtx();
  const activeRole = forcedRole || adminCtx?.role;
  const isLeader = ["admin", "pastor", "shepherd", "ministry_leader", "leader", "owner"].includes(activeRole || "");

  const [data, setData] = useState<any>(null);
  const [hubCards, setHubCards] = useState<any[]>([]);
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [commsCounts, setCommsCounts] = useState<any>({});
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commsTab, setCommsTab] = useState("ALL");
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const loadSilo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id;

    const [dashRes, hubRes, sparkRes, commsCountRes, nextEvtRes] = await Promise.all([
      supabase.from("vw_ministry_dashboard").select("*").eq("ministry_id", ministryId).single(),
      supabase.rpc("fn_ministry_hub_card", { p_ministry_id: ministryId }),
      supabase.rpc("fn_ministry_attendance_sparkline", { p_ministry_id: ministryId }),
      uid
        ? supabase.rpc("fn_ministry_comms_counts", { p_ministry_id: ministryId, p_user_id: uid })
        : Promise.resolve({ data: null }),
      supabase.rpc("fn_ministry_next_event", { p_ministry_id: ministryId }),
    ]);

    setData(dashRes.data);
    setHubCards(hubRes.data || []);
    const raw = sparkRes.data || [];
    setSparkline(raw.map((r: any) => (typeof r === "number" ? r : r?.value ?? 0)));
    setCommsCounts(commsCountRes.data ?? {});
    setNextEvent(Array.isArray(nextEvtRes.data) ? nextEvtRes.data[0] : nextEvtRes.data);
    setLoading(false);
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      if (commsTab === "ANNOUNCEMENTS") {
        const { data: ann } = await supabase
          .from("ministry_announcements")
          .select("*")
          .eq("ministry_id", ministryId)
          .order("created_at", { ascending: false })
          .limit(20);
        setMessages(ann || []);
      } else {
        let q = supabase
          .from("ministry_comms_outbox")
          .select("*, profiles(full_name)")
          .eq("ministry_id", ministryId)
          .in("status", ["sent", "delivered"]);
        if (commsTab === "BROADCAST") q = q.eq("category", "broadcast");
        else if (commsTab === "TEAM") q = q.eq("category", "team");
        else if (commsTab === "CRISIS") q = q.eq("category", "emergency");
        const { data: msgs } = await q.order("created_at", { ascending: false }).limit(20);
        setMessages(msgs || []);
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadSilo();
  }, [ministryId]);

  useEffect(() => {
    if (!loading) loadMessages();
  }, [ministryId, commsTab, loading]);

  if (loading || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Syncing Silo Intelligence...
        </p>
      </div>
    );
  }

  const color = data.primary_color || "#8B5CF6";
  const tag = data.intelligence_tag || "OPERATIONAL";
  const insights: any[] = Array.isArray(data.active_insights) ? data.active_insights : [];

  // Health delta text
  const hDelta = data.health_score_delta_30d;
  const healthNote =
    hDelta != null
      ? `${hDelta >= 0 ? "↑" : "↓"} ${hDelta >= 0 ? "+" : ""}${hDelta} since last month`
      : null;

  // Attendance trend text — derived client-side from sparkline (last two points)
  const attendanceTrend =
    sparkline.length >= 2
      ? sparkline[sparkline.length - 1] > sparkline[sparkline.length - 2]
        ? "↑ Trending up"
        : sparkline[sparkline.length - 1] < sparkline[sparkline.length - 2]
        ? "↓ Declining"
        : "— Steady"
      : "No data yet";

  // Report status
  const daysAgo = data.days_since_last_report;
  const reportValue = daysAgo != null ? `${daysAgo}d ago` : "Never";
  const reportAlert = daysAgo == null || daysAgo > 14;
  const reportAmber = daysAgo != null && daysAgo > 7 && daysAgo <= 14;

  // Sparkline — only render if ≥2 points
  const sparkData = sparkline.length >= 2 ? sparkline : null;

  // Hub card slot 2 (ministry-specific stat for Hero chip)
  const hubCard2 = hubCards[1] ?? null;

  // Format next event date
  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const ops = [
    { id: "report", label: "Submit Report", sub: "Ministry performance" },
    { id: "attendance", label: "Quick Attendance", sub: "Log service headcounts" },
    { id: "events", label: "Ministry Events", sub: "Manage retreats & outreach" },
    { id: "team", label: "Manage Team", sub: "Assign roles & volunteers" },
    { id: "analytics", label: "Analytics", sub: "View performance metrics" },
    { id: "announcements", label: "Announcements", sub: "Messages from leadership" },
  ];

  const COMMS_TABS = ["ALL", "BROADCAST", "TEAM", "CRISIS", "ANNOUNCEMENTS"];

  const handleOp = (id: string) => {
    if (id === "report") { setIsReportOpen(true); return; }
    if (id === "attendance") { setIsAttendanceOpen(true); return; }
    if (id === "announcements") { setCommsTab("ANNOUNCEMENTS"); return; }
    window.open(`/ministry-dashboard/${ministrySlug}/${id}`, "_self");
  };

  return (
    <div className="flex flex-col bg-background" style={{ height: "100vh", overflow: "hidden" }}>
      {/* ── TOP NAV ── */}
      <div
        className="flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-xl"
        style={{ height: 56, padding: "0 20px", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}
      >
        <div className="flex items-center gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center text-xs font-black text-white rounded-lg"
              style={{ width: 28, height: 28, background: "linear-gradient(135deg,#8B5CF6,#3B82F6)" }}
            >
              C
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight hidden sm:inline">Church OS</span>
          </div>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
          >
            <ArrowLeft className="w-3 h-3" /> MY MINISTRIES
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <span className="text-sm font-bold text-foreground hidden md:inline">{data.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}38` }}
          >
            {isLeader ? "LEADER" : "MEMBER"}
          </div>
          <a
            href="/jkc-devotion-app/churchgpt/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all no-underline"
            style={{ textDecoration: "none" }}
          >
            ✝ ChurchGPT
          </a>
          <button
            onClick={onOpenProfile}
            className="flex items-center justify-center text-xs font-black text-white rounded-full"
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg,#4338CA,#7C3AED)",
              border: "2px solid rgba(139,92,246,0.4)",
            }}
          >
            K
          </button>
        </div>
      </div>

      {/* ── BODY: sidebar + scroll area ── */}
      <div className="flex flex-1" style={{ overflow: "hidden", height: "calc(100vh - 56px)" }}>

        {/* LEFT SIDEBAR */}
        <div
          className="hidden lg:flex flex-col border-r border-border"
          style={{ width: 264, minWidth: 264, overflow: "hidden", background: "var(--card)" }}
        >
          <div className="flex-1 flex flex-col" style={{ overflowY: "auto" }}>

            {/* OPERATIONS */}
            <div style={{ padding: "20px 16px 8px" }}>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.6, marginBottom: 10, paddingLeft: 4 }}>
                Operations
              </p>
              <div>
                {ops.map((op) => (
                  <OpItem key={op.id} label={op.label} sub={op.sub} color={color} onClick={() => handleOp(op.id)} />
                ))}
              </div>
            </div>

            <div style={{ margin: "6px 16px", borderTop: "1px solid var(--border)" }} />

            {/* EMAILS */}
            <div style={{ padding: "8px 16px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingLeft: 4 }}>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                  Emails
                </p>
                <button
                  onClick={() => setIsBroadcastOpen(true)}
                  style={{
                    color,
                    backgroundColor: `${color}18`,
                    border: `1px solid ${color}38`,
                    borderRadius: 7,
                    padding: "4px 10px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  + COMPOSE
                </button>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {["ALL", "UNREAD", "CRISIS"].map((t) => {
                  const active = commsTab === t;
                  const cnt = t === "ALL" ? commsCounts.all_count : t === "UNREAD" ? commsCounts.unread_count : commsCounts.crisis_count;
                  return (
                    <button
                      key={t}
                      onClick={() => setCommsTab(t)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        borderRadius: 6,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: active ? color : "var(--muted-foreground)",
                        backgroundColor: active ? `${color}18` : "transparent",
                        border: `1px solid ${active ? `${color}38` : "var(--border)"}`,
                      }}
                    >
                      {t}
                      {cnt > 0 && ` (${cnt})`}
                    </button>
                  );
                })}
              </div>
              <div
                className="flex-1 flex items-center justify-center rounded-xl border border-border text-center"
                style={{ background: "var(--background)", minHeight: 80, padding: 16 }}
              >
                <p className="text-[10px] font-bold text-muted-foreground">
                  No messages in {commsTab}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* MAIN SCROLL AREA */}
        <div className="flex-1" style={{ overflowY: "auto" }}>
          <div style={{ padding: "32px 36px", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ① MINISTRY HEALTH INTELLIGENCE */}
            <section>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                Ministry Health Intelligence
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 296px", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    <StatTile
                      label="Health Score"
                      value={data.health_score != null ? `${data.health_score}/100` : "NO DATA"}
                      accent={color}
                      note={healthNote ?? "Submit a report to generate score"}
                      spark={sparkData}
                    />
                    <StatTile
                      label="Avg Attendance"
                      value={data.avg_attendance_quarter != null ? String(data.avg_attendance_quarter) : "NO DATA"}
                      note={attendanceTrend}
                      accent={color}
                      spark={sparkData}
                    />
                    <StatTile
                      label="Total Reports"
                      value={data.reports_this_quarter != null ? String(data.reports_this_quarter) : "0"}
                      note="This quarter"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    <StatTile
                      label="Salvations"
                      value={data.salvations_this_month != null ? String(data.salvations_this_month) : "0"}
                      note="This month"
                    />
                    <StatTile
                      label="Visitors"
                      value={data.visitors_this_month != null ? String(data.visitors_this_month) : "0"}
                      note="This month"
                    />
                    <StatTile
                      label="Report Status"
                      value={reportValue}
                      note="Days since last report"
                      alert={reportAlert && !reportAmber}
                      amber={reportAmber}
                    />
                  </div>
                </div>

                {/* AI INSIGHTS PANEL */}
                <div className="bg-card border border-border rounded-xl flex flex-col" style={{ padding: "18px 20px" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{ width: 22, height: 22, backgroundColor: `${color}18`, color }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground">AI Insights</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    {insights.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        No active insights yet. The weekly intelligence sweep will populate these once enough data is
                        collected.
                      </p>
                    ) : (
                      insights.slice(0, 4).map((ins: any, i: number) => {
                        const dot =
                          ins.urgency === "critical"
                            ? "#EF4444"
                            : ins.urgency === "monitor"
                            ? "#F59E0B"
                            : ins.urgency === "success"
                            ? "#10B981"
                            : color;
                        return (
                          <div key={i} className="flex gap-2.5">
                            <div
                              className="rounded-full flex-shrink-0"
                              style={{ width: 6, height: 6, background: dot, marginTop: 5, boxShadow: `0 0 5px ${dot}88` }}
                            />
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {ins.summary ?? ins.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      Church OS Intelligence
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ② HERO */}
            <section
              className="rounded-2xl relative overflow-hidden border"
              style={{ padding: "30px 36px", backgroundColor: `${color}08`, borderColor: `${color}2A` }}
            >
              <div
                className="absolute pointer-events-none"
                style={{
                  top: -40,
                  right: -20,
                  width: 260,
                  height: 260,
                  background: `radial-gradient(circle, ${color}28, transparent 70%)`,
                  filter: "blur(40px)",
                }}
              />
              <div className="relative flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="flex-1 min-w-0" style={{ maxWidth: 460 }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color }}>
                    {tag} · {data.name?.toUpperCase()}
                  </p>
                  <h2 className="text-foreground font-black tracking-tight leading-none mb-3" style={{ fontSize: 42 }}>
                    {data.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5" style={{ maxWidth: 400 }}>
                    {data.description}
                    {data.director_name && (
                      <>
                        {" "}
                        Director:{" "}
                        <strong style={{ color: `${color}CC`, fontWeight: 500 }}>{data.director_name}</strong>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <HeroChip label="NEXT REHEARSAL" value={nextEvent ? fmtDate(nextEvent.event_date) : "—"} />
                    <HeroChip
                      label="LAST REPORT"
                      value={daysAgo != null ? `${daysAgo}d ago` : "Never"}
                      alert={reportAlert}
                    />
                    <HeroChip label="TEAM" value={data.team_count > 0 ? `${data.team_count} members` : "—"} />
                    {hubCard2 && (
                      <HeroChip
                        label={(hubCard2.label ?? "STAT").toUpperCase()}
                        value={hubCard2.current_value != null ? String(hubCard2.current_value) : "—"}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <CircleScore score={data.health_score ?? 0} color={color} />
                  <WaveformDecor color={color} />
                </div>
              </div>
            </section>

            {/* ③ AUTOMATION STATUS */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl" style={{ padding: "12px 20px" }}>
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0" style={{ width: 10, height: 10 }}>
                  <div className="rounded-full bg-emerald-500" style={{ width: 10, height: 10 }} />
                  <div
                    className="absolute rounded-full bg-emerald-500/30 animate-ping"
                    style={{ inset: -3 }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Automation Active</p>
                  <p className="text-[10px] text-muted-foreground">Real-time health score & Mission Control sync enabled</p>
                </div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg" style={{ padding: "5px 14px" }}>
                <p className="text-[9px] font-bold text-muted-foreground">
                  Last sync:{" "}
                  {data.last_synced_at ? new Date(data.last_synced_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            {/* ④ INTERNAL COMMUNICATIONS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                    Internal Communications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Broadcast messages, team alerts & ministry-wide announcements
                  </p>
                </div>
                {/* NOTE: COCE ministry audience scope is known-broken (no delivery rows) — not fixing in this sprint */}
                <button
                  onClick={() => setIsBroadcastOpen(true)}
                  className="flex items-center gap-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{
                    color,
                    backgroundColor: `${color}18`,
                    border: `1px solid ${color}38`,
                    padding: "8px 18px",
                  }}
                >
                  + NEW MESSAGE ▾
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex gap-1.5 flex-wrap border-b border-border" style={{ padding: "12px 16px" }}>
                  {COMMS_TABS.map((t) => {
                    const active = commsTab === t;
                    const cnt =
                      t === "ALL"
                        ? commsCounts.all_count
                        : t === "BROADCAST"
                        ? commsCounts.broadcast_count
                        : t === "TEAM"
                        ? commsCounts.team_count
                        : t === "CRISIS"
                        ? commsCounts.crisis_outbox_count
                        : commsCounts.announcement_count;
                    return (
                      <button
                        key={t}
                        onClick={() => setCommsTab(t)}
                        style={{
                          padding: "5px 13px",
                          borderRadius: 7,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: active ? color : "var(--muted-foreground)",
                          backgroundColor: active ? `${color}18` : "transparent",
                          border: `1px solid ${active ? `${color}38` : "var(--border)"}`,
                        }}
                      >
                        {t}
                        {cnt > 0 && ` (${cnt})`}
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  {messagesLoading ? (
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-3 text-left">
                      {messages.map((msg: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/40">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">
                            {(msg.subject ?? msg.title ?? "M")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {msg.subject ?? msg.title ?? "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No {commsTab.toLowerCase()} messages yet.</p>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <MinistryReportModal
        isOpen={isReportOpen}
        onClose={() => { setIsReportOpen(false); loadSilo(); }}
        ministryId={ministryId}
        ministryName={data.name}
      />
      <MinistryBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => { setIsBroadcastOpen(false); loadSilo(); }}
        ministryId={ministryId}
        ministryName={data.name}
      />
      {isAttendanceOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsAttendanceOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-[32px] shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
                  {data.name}
                </p>
                <h2 className="text-xl font-black text-foreground">Quick Attendance</h2>
              </div>
              <button onClick={() => setIsAttendanceOpen(false)} className="p-2 hover:bg-muted rounded-xl text-lg">
                ×
              </button>
            </div>
            <QuickAttendanceForm
              ministryId={ministryId}
              ministryName={data.name}
              color={color}
              onClose={() => { setIsAttendanceOpen(false); loadSilo(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StatTile({ label, value, note, accent, alert, amber, spark }: {
  label: string; value: string; note?: string; accent?: string;
  alert?: boolean; amber?: boolean; spark?: number[] | null;
}) {
  const bg = alert ? "rgba(239,68,68,0.06)" : amber ? "rgba(245,158,11,0.06)" : undefined;
  const borderColor = alert ? "rgba(239,68,68,0.22)" : amber ? "rgba(245,158,11,0.22)" : undefined;
  const valColor = alert ? "#EF4444" : amber ? "#F59E0B" : accent ?? "var(--foreground)";
  const noteColor = alert ? "#EF4444" : amber ? "#F59E0B" : spark ? "#10B981" : "var(--muted-foreground)";

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{ background: bg ?? "var(--card)", border: `1px solid ${borderColor ?? "var(--border)"}`, padding: "14px 14px 12px" }}
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{label}</p>
      <div className="font-bold leading-none mb-1" style={{ fontSize: 24, color: valColor }}>{value}</div>
      {spark && spark.length >= 2 && (
        <div style={{ marginTop: 6 }}>
          <Sparkline data={spark} color={accent ?? "#8B5CF6"} />
        </div>
      )}
      {note && (
        <p className="text-[10px] mt-auto pt-1.5" style={{ color: noteColor }}>{note}</p>
      )}
    </div>
  );
}

function HeroChip({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div
      className="rounded-xl border border-border"
      style={{ padding: "9px 14px", background: alert ? "rgba(239,68,68,0.06)" : "var(--background)" }}
    >
      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{label}</p>
      <p className="text-[12px] font-black text-foreground" style={alert ? { color: "#EF4444" } : {}}>
        {value}
      </p>
    </div>
  );
}

function CircleScore({ score, color }: { score: number; color: string }) {
  const R = 36;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center" style={{ gap: 6 }}>
      <div className="relative" style={{ width: 92, height: 92 }}>
        <svg width="92" height="92" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="46" cy="46" r={R} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="5" />
          <circle
            cx="46"
            cy="46"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - score / 100)}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-foreground leading-none" style={{ fontSize: 22 }}>{score}</span>
          <span className="text-[8px] text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-[8px] font-black uppercase tracking-wider text-center text-muted-foreground/50 leading-tight">
        SPIRITUAL<br />ATMOSPHERE
      </span>
    </div>
  );
}

function WaveformDecor({ color }: { color: string }) {
  const bars = [10, 22, 14, 38, 20, 46, 30, 52, 24, 42, 18, 48, 28, 44, 16, 50, 26, 40, 12, 34];
  return (
    <svg width="180" height="44" style={{ opacity: 0.35 }}>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 9 + 1}
          y={(44 - h) / 2}
          width="6"
          height={h}
          rx="2.5"
          fill={color}
          opacity={0.2 + (i % 3) * 0.06}
        />
      ))}
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 90, h = 26;
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function OpItem({ label, sub, onClick, color }: { label: string; sub: string; onClick: () => void; color: string }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center gap-3 text-left"
      style={{
        padding: "9px 10px",
        borderRadius: 10,
        background: hov ? `rgba(${hexToRgb(color)},0.1)` : "transparent",
        border: `1px solid ${hov ? `rgba(${hexToRgb(color)},0.22)` : "transparent"}`,
        marginBottom: 2,
        transition: "all 0.15s",
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-lg font-black text-xs"
        style={{
          width: 30,
          height: 30,
          background: hov ? `rgba(${hexToRgb(color)},0.18)` : "var(--muted)",
          color: hov ? color : "var(--muted-foreground)",
          border: `1px solid ${hov ? `rgba(${hexToRgb(color)},0.28)` : "var(--border)"}`,
          transition: "all 0.15s",
        }}
      >
        {label[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-foreground leading-tight truncate">{label}</p>
        <p className="text-[9px] text-muted-foreground truncate">{sub}</p>
      </div>
      <ChevronRight
        className="w-3 h-3 text-muted-foreground transition-all"
        style={{ opacity: hov ? 1 : 0, transform: hov ? "translateX(0)" : "translateX(-6px)" }}
      />
    </button>
  );
}

function QuickAttendanceForm({
  ministryId,
  ministryName,
  color,
  onClose,
}: {
  ministryId: string;
  ministryName: string;
  color: string;
  onClose: () => void;
}) {
  const [count, setCount] = React.useState<number | "">("");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async () => {
    if (!count || Number(count) < 0) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("ministry_metric_logs").insert({
        ministry_id: ministryId,
        metric_key: "attendance",
        value: Number(count),
        recorded_by: user?.id,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1800);
    } catch (e) {
      console.error(e);
      alert("Failed to log attendance.");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl"
          style={{ background: color }}
        >
          ✓
        </div>
        <p className="text-sm font-black text-foreground">Attendance Logged!</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Health score will update shortly
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Headcount</label>
        <input
          type="number"
          min="0"
          value={count}
          onChange={(e) => setCount(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="e.g. 45"
          className="w-full bg-muted/20 border border-border rounded-2xl py-3 px-4 text-2xl font-black text-foreground outline-none focus:border-primary/50 text-center"
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Special service, rainy day..."
          className="w-full bg-muted/20 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary/50"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || count === ""}
        className="w-full h-14 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase text-white transition-all active:scale-95 disabled:opacity-40"
        style={{ background: color }}
      >
        {loading ? "LOGGING..." : "LOG ATTENDANCE"}
      </button>
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "139,92,246";
}
