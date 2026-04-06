'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Sparkles, Share2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/utils';
import ConnectSection from './ConnectSection';

export default function InitialConnectModal({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // SECURITY/UX: Only show automatic pop-up for guests who aren't already logged in
    const hasSeenModal = sessionStorage.getItem('kcc_modal_shown');
    if (!user && !hasSeenModal) {
      // 2 second delay as specified
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('kcc_modal_shown', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // LISTEN FOR CUSTOM TRIGGER (e.g., from Guest Attendance buttons)
  useEffect(() => {
    const triggerModal = () => setIsOpen(true);
    window.addEventListener('open-connect-modal', triggerModal);
    return () => window.removeEventListener('open-connect-modal', triggerModal);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleShare = () => {
    const connectUrl = `${window.location.origin}${basePath}/connect`;
    if (navigator.share) {
      navigator.share({
        title: 'Japan Kingdom Church - Connect Card',
        text: 'Join our family and connect with us!',
        url: connectUrl,
      });
    } else {
      navigator.clipboard.writeText(connectUrl);
      toast.success("Connect Card link copied!");
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + basePath + '/connect?via=qr')}&color=1B3A6B`;

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
            className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col pointer-events-auto"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center z-50 hover:scale-110 transition-all text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:grid md:grid-cols-12">
                
                {/* Left side: QR & CTA */}
                <div className="md:col-span-5 bg-jkc-navy p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-jkc-gold blur-[100px] opacity-10 rounded-full" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-jkc-gold/30 bg-jkc-gold/10 text-jkc-gold mb-2">
                           <Sparkles size={12} />
                           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Kingdom Connect</span>
                        </div>
                        <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">Kingdom <br/><span className="text-jkc-gold">Connect Card</span></h3>
                    </div>

                    <div className="bg-white p-4 rounded-[2rem] shadow-2xl relative z-10 w-48 h-48 flex items-center justify-center">
                        <img 
                           src={qrUrl} 
                           alt="Kingdom Connect QR"
                           className="w-full h-full rounded-lg"
                        />
                    </div>

                    <div className="relative z-10 space-y-3 w-full">
                      <Button 
                        onClick={handleShare}
                        variant="outline" 
                        className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 gap-2 font-black text-[10px] tracking-widest"
                      >
                        <Share2 size={12} /> Share this card ↗
                      </Button>
                    </div>
                </div>

                {/* Right side: Form Panel */}
                <div className="md:col-span-7 bg-white dark:bg-slate-950 overflow-y-auto max-h-[80vh] relative">
                    <div className="p-2 sm:p-4">
                      {/* We use the existing ConnectSection but stripped down via CSS or just as is */}
                      <ConnectSection />
                    </div>
                    
                    <div className="p-8 pt-0 text-center">
                        <button 
                          onClick={() => {
                            handleClose();
                            window.location.href = basePath + '/connect';
                          }}
                          className="text-[10px] font-black text-jkc-navy dark:text-jkc-gold uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2 mx-auto"
                        >
                          See all connection options →
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

