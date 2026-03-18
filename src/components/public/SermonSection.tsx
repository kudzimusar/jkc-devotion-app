import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePublicTheme } from './PublicThemeWrapper';

export default function SermonSection() {
  const { isDark } = usePublicTheme();
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

  const title = sermon?.title || "A Genuine Believer";
  const speaker = sermon?.speaker || "Elder Sanna Patterson";
  const watchUrl = sermon?.youtube_url || "https://www.youtube.com/@JapanKingdomChurch/streams";

  return (
    <section id="watch" data-section="sermon" className="py-32 px-6 scroll-mt-20"
             style={{ background: 'var(--section-alt)' }}>
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Left column — YouTube embed */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity" />
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-white/10">
            <iframe
              src="https://www.youtube.com/embed?listType=user_uploads&list=japankingdomchurch"
              className="w-full h-full"
              allowFullScreen
              title="Latest Sermon"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--jkc-navy)' }}>
              LATEST SERMON
            </p>
            <h2 className="text-4xl md:text-6xl font-serif italic font-black leading-tight"
                style={{ color: 'var(--foreground)' }}>
              {title}
            </h2>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black tracking-widest uppercase"
               style={{ color: 'var(--muted-foreground)' }}>
              SPEAKER
            </p>
            <p className="text-2xl font-black"
               style={{ color: 'var(--jkc-gold)' }}>
              {speaker}
            </p>
          </div>

          <p className="text-base leading-relaxed max-w-md"
             style={{ color: 'var(--muted-foreground)' }}>
            Watch our latest message and discover how we are growing together in faith and purpose.
          </p>

          <div className="pt-4">
            <a 
              href={watchUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 rounded-full px-10 py-5 text-xs font-black tracking-[0.2em] transition-all"
              style={{ 
                background: 'var(--jkc-navy)',
                color: 'var(--primary-foreground)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              WATCH MORE ON YOUTUBE →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
