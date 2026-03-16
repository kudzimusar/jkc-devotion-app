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

  const title = sermon?.title || "A Genuine Believer";
  const speaker = sermon?.speaker || "Elder Sanna Patterson";
  const watchUrl = sermon?.youtube_url || "https://www.youtube.com/@JapanKingdomChurch/streams";

  return (
    <section id="watch" data-section="sermon" className="py-32 px-6 scroll-mt-20">
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
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">
              LATEST SERMON
            </p>
            <h2 className="text-4xl md:text-6xl font-serif italic font-black text-white/90 leading-tight">
              {title}
            </h2>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black tracking-widest text-white/30 uppercase">
              SPEAKER
            </p>
            <p className="text-2xl font-black text-white/80">
              {speaker}
            </p>
          </div>

          <p className="text-white/50 text-base leading-relaxed max-w-md">
            Watch our latest message and discover how we are growing together in faith and purpose.
          </p>

          <div className="pt-4">
            <a 
              href={watchUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 border border-white/20 rounded-full px-10 py-5 text-xs font-black tracking-[0.2em] text-white hover:bg-white/5 hover:border-white/40 transition-all active:scale-95"
            >
              WATCH MORE ON YOUTUBE →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
