'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { basePath as BP } from '@/lib/utils';
import { ArrowRight, Mail, UserPlus, Heart, AlertTriangle } from 'lucide-react';

interface PendingAction {
  id: string;
  type: 'inquiry' | 'volunteer' | 'prayer' | 'member_alert';
  title: string;
  description: string;
  count: number;
  urgency: 'normal' | 'high' | 'urgent';
  href: string;
  icon: React.ElementType;
}

export function PendingActionsCard({ orgId }: { orgId: string }) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    async function fetchPendingActions() {
      const pending: PendingAction[] = [];

      const [
        { count: newInquiries },
        { count: pendingVolunteers },
        { count: highPrayers },
        { count: unresolvedAlerts },
      ] = await Promise.all([
        supabase
          .from('public_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('status', 'new'),
        supabase
          .from('ministry_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('status', 'pending'),
        supabase
          .from('prayer_requests')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('urgency', 'High')
          .eq('status', 'active'),
        supabase
          .from('member_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('is_resolved', false),
      ]);

      if ((newInquiries ?? 0) > 0) {
        pending.push({
          id: 'new-inquiries',
          type: 'inquiry',
          title: 'New Website Inquiries',
          description: `${newInquiries} unreviewed submission${(newInquiries ?? 0) !== 1 ? 's' : ''} this week`,
          count: newInquiries ?? 0,
          urgency: 'high',
          href: `${BP}/pastor-hq/inquiries`,
          icon: Mail,
        });
      }

      if ((pendingVolunteers ?? 0) > 0) {
        pending.push({
          id: 'pending-volunteers',
          type: 'volunteer',
          title: 'Volunteer Applications',
          description: `${pendingVolunteers} application${(pendingVolunteers ?? 0) !== 1 ? 's' : ''} awaiting approval`,
          count: pendingVolunteers ?? 0,
          urgency: 'normal',
          href: `${BP}/shepherd/dashboard/`,
          icon: UserPlus,
        });
      }

      if ((highPrayers ?? 0) > 0) {
        pending.push({
          id: 'high-prayers',
          type: 'prayer',
          title: 'High-Priority Prayer Requests',
          description: `${highPrayers} request${(highPrayers ?? 0) !== 1 ? 's' : ''} marked High urgency`,
          count: highPrayers ?? 0,
          urgency: 'urgent',
          href: `${BP}/pastor-hq/prayer-requests`,
          icon: Heart,
        });
      }

      if ((unresolvedAlerts ?? 0) > 0) {
        pending.push({
          id: 'member-alerts',
          type: 'member_alert',
          title: 'Members Needing Care',
          description: `${unresolvedAlerts} member${(unresolvedAlerts ?? 0) !== 1 ? 's' : ''} flagged for pastoral care`,
          count: unresolvedAlerts ?? 0,
          urgency: 'high',
          href: `${BP}/shepherd/dashboard/`,
          icon: AlertTriangle,
        });
      }

      setActions(pending);
      setLoading(false);
    }

    fetchPendingActions();
  }, [orgId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-6 text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          All clear — no pending actions
        </p>
      </div>
    );
  }

  const urgencyStyles: Record<string, string> = {
    urgent: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
    high:   'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    normal: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
  };

  const countStyles: Record<string, string> = {
    urgent: 'bg-red-500 text-white',
    high:   'bg-amber-500 text-white',
    normal: 'bg-violet-600 text-white',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <a
            key={action.id}
            href={action.href}
            className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] ${urgencyStyles[action.urgency]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">{action.title}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${countStyles[action.urgency]}`}>
                {action.count}
              </span>
            </div>
            <p className="text-[11px] font-medium opacity-80">{action.description}</p>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mt-auto">
              Review <ArrowRight className="w-3 h-3" />
            </div>
          </a>
        );
      })}
    </div>
  );
}
