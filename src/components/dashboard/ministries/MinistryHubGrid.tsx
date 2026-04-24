"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface MinistryHubGridProps {
  onSelect: (ministry: any) => void;
  userId?: string;
}

export function MinistryHubGrid({ onSelect, userId }: MinistryHubGridProps) {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [hubCards, setHubCards] = useState<Record<string, any[]>>({});
  const [userLeaderIds, setUserLeaderIds] = useState<Set<string>>(new Set());
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hov, setHov] = useState<string | null>(null);

  useEffect(() => {
    async function loadHub() {
      // ── 1. Resolve global-admin status ──────────────────────────────
      let adminFlag = false;
      if (userId) {
        const { data: globalRoles } = await supabase
          .from("org_members")
          .select("role")
          .eq("user_id", userId)
          .in("role", ["admin", "owner", "shepherd", "pastor", "super_admin", "super-admin"]);
        adminFlag = !!(globalRoles && globalRoles.length > 0);
        setIsGlobalAdmin(adminFlag);
      }

      // ── 2. Build ministry query ─────────────────────────────────────
      let query = supabase.from("vw_ministry_dashboard").select("*");

      if (userId && !adminFlag) {
        const { data: mems } = await supabase
          .from("ministry_members")
          .select("ministry_id")
          .eq("user_id", userId)
          .eq("is_active", true);

        const ids = mems?.map((m) => m.ministry_id) ?? [];
        if (ids.length === 0) {
          setMinistries([]);
          setLoading(false);
          return;
        }
        query = query.in("ministry_id", ids);
      }

      const { data: rows } = await query;
      const list = rows ?? [];
      setMinistries(list);

      // ── 3. Resolve per-ministry leader role (for LEADER pill) ───────
      if (userId) {
        const { data: leaderRows } = await supabase
          .from("ministry_members")
          .select("ministry_id, ministry_role")
          .eq("user_id", userId)
          .in("ministry_role", ["leader", "ministry_lead", "ministry_leader"])
          .eq("is_active", true);

        setUserLeaderIds(new Set((leaderRows ?? []).map((r: any) => r.ministry_id)));
      }

      // ── 4. Fetch hub-card stats for each ministry in parallel ───────
      if (list.length > 0) {
        const results = await Promise.all(
          list.map((m: any) =>
            supabase
              .rpc("fn_ministry_hub_card", { p_ministry_id: m.ministry_id })
              .then(({ data }) => ({ id: m.ministry_id, cards: data ?? [] }))
          )
        );
        const map: Record<string, any[]> = {};
        results.forEach(({ id, cards }) => { map[id] = cards; });
        setHubCards(map);
      }

      setLoading(false);
    }

    loadHub();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-3xl border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ministries.map((m) => {
        const isH = hov === m.ministry_id;
        const color = m.primary_color || "#8B5CF6";
        const rgb = hexToRgb(color);
        const cards: any[] = hubCards[m.ministry_id] ?? [];
        const isLeader = isGlobalAdmin || userLeaderIds.has(m.ministry_id);

        return (
          <motion.div
            key={m.ministry_id}
            onMouseEnter={() => setHov(m.ministry_id)}
            onMouseLeave={() => setHov(null)}
            onClick={() => onSelect(m)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-[28px] border transition-all p-6 z-10"
            style={{
              background: isH
                ? `linear-gradient(145deg, rgba(${rgb},0.12), var(--card) 70%)`
                : `linear-gradient(145deg, rgba(${rgb},0.06), var(--card) 70%)`,
              borderColor: isH ? `rgba(${rgb},0.38)` : "var(--border)",
              boxShadow: isH ? `0 20px 40px rgba(${rgb},0.08)` : "none",
            }}
          >
            {/* top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${color}, ${m.secondary_color || "#6D28D9"})` }}
            />

            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color }}>
                  {m.intelligence_tag || "DECENTRALIZED"}
                </p>
                <h3 className="text-base font-black text-foreground leading-tight">{m.name}</h3>
              </div>
              <Badge
                className="text-[8px] font-black tracking-widest uppercase border-0 flex-shrink-0 mt-0.5"
                style={{
                  color,
                  backgroundColor: `rgba(${rgb},0.14)`,
                  border: `1px solid rgba(${rgb},0.28)`,
                }}
              >
                {isLeader ? "LEADER" : "MEMBER"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground/70 leading-relaxed mb-5 line-clamp-2">
              {m.description || `Intelligence silo for the ${m.name}.`}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {cards.length > 0 ? (
                cards.slice(0, 3).map((c: any, i: number) => (
                  <HubStat
                    key={i}
                    label={c.label ?? "STAT"}
                    value={c.current_value != null ? String(c.current_value) : "—"}
                    color={i === 0 ? color : undefined}
                  />
                ))
              ) : (
                // Fallback to view data while hub cards load
                <>
                  <HubStat label="HEALTH" value={m.health_score != null ? `${m.health_score}/100` : "—"} color={color} />
                  <HubStat label="ATTENDANCE" value={m.avg_attendance_quarter != null ? String(m.avg_attendance_quarter) : "—"} />
                  <HubStat label="REPORTS" value={m.reports_this_quarter != null ? String(m.reports_this_quarter) : "—"} />
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <p
                className="text-[9px] font-black uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100"
                style={{ color }}
              >
                Open Dashboard →
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HubStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/30 rounded-xl p-2.5 border border-border/5">
      <p className="text-[11px] font-black text-foreground leading-none mb-1" style={color ? { color } : {}}>
        {value}
      </p>
      <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "139,92,246";
}
