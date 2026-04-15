
import { supabase } from './supabase';

export interface PulseData {
  totalMembers: number;
  newSeekers: number;
  weeklyAttendance: number;
  onlineReach: number;
  retentionRate: number;
  trends: {
    members: number;
    seekers: number;
    attendance: number;
    reach: number;
    retention: number;
  };
}

export interface MonthlyBreakdown {
  month_start: string;
  total_amount: number;
}

export interface FinanceSummary {
  monthlyIncome: number;
  incomeTrend: number;
  budgetPerformance: number;
  topMinistry: string;
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface MinistryHealth {
  name: string;
  score: number;
  status: string;
  color: string;
}

export interface CareAlert {
  id: string;
  name: string;
  issue: string;
  urgency: 'High' | 'Moderate' | 'Low';
  action: string;
}

export interface CorrespondenceSummary {
  memberMessages: number;
  websiteInquiries: number;
  adminDirect: number;
  externalGmail: number;
}

/**
 * STRATEGIC INTELLIGENCE FETCHER
 * Consumes synthesized SQL views for the Pastor HQ.
 * Uses public client (RLS enforced).
 */
export async function getPastorDashboardData(orgId?: string) {
  // 1. Check Auth & Org context
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  let effectiveOrgId = orgId;
  if (!effectiveOrgId) {
    const { data: member } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    effectiveOrgId = member?.org_id || undefined;
  }

  if (!effectiveOrgId) return null;

  // Pulse & Attendance — weekly attendance trends
  const { data: attendanceTrends } = await supabase
    .from('vw_church_attendance_trends')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('week_start', { ascending: false })
    .limit(2);

  const { count: totalMembers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .eq('membership_status', 'member');

  const { count: newSeekers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .eq('membership_status', 'visitor');

  const { count: pendingMembersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .eq('membership_status', 'pending');

  const { count: volunteerAppsCount } = await supabase
    .from('ministry_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .eq('status', 'pending');

  const { count: adminDirectCount } = await supabase
    .from('communication_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .eq('audience_scope', 'admin_direct');

  const { count: emailCampaignCount } = await supabase
    .from('communication_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId)
    .contains('channels', ['email'])
    .neq('status', 'draft');

  // Church Overview — member growth trend (current vs prev month)
  const { data: churchOverview } = await supabase
    .from('vw_church_overview')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('month', { ascending: false })
    .limit(2);

  // Growth Intelligence — outreach reach & contacts trend
  const { data: growthIntel } = await supabase
    .from('vw_growth_intelligence')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('month', { ascending: false })
    .limit(2);

  // Spiritual Pulse — aggregate milestone counts (foundational KPIs)
  const { data: spiritualPulse } = await supabase
    .from('vw_spiritual_pulse')
    .select('*')
    .maybeSingle();

  // Public Engagement — weekly online/public engagement by org
  const { data: publicEngagement } = await supabase
    .from('vw_public_engagement')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('week_start', { ascending: false })
    .limit(2);

  // Ministry Health
  const { data: ministryHealthData } = await supabase
    .from('vw_ministry_health')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .limit(5);

  const ministries: MinistryHealth[] = (ministryHealthData || []).map(m => ({
    name: m.name,
    score: m.health_score,
    status: m.status,
    color: m.health_score > 80 ? 'text-emerald-500' : m.health_score > 50 ? 'text-amber-500' : 'text-red-500'
  }));

  // Top ministry by health score
  const topMinistryRecord = (ministryHealthData || []).reduce((best: any, m: any) => {
    return (!best || (m.health_score || 0) > (best.health_score || 0)) ? m : best;
  }, null);

  // Financial Momentum — current month + last 6 months for chart
  const { data: financeData } = await supabase
    .from('vw_financial_momentum')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('month_start', { ascending: false })
    .limit(2);

  const { data: monthlyBreakdownData } = await supabase
    .from('vw_financial_momentum')
    .select('month_start, total_amount')
    .eq('org_id', effectiveOrgId)
    .order('month_start', { ascending: true })
    .limit(6);

  const currentMonthFinance = financeData?.[0];
  const totalIncome = Number(currentMonthFinance?.total_amount || 0);

  // Budget performance: current month income vs prev month as a percentage
  const prevMonthFinanceTotal = Number(financeData?.[1]?.total_amount || 0);
  const budgetPerformance = prevMonthFinanceTotal > 0
    ? Math.min(200, Math.round((totalIncome / prevMonthFinanceTotal) * 100))
    : (totalIncome > 0 ? 100 : 0);

  // Care Alerts
  const { data: alerts } = await supabase
    .from('member_alerts')
    .select('id, alert_type, severity, profiles(name, org_id)')
    .eq('is_resolved', false)
    .eq('profiles.org_id', effectiveOrgId)
    .limit(5);

  const careAlerts: CareAlert[] = (alerts || []).map(alert => ({
    id: alert.id,
    name: (alert.profiles as any)?.name || 'Anonymous',
    issue: alert.alert_type,
    urgency: alert.severity === 'critical' ? 'High' : 'Moderate',
    action: alert.severity === 'critical' ? 'Immediate Call' : 'Review Case'
  }));

  // Spiritual Climate (Sentiment View)
  const { data: climate } = await supabase
    .from('vw_spiritual_climate')
    .select('*')
    .eq('org_id', effectiveOrgId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Correspondence
  const { count: websiteInquiries } = await supabase
    .from('public_inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId);

  const { count: prayerCount } = await supabase
    .from('prayer_requests')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', effectiveOrgId);

  // Calculated trends from vw_church_attendance_trends
  const currentAttendance = attendanceTrends?.[0]?.total_attended || 0;
  const prevAttendance = attendanceTrends?.[1]?.total_attended || 0;
  const attendanceTrend = prevAttendance > 0
    ? Math.round(((currentAttendance - prevAttendance) / prevAttendance) * 100)
    : 0;

  const prevMonthIncome = Number(financeData?.[1]?.total_amount || 0);
  const incomeTrend = prevMonthIncome > 0
    ? Math.round(((totalIncome - prevMonthIncome) / prevMonthIncome) * 100)
    : 0;

  // Member growth trend from vw_church_overview
  const currentMonthMembers = churchOverview?.[0]?.total_members || (totalMembers || 0);
  const prevMonthMembers = churchOverview?.[1]?.total_members || 0;
  const membersTrend = prevMonthMembers > 0
    ? Math.round(((currentMonthMembers - prevMonthMembers) / prevMonthMembers) * 100)
    : 0;

  // Seeker trend from vw_church_overview (new_visitors column) or vw_growth_intelligence
  const currentSeekers = churchOverview?.[0]?.new_visitors || (newSeekers || 0);
  const prevSeekers = churchOverview?.[1]?.new_visitors || 0;
  const seekersTrend = prevSeekers > 0
    ? Math.round(((currentSeekers - prevSeekers) / prevSeekers) * 100)
    : 0;

  // Online reach trend from vw_public_engagement
  const currentOnlineReach = publicEngagement?.[0]?.total_views || attendanceTrends?.[0]?.online_count || 0;
  const prevOnlineReach = publicEngagement?.[1]?.total_views || 0;
  const reachTrend = prevOnlineReach > 0
    ? Math.round(((currentOnlineReach - prevOnlineReach) / prevOnlineReach) * 100)
    : 0;

  // Reach from vw_growth_intelligence
  const currentReach = growthIntel?.[0]?.people_reached || 0;
  const prevReach = growthIntel?.[1]?.people_reached || 0;
  const growthReachTrend = prevReach > 0
    ? Math.round(((currentReach - prevReach) / prevReach) * 100)
    : 0;

  // Retention rate from vw_spiritual_pulse (foundations_complete / total_formal_members)
  const foundationsComplete = spiritualPulse?.foundations_complete || 0;
  const formalMembers = spiritualPulse?.total_formal_members || (totalMembers || 1);
  const retentionRate = formalMembers > 0
    ? Math.min(100, Math.round((foundationsComplete / formalMembers) * 100))
    : (climate?.avg_engagement || 0);

  return {
    pulse: {
      totalMembers: totalMembers || 0,
      newSeekers: newSeekers || 0,
      pendingMembers: pendingMembersCount || 0,
      volunteerApplications: volunteerAppsCount || 0,
      weeklyAttendance: attendanceTrends?.[0]?.total_attended || 0,
      onlineReach: currentOnlineReach,
      retentionRate,
      trends: {
        members: membersTrend,
        seekers: seekersTrend,
        attendance: attendanceTrend,
        reach: growthReachTrend || reachTrend,
        retention: 0
      }
    },
    finance: {
      monthlyIncome: totalIncome,
      incomeTrend,
      budgetPerformance,
      topMinistry: topMinistryRecord?.name || "",
      monthlyBreakdown: (monthlyBreakdownData || []).map(r => ({
        month_start: r.month_start,
        total_amount: Number(r.total_amount || 0)
      }))
    },
    ministriesHealth: ministries.length > 0 ? ministries : [
      { name: "Default Dept", score: 100, status: "Strong", color: "text-emerald-500" }
    ],
    careAlerts: careAlerts.length > 0 ? careAlerts : [
      { id: '1', name: "Check Live Feed", issue: "No active alerts", urgency: "Low", action: "N/A" }
    ],
    correspondence: {
      memberMessages: prayerCount || 0,
      websiteInquiries: websiteInquiries || 0,
      adminDirect: adminDirectCount || 0,
      externalGmail: emailCampaignCount || 0
    },
    climate: {
        theme: climate?.dominant_theme || "Peace",
        confidence: climate?.avg_engagement || 0
    }
  };
}
