"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface MinistryHubGridProps {
  onSelect: (ministry: any) => void;
}

export function MinistryHubGrid({ onSelect }: MinistryHubGridProps) {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hov, setHov] = useState<string | null>(null);

  useEffect(() => {
    async function loadHub() {
      const { data } = await supabase.from('vw_ministry_intelligence').select('*');
      setMinistries(data || []);
      setLoading(false);
    }
    loadHub();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-3xl border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ministries.map((m) => {
        const isH = hov === m.id;
        const color = m.primary_color || "#8B5CF6";
        const rgb = hexToRgb(color);

        return (
          <motion.div
            key={m.id}
            onMouseEnter={() => setHov(m.id)}
            onMouseLeave={() => setHov(null)}
            onClick={() => onSelect(m)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-[32px] border transition-all p-6 z-10"
            style={{
              background: isH
                ? `linear-gradient(145deg, rgba(${rgb},0.12), var(--card) 70%)`
                : `linear-gradient(145deg, rgba(${rgb},0.06), var(--card) 70%)`,
              borderColor: isH ? `rgba(${rgb},0.4)` : 'var(--border)',
              boxShadow: isH ? `0 20px 40px rgba(${rgb},0.08)` : 'none',
              pointerEvents: 'auto'
            }}
          >
            {/* Top accent line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ background: `linear-gradient(90deg, ${color}, #6D28D9)` }} 
            />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{m.intelligence_tag || 'DECENTRALIZED'}</p>
                <h3 className="text-lg font-black text-foreground leading-tight">{m.name}</h3>
              </div>
              <Badge className="bg-primary/20 text-primary border-0 text-[8px] font-black tracking-widest uppercase">
                LEADER
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground/70 leading-relaxed mb-6 line-clamp-2">
              Management and intelligence silo for the {m.name}. Track health, team engagement, and AI-driven growth metrics.
            </p>

            <div className="grid grid-cols-3 gap-2">
               <HubStat label="HEALTH" value={m.health_score || "72"} color={color} />
               <HubStat label="TREND" value={m.trend_direction?.toUpperCase() || "STABLE"} />
               <HubStat label="LOGS" value={m.slug === 'worship' ? '4' : '—'} />
            </div>

            <div className="mt-4 flex justify-end">
               <p className="text-[9px] font-black uppercase tracking-widest transition-opacity group-hover:opacity-100 opacity-0" style={{ color }}>
                 Open Dashboard →
               </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HubStat({ label, value, color }: any) {
  return (
    <div className="bg-muted/30 rounded-2xl p-3 border border-border/5">
       <p className="text-[10px] font-black text-foreground leading-none mb-1" style={{ color }}>{value}</p>
       <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : "139, 92, 246";
}
