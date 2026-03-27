"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchName?: string;
}

export const InviteModal = ({ isOpen, onClose, churchName }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/onboarding/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          churchName: churchName || 'your church'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setEmail('');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 bg-[#0c0e12] shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-white font-headline tracking-tight mb-2 uppercase">Invite a New Sanctuary</h2>
            <p className="text-gray-400 text-sm mb-8 font-light">
              Send a magic link to start the premium onboarding process for another ministry.
            </p>
            
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-[#72eff5]/10 rounded-full flex items-center justify-center mx-auto">
                  <Send className="text-[#72eff5]" size={32} />
                </div>
                <div>
                  <p className="text-[#72eff5] font-black uppercase tracking-widest text-sm">Invitation sent!</p>
                  <p className="text-gray-400 text-xs mt-2">
                    Check {email} for the magic link.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Pastor/Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lead@newchurch.org"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#72eff5]/50 transition-all"
                    required
                  />
                </div>
                
                {error && (
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1">{error}</p>
                )}
                
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-br from-[#72eff5] to-[#1fb1b7] text-[#002829] rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
