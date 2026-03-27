"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestorePromptProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  savedDate?: string;
}

export const RestorePrompt = ({ isOpen, onRestore, onDiscard, savedDate }: RestorePromptProps) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (savedDate) {
      const saved = new Date(savedDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - saved.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMinutes = Math.floor((now.getTime() - saved.getTime()) / (1000 * 60));
        setTimeAgo(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`);
      } else {
        const diffDays = Math.floor(diffHours / 24);
        setTimeAgo(`${diffDays} day${diffDays !== 1 ? 's' : ''} ago`);
      }
    }
  }, [savedDate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 max-w-md glass-card rounded-xl border border-cyan-500/30 shadow-2xl bg-[#171a1f] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">💾</div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">Continue where you left off?</h4>
              <p className="text-sm text-gray-400 mt-1">
                We found saved progress from {timeAgo || 'recently'}.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onRestore}
                  className="px-4 py-1.5 bg-[#72eff5]/20 hover:bg-[#72eff5]/30 text-[#72eff5] rounded-lg text-sm font-bold transition-all"
                >
                  Restore
                </button>
                <button
                  onClick={onDiscard}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-all"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
