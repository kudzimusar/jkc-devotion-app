'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ConnectSection() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('public_inquiries')
        .insert([formData]);

      if (error) throw error;

      toast.success("Thanks for submitting! We'll be in touch.");
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        message: ''
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="give" data-section="connect" className="py-32 px-6 scroll-mt-20">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">
            GET CONNECTED
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white/90">
            Inquiries & Questions
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            Have a question or want to know more about our community? Fill out the form below and we'll get back to you shortly.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-[3rem] p-10 md:p-12 border border-white/10 shadow-2xl space-y-8 text-left bg-white/5"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">
                  First Name <span className="text-[var(--primary)]">*</span>
                </label>
                <Input 
                  required
                  placeholder="John"
                  className="bg-black/20 border-white/10 rounded-2xl h-14 px-6 focus:border-[var(--primary)]/50 transition-colors"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">
                  Last Name
                </label>
                <Input 
                  placeholder="Doe"
                  className="bg-black/20 border-white/10 rounded-2xl h-14 px-6 focus:border-[var(--primary)]/50 transition-colors"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">
                Email Address <span className="text-[var(--primary)]">*</span>
              </label>
              <Input 
                required
                type="email"
                placeholder="john@example.com"
                className="bg-black/20 border-white/10 rounded-2xl h-14 px-6 focus:border-[var(--primary)]/50 transition-colors"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">
                Your inquiry here...
              </label>
              <Textarea 
                placeholder="Tell us how we can help you..."
                className="bg-black/20 border-white/10 rounded-[2rem] min-h-[160px] p-6 focus:border-[var(--primary)]/50 transition-colors resize-none"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-[var(--primary)] text-white font-black text-xs tracking-[0.3em] rounded-full shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? "SENDING..." : "SUBMIT INQUIRY"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
