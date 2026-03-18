'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Loader2 } from 'lucide-react';

export default function TestimoniesSection() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonies() {
      try {
        const { data } = await supabase
          .from('public_testimonies')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) setTestimonies(data);
      } catch (err) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonies();
  }, []);

  if (loading) return (
    <div className="py-20 flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]/20" />
    </div>
  );

  if (testimonies.length === 0) {
    return null;
  }

  return (
    <div data-section="testimonies" className="relative">
      {/* Wave top — from gray into navy */}
      <div className="h-16 overflow-hidden" style={{ background: 'var(--section-alt)' }}>
        <svg viewBox="0 0 1440 64" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z"
            fill="var(--footer-bg)"
          />
        </svg>
      </div>

      <section className="py-32 overflow-hidden"
               style={{ background: 'var(--footer-bg)' }}>
        <div className="max-w-screen-xl mx-auto px-6 mb-16 space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--footer-muted)' }}>
            CHECK OUT TESTIMONIES
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--footer-fg)' }}>
            Hear what God is <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-gold)' }}>Doing</span>
          </h2>
          <p className="text-lg max-w-xl italic font-medium" style={{ color: 'var(--footer-muted)' }}>
            Hear what God is doing in the lives of our members.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto px-6 pb-12 no-scrollbar scroll-snap-x-mandatory snap-x">
          {testimonies.map((t) => (
            <div
              key={t.id}
              className="flex-none w-[320px] rounded-[2rem] p-8 space-y-6 snap-start transition-all group border"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <div className="aspect-video bg-black/20 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="w-12 h-12 text-white/20 group-hover:text-[var(--jkc-gold)] transition-all" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black leading-tight" style={{ color: 'var(--footer-fg)' }}>
                  {t.name}
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: 'var(--footer-muted)' }}>
                  {t.description}
                </p>
              </div>
              <a
                href={t.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase group-hover:translate-x-2 transition-transform"
                style={{ color: 'var(--jkc-gold)' }}
              >
                WATCH TESTIMONY →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Wave bottom — navy flows into white */}
      <div className="h-16 overflow-hidden" style={{ background: 'var(--footer-bg)' }}>
        <svg viewBox="0 0 1440 64" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </div>
  );
}
