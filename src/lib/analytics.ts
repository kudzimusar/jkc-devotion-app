'use client';

import { supabase } from '@/lib/supabase';

// Allowed event types — must match chk_ppe_event_type DB constraint exactly
export type PlatformEventType =
  | 'page_view' | 'church_profile_view' | 'registry_search' | 'sermon_click'
  | 'cta_click' | 'visit_modal_open' | 'join_modal_open' | 'video_play'
  | 'devotion_click' | 'time_on_page' | 'newsletter_open' | 'giving_click'
  | 'philanthropy_click' | 'walkthrough_tab' | 'register_pathway_click'
  | 'login_portal_click' | 'search_result_click' | 'load_more_click'
  | 'filter_apply' | 'social_click' | 'support_click' | 'audit_open';

interface TrackPayload {
  event_type: PlatformEventType;
  page_path: string;
  church_slug?: string;
  search_query?: string;
  cta_label?: string;
  time_on_page?: number;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'cos_platform_session';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// Fire and forget — never awaited in components, never blocks rendering
// Errors are silently swallowed — analytics must never affect UX
export function trackEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;
  
  const insert = async () => {
    try {
      await supabase.from('platform_page_events').insert({
        event_type: payload.event_type,
        page_path: payload.page_path,
        church_slug: payload.church_slug ?? null,
        search_query: payload.search_query ?? null,
        cta_label: payload.cta_label ?? null,
        time_on_page: payload.time_on_page ?? null,
        session_id: getOrCreateSessionId(),
        referrer: document.referrer || null,
        device_type: getDeviceType(),
      });
    } catch {
      // Silently swallow — analytics never breaks the page
    }
  };

  // Non-blocking: runs after current execution context
  setTimeout(insert, 0);
}

// Convenience: tracks time on page when component unmounts or user leaves
// Call this in a useEffect cleanup function
export function trackTimeOnPage(pagePath: string, startTime: number, churchSlug?: string): void {
  const seconds = Math.round((Date.now() - startTime) / 1000);
  if (seconds < 3) return; // ignore bounces under 3 seconds
  trackEvent({
    event_type: 'time_on_page',
    page_path: pagePath,
    church_slug: churchSlug,
    time_on_page: seconds,
  });
}
