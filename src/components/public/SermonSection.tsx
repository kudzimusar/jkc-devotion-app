'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Calendar, Tag, Users } from 'lucide-react';
import { useChurch } from '@/lib/church-context';

export default function SermonSection() {
  const [sermon, setSermon] = useState<any>(null);
  const { org, isLoading: orgLoading } = useChurch();

  useEffect(() => {
    const fetchSermon = async () => {
      if (orgLoading || !org?.id) return;

      const { data } = await supabase
        .from('public_sermons')
        .select('*')
        .eq('org_id', org.id)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setSermon(data);
    };
    fetchSermon();
  }, [org?.id, orgLoading]);

  if (!sermon) return null;

  const title    = sermon.title;
  const speaker  = sermon.speaker || "Guest Speaker";
  const watchUrl = sermon.youtube_url;
  const dateStr  = sermon.date ? format(new Date(sermon.date), 'MMMM dd, yyyy') : '';
  const series   = sermon.series;

  return (
    <section id="watch" data-section="sermon" className="py-32 px-6 scroll-mt-20"
             style={{ background: 'var(--background)' }}>
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Left — YouTube embed in a premium frame */}
        <div className="relative group">
          {/* Glow ring visible in dark mode, tasteful shadow in light */}
          <div className="relative aspect-video rounded-2xl overflow-hidden"
               style={{
                 boxShadow: 'var(--shadow-xl)',
                 border: '1px solid var(--border)',
               }}>
            <iframe
              src={`${watchUrl.replace('/watch?v=', '/embed/')}?autoplay=1&mute=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allowFullScreen
              title="Latest Sermon"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right — Text content */}
        <div className="space-y-8">
          {/* Gold top rule — accent strip that Elevation uses */}
          <div className="w-12 h-1 rounded-full" style={{ background: 'var(--jkc-gold)' }} />

          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--jkc-gold)' }}>
              LATEST SERMON
            </p>
            <h2 className="text-4xl md:text-6xl font-sans font-black leading-[0.9] tracking-tighter uppercase"
                 style={{ color: 'var(--foreground)' }}>
              <span className="font-serif italic font-medium normal-case text-muted-foreground mr-4">Theme:</span>
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Calendar size={12} className="text-primary" /> {dateStr}
                  </span>
                </div>
                {series && (
                    <div className="flex flex-col border-l border-border pl-6">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Tag size={12} className="text-primary" /> {series}
                      </span>
                    </div>
                )}
            </div>
          </div>

          <div className="rounded-3xl p-8 inline-block relative overflow-hidden group/speaker"
               style={{ background: 'var(--section-alt)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/speaker:opacity-10 transition-opacity">
                <Users size={80} />
            </div>
            <p className="text-[10px] font-black tracking-widest uppercase m-0 text-primary">
              MINISTERING
            </p>
            <p className="text-2xl md:text-3xl font-black mt-2 m-0 uppercase italic tracking-tighter" style={{ color: 'var(--jkc-navy)' }}>
              {speaker}
            </p>
          </div>

          <p className="text-lg leading-relaxed max-w-md font-medium italic opacity-60"
             style={{ color: 'var(--muted-foreground)' }}>
            Watch our latest message and discover how we are growing together in faith and purpose.
          </p>

          <div className="pt-6">
            <a
              href="/welcome/watch"
              className="bg-[var(--jkc-navy)] text-white hover:bg-black inline-flex items-center gap-4 rounded-[2rem] px-12 py-5 text-xs font-black tracking-[0.3em] uppercase transition-all shadow-[0_20px_50px_rgba(var(--jkc-navy-rgb),0.2)] hover:scale-[1.02]"
            >
              BROWSE SERMON LIBRARY →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
