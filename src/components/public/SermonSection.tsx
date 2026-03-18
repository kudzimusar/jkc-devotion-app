import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SermonSection() {
  const [sermon, setSermon] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('public_sermons')
      .select('*')
      .eq('featured', true)
      .order('date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSermon(data);
      });
  }, []);

  const title    = sermon?.title    || "LET'S TUNE IN! / チューニングを合わせよう";
  const speaker  = sermon?.speaker  || "Yutaka Nakamura";
  const watchUrl = sermon?.youtube_url || "https://www.youtube.com/watch?v=l3aOmvsaLRU";

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
            <h2 className="text-4xl md:text-5xl font-serif italic font-black leading-tight"
                style={{ color: 'var(--foreground)' }}>
              {title}
            </h2>
          </div>

          <div className="rounded-xl px-5 py-4 inline-block"
               style={{ background: 'var(--section-alt)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase m-0"
               style={{ color: 'var(--muted-foreground)' }}>
              SPEAKER
            </p>
            <p className="text-xl font-black mt-1 m-0" style={{ color: 'var(--jkc-navy)' }}>
              {speaker}
            </p>
          </div>

          <p className="text-base leading-relaxed max-w-md"
             style={{ color: 'var(--muted-foreground)' }}>
            Watch our latest message and discover how we are growing together in faith and purpose.
          </p>

          <div className="pt-2">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-navy inline-flex items-center gap-3 rounded-full px-10 py-5 text-xs font-black tracking-[0.2em] uppercase"
            >
              WATCH MORE ON YOUTUBE →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
