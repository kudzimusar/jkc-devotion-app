
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Loader2 } from 'lucide-react';

type Testimony = {
  id: string;
  name: string;
  youtube_url: string;
  description: string;
};

export default function TestimoniesSection() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
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
    {/* Wave top — flows from cream into navy */}
    <div className="h-16 bg-[#fffdf7] overflow-hidden">
      <svg viewBox="0 0 1440 64" className="w-full h-full"
        preserveAspectRatio="none">
        <path 
          className="wave-navy"
          d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z"
          fill="#1b3a6b" 
        />
      </svg>
    </div>
    <section data-section="testimonies" className="py-32 overflow-hidden bg-black/5">
      <div className="max-w-screen-xl mx-auto px-6 mb-16 space-y-4">
        <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">
          CHECK OUT TESTIMONIES
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white/90">
          Hear what God is <span className="font-serif italic font-medium">Doing</span>
        </h2>
        <p className="text-white/40 text-lg max-w-xl italic font-medium">
          Hear what God is doing in the lives of our members.
        </p>
      </div>

      <div className="flex gap-6 overflow-x-auto px-6 pb-12 no-scrollbar scroll-snap-x-mandatory snap-x">
        {testimonies.map((t) => (
          <div 
            key={t.id}
            className="flex-none w-[320px] bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 snap-start hover:border-[var(--primary)]/30 transition-all group"
          >
            <div className="aspect-video bg-black/20 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Play className="w-12 h-12 text-white/20 group-hover:text-[var(--primary)] transition-all" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white leading-tight">
                {t.name}
              </h3>
              <p className="text-sm text-white/50 line-clamp-2">
                {t.description}
              </p>
            </div>
            <a 
              href={t.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-[var(--primary)] uppercase group-hover:translate-x-2 transition-transform"
            >
              WATCH TESTIMONY →
            </a>
          </div>
        ))}
      </div>
    </section>
    {/* Wave bottom — navy flows into gold */}
    <div className="h-16 bg-[#1b3a6b] overflow-hidden">
      <svg viewBox="0 0 1440 64" className="w-full h-full"
        preserveAspectRatio="none">
        <path 
          className="wave-gold"
          d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
          fill="#fde68a" 
        />
      </svg>
    </div>
  </div>
  );
}
