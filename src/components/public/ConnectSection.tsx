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
      setFormData({ first_name: '', last_name: '', email: '', message: '' });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send — please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Input style — --input token is off-white so inputs show on white card */
  const inputStyle = {
    background: 'var(--input)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    <section id="give" data-section="connect" className="py-32 px-6 scroll-mt-20"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            GET CONNECTED
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            Inquiries &amp; Questions
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Have a question or want to know more about our community? Fill out the form below and we'll get back to you shortly.
          </p>
        </div>

        {/* Form Card — white card on section-alt background = clearly visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-10 md:p-12 space-y-8"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest block"
                       style={{ color: 'var(--muted-foreground)' }}>
                  First Name <span style={{ color: 'var(--jkc-gold)' }}>*</span>
                </label>
                <Input
                  required
                  placeholder="John"
                  className="rounded-xl h-12 px-4 border transition-all focus-visible:ring-2"
                  style={{ ...inputStyle, '--tw-ring-color': 'var(--jkc-gold)' } as React.CSSProperties}
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest block"
                       style={{ color: 'var(--muted-foreground)' }}>
                  Last Name
                </label>
                <Input
                  placeholder="Doe"
                  className="rounded-xl h-12 px-4 border transition-all"
                  style={inputStyle}
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest block"
                     style={{ color: 'var(--muted-foreground)' }}>
                Email Address <span style={{ color: 'var(--jkc-gold)' }}>*</span>
              </label>
              <Input
                required
                type="email"
                placeholder="john@example.com"
                className="rounded-xl h-12 px-4 border transition-all"
                style={inputStyle}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest block"
                     style={{ color: 'var(--muted-foreground)' }}>
                Your Message
              </label>
              <Textarea
                placeholder="Tell us how we can help you..."
                className="rounded-xl min-h-[140px] p-4 border transition-all resize-none"
                style={inputStyle}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="btn-navy w-full h-14 font-black text-xs tracking-[0.3em] rounded-full"
                style={{
                  background: loading ? 'var(--muted)' : 'var(--jkc-navy)',
                  color: loading ? 'var(--muted-foreground)' : '#ffffff',
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
