import { supabase } from '@/lib/supabase';

/**
 * Context Injections: The RAG engine that grounds AI personas in real-time database reality.
 * @see knowledge/domain/index.md for data grounding rules.
 */

export interface PersonaContext {
  shepherd?: {
    prophetic_insights: any[];
    assigned_members: any[];
    recent_absences: any[];
  };
  strategist?: {
    engagement_trends: any;
    growth_metrics: any;
    ministry_performance: any[];
  };
  disciple?: {
    streak: number;
    ninety_day_progress: { completed: number; remaining: number };
    todays_devotion: any;
    recent_soap_entries: any[];
  };
  concierge?: {
    announcements: any[];
    ministries: any[];
    current_devotion_theme: string | null;
    current_scripture?: string | null;
    website_pages: any[];
    checklist?: any[];
    completion_percentage?: number;
    missing_fields?: string[];
  };
  steward?: {
    profile: any;
    skills: any[];
    matching_opportunities: any[];
  };
  facilitator?: {
    group: any;
    members: any[];
    attendance_trend: any;
    prayer_requests: any[];
  };
  sentinel?: {
    system_health: any;
    recent_errors: any[];
    api_status: any;
  };
}

export async function getContextForPersona(
  persona: string,
  orgId: string,
  userId: string | null,
  userRole: string
): Promise<Partial<PersonaContext>> {
  
  const context: Partial<PersonaContext> = {};
  const sanitizedUserId = userId && userId.trim() !== "" ? userId : null;
  
  console.log(`[RAG CONTEXT] Fetching for ${persona} (User: ${sanitizedUserId || 'GUEST'}, Role: ${userRole})`);
  
  if (!sanitizedUserId) {
    console.log(`[RAG CONTEXT] Guest detected — fetching public church info for concierge`);
    // Fall through to switch — concierge case handles guests safely (no userId queries)
  }
  
  try {
    switch (persona) {
      case 'shepherd':
        // Fetch prophetic insights for members with shepherd assigned or general
        const { data: insights } = await supabase
          .from('prophetic_insights')
          .select('*, member:profiles(name, email)')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Fetch assigned members with engagement stats
        const { data: members } = await supabase
          .from('profiles')
          .select('id, name, email, member_stats(current_streak, last_devotion_date)')
          .eq('org_id', orgId)
          .limit(10);
        
        // Fetch members with recent absences (3+ days as per get_at_risk_members logic)
        const absentMembers = members?.filter(m => {
          const stats = Array.isArray(m.member_stats) ? m.member_stats[0] : m.member_stats;
          if (!stats?.last_devotion_date) return true;
          const lastAttend = new Date(stats.last_devotion_date);
          const daysSince = (Date.now() - lastAttend.getTime()) / (1000 * 3600 * 24);
          return daysSince > 3;
        });
        
        context.shepherd = {
          prophetic_insights: insights || [],
          assigned_members: members || [],
          recent_absences: absentMembers || []
        };
        break;
        
      case 'strategist':
        // Aggregated metrics
        const { data: health } = await supabase.rpc('get_church_health_score');
        const { count: totalUserCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        
        const strategistData = {
          engagement_trends: {
            score: health?.score || 0,
            active_devoters: health?.active_devoters || 0,
            total_members: totalUserCount || 0
          },
          growth_metrics: {
            new_last_30_days: 0,
            churn_last_30_days: 0
          },
          ministry_performance: []
        };
        context.strategist = strategistData;
        break;
        
      case 'disciple':
        // User's spiritual stats
        const { data: stats } = await supabase
          .from('member_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        const { data: todaysDevotion } = await supabase
          .from('devotions')
          .select('*')
          .eq('date', new Date().toISOString().split('T')[0])
          .single();
        
        const { data: recentSOAP } = await supabase
          .from('soap_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);
        
        context.disciple = {
          streak: stats?.current_streak || 0,
          ninety_day_progress: {
            completed: stats?.completed_devotions || 0,
            remaining: 90 - (stats?.completed_devotions || 0)
          },
          todays_devotion: todaysDevotion || null,
          recent_soap_entries: Array.isArray(recentSOAP) ? recentSOAP : []
        };
        break;
        
      case 'concierge': {
        const [announcementsRes, ministriesRes, devRes] = await Promise.all([
          supabase.from('ministry_announcements')
            .select('title, body, created_at')
            .eq('org_id', orgId)
            .eq('direction', 'downward')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('ministries')
            .select('name, slug, category, description')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .order('category'),
          supabase.from('devotions')
            .select('title, theme, scripture, date')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        context.concierge = {
          announcements: announcementsRes.data || [],
          ministries: ministriesRes.data || [],
          current_devotion_theme: devRes.data?.theme || null,
          current_scripture: devRes.data?.scripture || null,
          website_pages: [
            { name: 'Home', path: '/welcome', description: 'Church homepage with hero, announcements, feed' },
            { name: 'Watch', path: '/welcome/watch', description: 'Live stream and sermon archive' },
            { name: 'Visit', path: '/welcome/visit', description: 'Service times, location, plan your visit' },
            { name: 'Give', path: '/welcome/give', description: 'Online giving — Stripe, PayPal, Zelle, bank transfer' },
            { name: 'Ministries', path: '/welcome/ministries', description: 'All church ministries and how to join' },
            { name: 'Connect', path: '/welcome/visit', description: 'Contact us, prayer requests, connect card' },
          ],
          ...(sanitizedUserId ? { checklist: [], completion_percentage: 0, missing_fields: [] } : {})
        };
        break;
      }

      case 'steward':
        const { data: stewardProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        context.steward = {
          profile: stewardProfile,
          skills: stewardProfile?.skills_talents || [],
          matching_opportunities: []
        };
        break;

      case 'facilitator':
        // Find user groups
        const { data: userGroups } = await supabase
          .from('fellowship_group_members')
          .select('group:fellowship_groups(*)')
          .eq('user_id', userId);
        
        context.facilitator = {
          group: userGroups?.[0]?.group || null,
          members: [],
          attendance_trend: {},
          prayer_requests: []
        };
        break;

      case 'sentinel':
        const { data: recentInsights } = await supabase
          .from('ai_insights')
          .select('*')
          .order('generated_at', { ascending: false })
          .limit(10);
        
        context.sentinel = {
          system_health: 'Nominal',
          recent_errors: [],
          api_status: recentInsights || []
        };
        break;
        
      default:
        break;
    }
  } catch (error) {
    console.error(`Failed to fetch context for ${persona}:`, error);
  }
  
  return context;
}
