"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionExpiryWarningProps {
  onSessionRefreshed?: () => void;
}

export const SessionExpiryWarning = ({ onSessionRefreshed }: SessionExpiryWarningProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const remaining = expiresAt - now;
      
      // Show warning if less than 5 minutes remaining
      if (remaining < 300 && remaining > 0) {
        setTimeRemaining(remaining);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    
    checkSession();
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (session && !error) {
        setShowWarning(false);
        onSessionRefreshed?.();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed bottom-4 right-4 z-[60] glass-card rounded-xl border border-[#ffd709]/50 shadow-2xl bg-[#171a1f] p-4 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="text-[#ffd709] text-xl">⏰</div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm uppercase tracking-wider">Session expiring soon</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {minutes > 0 ? `${minutes}m ` : ''}{seconds}s remaining
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-[#ffd709]/10 hover:bg-[#ffd709]/20 text-[#ffd709] rounded-lg text-xs font-black uppercase transition-all disabled:opacity-50"
            >
              {isRefreshing ? '...' : 'Stay'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
