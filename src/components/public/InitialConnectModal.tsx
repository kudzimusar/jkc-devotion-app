'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Sparkles } from 'lucide-react';
import ConnectSection from '@/components/public/ConnectSection';

export default function InitialConnectModal({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // SECURITY/UX: Only show for guests who aren't already logged in
    if (user) return;

    // Check if the user has already seen the modal in this session/browser
    const hasSeenModal = localStorage.getItem('has_seen_connect_modal');
    if (!hasSeenModal) {
      // Reduced delay to 2 seconds for immediate impact
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    // Note: To make it reappear in later sessions, we could use a timestamp here
    localStorage.setItem('has_seen_connect_modal', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto w-full h-full">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col pointer-events-auto hide-scrollbar"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-[var(--section-alt)] border border-[var(--border)] flex items-center justify-center z-50 hover:bg-black/5 hover:scale-110 active:scale-95 transition-all text-[var(--muted-foreground)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row h-full">
                
                {/* Left side: QR Code (Visible mostly on desktop/tablet, or stacked on top on mobile) */}
                <div className="w-full lg:w-1/3 bg-[var(--jkc-navy)] p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--jkc-gold)] blur-[100px] opacity-10 rounded-full" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--jkc-gold)]/30 bg-[var(--jkc-gold)]/10 text-[var(--jkc-gold)] mb-2">
                           <Sparkles className="w-3 h-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Welcome to JKC</span>
                        </div>
                        <h3 className="text-3xl font-black text-white">Scan & Save</h3>
                        <p className="text-sm font-medium text-white/70">
                            Take out your phone to scan the code, or fill out the digital connect card right here to join the family!
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border-4 text-center border-white/20 shadow-2xl relative z-10 w-48 h-48 flex items-center justify-center">
                        <img 
                           src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://kudzimusar.github.io/jkc-devotion-app/welcome/visit&color=1B3A6B" 
                           alt="QR Code to Visit Page"
                           className="w-full h-full rounded-lg"
                        />
                    </div>
                </div>

                {/* Right side: The actual Form */}
                <div className="flex-1 w-full bg-[var(--background)] p-6 sm:p-10 -my-16 scale-[0.9]">
                    <ConnectSection />
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
