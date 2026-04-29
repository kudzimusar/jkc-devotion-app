'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useChurch } from '@/lib/church-context';
import { Loader2 } from 'lucide-react';

export default function TestimoniesSection() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const { org, slug, isLoading: orgLoading } = useChurch();
  const isJKC = !slug || slug === 'jkc';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonies() {
      if (orgLoading) return;
      if (!org?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('public_testimonies')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false });

        if (data) setTestimonies(data);
      } catch (err) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonies();
  }, [org?.id, orgLoading]);

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

        <div className="flex gap-8 overflow-x-auto px-6 pb-12 no-scrollbar scroll-snap-x-mandatory snap-x">
          {testimonies.map((t) => (
            <div
              key={t.id}
              className="flex-none w-[380px] rounded-[2rem] p-6 space-y-6 snap-start transition-all group border flex flex-col justify-between"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <div className="space-y-6">
                <div className="aspect-video bg-black rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
                  <iframe
                    src={t.youtube_url?.replace('watch?v=', 'embed/')}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={t.name}
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black leading-tight line-clamp-2" style={{ color: 'var(--card-foreground)' }}>
                    {t.name}
                  </h3>
                  <p className="text-sm line-clamp-3" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                    {t.description}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <a
                  href={t.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:gap-3"
                  style={{ color: 'var(--jkc-gold)' }}
                >
                  WATCH ON YOUTUBE →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* WATCH MORE button — JKC only (other orgs don't have a YouTube channel configured) */}
        {isJKC && (
          <div className="max-w-screen-xl mx-auto px-6 pb-16 flex justify-center">
            <a
              href="https://www.youtube.com/@JapanKingdomChurch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-12 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--jkc-navy)',
                color: 'white',
                boxShadow: '0 8px 32px rgba(27,58,107,0.4)'
              }}
            >
              WATCH MORE →
            </a>
          </div>
        )}
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
