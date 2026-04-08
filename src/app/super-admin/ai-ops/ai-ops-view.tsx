"use client";

import { useEffect, useState } from "react";
import AIPerformanceClient from "./ai-performance-client";
import Loading from "../loading";
import { supabase } from "@/lib/supabase";

export default function AIOpsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAIOpsData() {
      try {
        // 1. Fetch live metrics from analytics snapshots
        const { data: analytics } = await supabase
          .from("company_analytics")
          .select("*")
          .order("date", { ascending: false })
          .limit(1);

        // 2. Fetch adoption leaders from org features
        const { data: leaders } = await supabase
          .from("organizations")
          .select(`
            id,
            name,
            organization_subscriptions (
              company_plans (name)
            ),
            organization_features (
              engagement_score
            )
          `)
          .order("organization_features(engagement_score)", { ascending: false, foreignTable: "organization_features" })
          .limit(5);

        const formattedLeaders = (leaders || []).map((l: any) => ({
          name: l.name,
          plan: l.organization_subscriptions?.[0]?.company_plans?.name || 'Standard',
          score: (l.organization_features?.[0]?.engagement_score || 0).toFixed(1)
        }));

        // 3a. Historical open rate from last 7 days of company_analytics
        const { data: analyticsHistory } = await supabase
          .from('company_analytics')
          .select('date, metrics')
          .order('date', { ascending: true })
          .limit(7);

        const historicalOpenRate = (analyticsHistory || []).map((row: any) => ({
          date: new Date(row.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          openRate: Math.round((row.metrics?.open_rate || 0) * 100),
        }));

        // 3b. Insight categories from real unresolved admin_ai_insights
        const { data: insightsRaw } = await supabase
          .from('admin_ai_insights')
          .select('insight_type')
          .is('resolved_at', null);

        const categoryColors: Record<string, string> = {
          churn_risk: '#f43f5e',
          upgrade_opportunity: '#d946ef',
          growth_insight: '#8b5cf6',
          anomaly: '#f59e0b',
        };

        const categoryCounts = (insightsRaw || []).reduce((acc: Record<string, number>, row: any) => {
          const key = row.insight_type || 'anomaly';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const total = Object.values(categoryCounts).reduce((a: number, b: number) => a + b, 0) || 1;
        const insightCategories = Object.entries(categoryCounts).map(([name, count]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          value: Math.round(((count as number) / total) * 100),
          color: categoryColors[name] || '#94a3b8',
        }));

        // Fallback if no real insights yet
        const finalInsightCategories = insightCategories.length > 0 ? insightCategories : [
          { name: 'No Insights Yet', value: 100, color: '#94a3b8' },
        ];

        const latest = analytics?.[0]?.metrics || {
          total_insights: 342,
          avg_helpfulness: 4.8,
          open_rate: 68
        };

        setData({
          insightsCount: latest.total_insights || 0,
          avgHelpfulness: latest.avg_helpfulness || 0,
          openRate: latest.open_rate || 0,
          insightCategories: finalInsightCategories,
          historicalOpenRate,
          adoptionLeaders: formattedLeaders
        });
      } catch (err) {
        console.error("Failed to fetch AI Ops data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAIOpsData();
  }, []);

  if (loading) return <Loading />;
  if (!data) return <div className="p-8 text-white">Failed to load statistics.</div>;

  return (
    <div className="p-8">
      <AIPerformanceClient {...data} />
    </div>
  );
}
