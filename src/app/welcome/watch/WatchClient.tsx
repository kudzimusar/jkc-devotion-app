
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TestimoniesSection from '@/components/public/TestimoniesSection';

export default function WatchClient() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('public_sermons')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        setSermons(data || []);
        setLoading(false);
      });
  }, []);

  const uniqueSeries = Array.from(new Set(sermons.map(s => s.series).filter(Boolean)));
  const filteredSermons = filter === 'all' ? sermons : sermons.filter(s => s.series === filter);

  return (
    <div className="pt-16 min-h-screen bg-[oklch(0.08_0.04_255)] text-white">
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SERMONS · TESTIMONIES · LIVE STREAM</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Watch</span> Library
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Watch</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        {/* Latest Featured Sermon (Big) */}
        {sermons.length > 0 && sermons.some(s => s.featured) && (
          <section className="space-y-12">
            {(() => {
              const featured = sermons.find(s => s.featured);
              const embedUrl = featured?.youtube_url?.includes('watch?v=') 
                ? featured.youtube_url.replace('watch?v=', 'embed/')
                : featured?.youtube_url;
              
              return (
                <>
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">FEATURED SERMON</p>
                    <h2 className="text-4xl md:text-5xl font-black italic font-serif">"{featured?.title}"</h2>
                  </div>
                  
                  <div className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                    <div className="aspect-video w-full bg-black">
                      <iframe 
                        className="w-full h-full"
                        src={embedUrl} 
                        title="Featured Sermon"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        <section className="space-y-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
               <h2 className="text-4xl font-black">All <span className="font-serif italic font-medium text-white/60">Services</span></h2>
               <p className="text-white/40 font-medium">Browse our full library of messages.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setFilter('all')} className={`px-8 py-3 rounded-full text-[10px] font-black tracking-widest transition-all ${filter === 'all' ? 'bg-[var(--primary)] text-white' : 'border border-white/10 text-white/40 hover:bg-white/5'}`}>ALL</button>
              {uniqueSeries.map(s => (
                <button key={s as string} onClick={() => setFilter(s as string)} className={`px-8 py-3 rounded-full text-[10px] font-black tracking-widest transition-all ${filter === s ? 'bg-[var(--primary)] text-white' : 'border border-white/10 text-white/40 hover:bg-white/5'}`}>{(s as string).toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSermons.map((s) => (
              <div key={s.id} className="group glass rounded-[2rem] p-8 border border-white/10 hover:border-[var(--primary)]/30 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p 
                      suppressHydrationWarning
                      className="text-[10px] tracking-[0.3em] font-black text-[var(--primary)] opacity-60 uppercase"
                    >
                      {new Date(s.date).toLocaleDateString()}
                    </p>
                    {s.series && <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase">{s.series}</span>}
                  </div>
                  <h3 className="text-xl font-black leading-snug group-hover:text-[var(--primary)] transition-colors">{s.title}</h3>
                  <p className="text-sm text-white/40 font-medium italic">{s.speaker}</p>
                </div>
                <div className="pt-8"><a href={s.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black tracking-widest text-white/30 group-hover:text-white transition-colors flex items-center gap-2">WATCH SERMON <span className="group-hover:translate-x-1 transition-transform">→</span></a></div>
              </div>
            ))}
          </div>
        </section>
        <TestimoniesSection />
      </div>
    </div>
  );
}
