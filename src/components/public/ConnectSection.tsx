'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { usePublicTheme } from './PublicThemeWrapper';

export default function ConnectSection() {
  const { isDark } = usePublicTheme();
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
    <section id="give" data-section="connect" className="py-32 px-6 scroll-mt-20 border-t"
             style={{ background: 'var(--section-alt)', borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-navy)' }}>
            GET CONNECTED
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            Inquiries & Questions
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Have a question or want to know more about our community? Fill out the form below and we'll get back to you shortly.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[3rem] p-10 md:p-12 border shadow-2xl space-y-8 text-left"
          style={{ 
             background: 'var(--card)', 
             borderColor: 'var(--border)',
             boxShadow: isDark ? 'none' : 'var(--shadow-xl)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-4"
                       style={{ color: 'var(--muted-foreground)' }}>
                  First Name <span className="text-[var(--jkc-gold)]">*</span>
                </label>
                <Input
                  required
                  placeholder="John"
                  className="rounded-2xl h-14 px-6 focus:ring-1 focus:ring-[var(--jkc-gold)] transition-all"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-4"
                       style={{ color: 'var(--muted-foreground)' }}>
                  Last Name
                </label>
                <Input
                  placeholder="Doe"
                  className="rounded-2xl h-14 px-6 focus:ring-1 focus:ring-[var(--jkc-gold)] transition-all"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest ml-4"
                     style={{ color: 'var(--muted-foreground)' }}>
                Email Address <span className="text-[var(--jkc-gold)]">*</span>
              </label>
              <Input
                required
                type="email"
                placeholder="john@example.com"
                className="rounded-2xl h-14 px-6 focus:ring-1 focus:ring-[var(--jkc-gold)] transition-all"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest ml-4"
                     style={{ color: 'var(--muted-foreground)' }}>
                Your inquiry here...
              </label>
              <Textarea
                placeholder="Tell us how we can help you..."
                className="rounded-[2rem] min-h-[160px] p-6 focus:ring-1 focus:ring-[var(--jkc-gold)] transition-all resize-none"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 font-black text-xs tracking-[0.3em] rounded-full transition-all"
                style={{
                   background: 'var(--jkc-navy)',
                   color: 'var(--primary-foreground)',
                   boxShadow: 'var(--shadow-md)'
                }}
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
