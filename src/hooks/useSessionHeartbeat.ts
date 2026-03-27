"use client";
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseSessionHeartbeatOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
  activityTimeoutMs?: number;
}

export const useSessionHeartbeat = ({
  enabled = true,
  refreshIntervalMs = 10 * 60 * 1000, // 10 minutes
  activityTimeoutMs = 5 * 60 * 1000 // 5 minutes
}: UseSessionHeartbeatOptions = {}) => {
  const activityTimerRef = useRef<NodeJS.Timeout>(undefined);
  const refreshTimerRef = useRef<NodeJS.Timeout>(undefined);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('Session refresh failed:', error.message);
      }
      return !!session;
    } catch (error) {
      console.warn('Session refresh error:', error);
      return false;
    }
  }, []);

  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    activityTimerRef.current = setTimeout(async () => {
      await refreshSession();
    }, activityTimeoutMs);
  }, [refreshSession, activityTimeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    // Set up periodic refresh
    refreshTimerRef.current = setInterval(refreshSession, refreshIntervalMs);
    
    // Set up activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetActivityTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Initial activity timer
    resetActivityTimer();
    
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [enabled, refreshSession, refreshIntervalMs, resetActivityTimer]);

  return { refreshSession };
};
