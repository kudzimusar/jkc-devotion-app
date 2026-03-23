'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Youtube, Search, LucideIcon, FileText, Download, PlayCircle, Star, BookOpen, User } from 'lucide-react';
import TestimoniesSection from '@/components/public/TestimoniesSection';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface Sermon {
  id: string;
  created_at: string;
  org_id: string;
  title: string;
  date: string;
  is_featured: boolean;
  status: string;
  series: string;
  speaker: string;
  youtube_url: string;
  scripture: string;
  assets?: any[];
}

export default function WatchClient() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const playerRef = useRef<any>(null);
  const watchTimerRef = useRef<any>(null);

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const fetchSermons = async () => {
      const { data: orgData } = await supabase.from('organizations').select('id').limit(1);
      const orgId = orgData?.[0]?.id;
      if (!orgId) return;

      const { data } = await supabase
        .from('public_sermons')
        .select('*, assets:media_assets(*)')
        .eq('org_id', orgId)
        .eq('status', 'published')
        .order('date', { ascending: false });

      setSermons(data || []);
      setLoading(false);
    };

    const checkLive = async () => {
      const { data: orgData } = await supabase.from('organizations').select('id').limit(1);
      const orgId = orgData?.[0]?.id;
      if (!orgId) return;

      const { data } = await supabase
        .from('live_streams')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'live')
        .maybeSingle();

      setLiveStream(data);
    };

    fetchSermons();
    checkLive();
    const interval = setInterval(checkLive, 30000);
    return () => {
        clearInterval(interval);
        if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, []);

  const initPlayer = (videoId: string, sermonId: string) => {
    if (!window.YT || !window.YT.Player) return;

    if (playerRef.current) {
        playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player('featured-player', {
      videoId: videoId,
      events: {
        'onStateChange': (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            trackEvent(sermonId, 'play');
            startWatchTimer(sermonId);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            trackEvent(sermonId, 'pause');
            stopWatchTimer();
          } else if (event.data === window.YT.PlayerState.ENDED) {
            trackEvent(sermonId, 'complete');
            stopWatchTimer();
          }
        }
      }
    });
  };

  const startWatchTimer = (sermonId: string) => {
    stopWatchTimer();
    watchTimerRef.current = setInterval(() => {
      // Periodic ping for retention
      trackEvent(sermonId, 'retention', 30);
    }, 30000);
  };

  const stopWatchTimer = () => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const trackEvent = async (sermonId: string, event: string, watchTime: number = 0) => {
    // Phase 4.1: Track event
    const { data: orgData } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgData?.[0]?.id;
    if (!orgId) return;

    await supabase.from('member_analytics').insert({
      org_id: orgId,
      sermon_id: sermonId,
      event_type: event,
      watch_time: watchTime,
      device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
    });
  };

  const featured = sermons.find(s => s.is_featured);
  const uniqueSeries = Array.from(new Set(sermons.map(s => s.series).filter(Boolean)));

  // Re-init player when featured changes
  useEffect(() => {
    if (featured && !loading && !liveStream) {
        const vidId = featured.youtube_url.split('v=')[1] || featured.youtube_url.split('/').pop();
        if (vidId) {
            // Give API time to load
            const check = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    initPlayer(vidId, featured.id);
                    clearInterval(check);
                }
            }, 500);
        }
    }
  }, [featured, loading, liveStream]);
  const filteredSermons = sermons
    .filter(s => s.id !== featured?.id)
    .filter(s => filter === 'all' || s.series === filter)
    .filter(s => 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      s.speaker.toLowerCase().includes(search.toLowerCase()) ||
      s.series.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="pt-16 min-h-screen">
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
        {/* Live Stream / Latest Featured Sermon */}
        {liveStream ? (
           <section className="space-y-12 animate-in fade-in zoom-in duration-700">
             <div className="space-y-4 text-center">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                 </span>
                 <span className="text-[10px] font-black tracking-[0.4em] text-red-500 uppercase">HAPPENING NOW</span>
               </div>
               <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                 JOIN US LIVE
               </h2>
             </div>
             
             <div className="glass rounded-[3rem] border border-red-500/20 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
               <div className="aspect-video w-full bg-black relative">
                 <iframe
                   className="absolute inset-0 w-full h-full"
                   src={`${liveStream.stream_url}?autoplay=1`}
                   title="Live Stream"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 ></iframe>
               </div>
             </div>
           </section>
        ) : (
          sermons.length > 0 && featured && (
            <section className="space-y-12">
              <div className="space-y-4 text-center">
                <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
                  LATEST SERMON
                </h2>
              </div>
              
              <div className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="aspect-video w-full bg-black relative" id="featured-player">
                  {/* YouTube Player will be injected here */}
                </div>
              </div>

              {/* Media Assets Actions */}
              {featured.assets && featured.assets.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {featured.assets.map((asset: any) => (
                    <button 
                      key={asset.id} 
                      onClick={() => (asset.type === 'transcript' || asset.type === 'notes') ? setShowTranscript(!showTranscript) : window.open(asset.url, '_blank')}
                      className={`
                        px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2
                        ${asset.status === 'active' ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-white/2 border-dashed border-white/5 text-white/10 cursor-not-allowed'}
                      `}
                    >
                      {asset.type === 'audio' && <Download size={14} />}
                      {asset.type === 'transcript' && <FileText size={14} />}
                      {asset.type === 'notes' && <BookOpen size={14} />}
                      {asset.type} {asset.status !== 'active' && '(PROCESSING...)'}
                    </button>
                  ))}
                </div>
              )}

              {/* AI Intelligence Panel */}
              {showTranscript && featured.assets?.some(a => (a.type === 'transcript' || a.type === 'notes') && a.status === 'active') && (
                <div className="glass rounded-[2rem] border border-white/10 p-8 md:p-12 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] scale-150 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Activity size={320} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-6">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <FileText className="text-primary" /> Full Transcript
                      </h3>
                      <div className="max-h-[400px] overflow-y-auto pr-6 font-medium leading-relaxed text-white/60 text-sm space-y-8 font-serif">
                        {(featured.assets.find(a => a.type === 'transcript')?.metadata as any)?.full_text}
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                       <div className="space-y-4">
                        <h3 className="text-xs font-black tracking-widest uppercase text-primary">Summary</h3>
                        <p className="text-sm font-medium leading-relaxed italic text-white/80">
                           {(featured.assets.find(a => a.type === 'notes')?.metadata as any)?.summary}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-xs font-black tracking-widest uppercase text-primary">Key Points</h3>
                        <div className="space-y-2">
                          {(featured.assets.find(a => a.type === 'notes')?.metadata as any)?.key_points?.map((point: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 group/item">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <span className="text-[11px] font-black uppercase text-white/40 group-hover/item:text-primary transition-colors">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )
        )}

        <section className="space-y-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
               <h2 className="text-4xl font-black">All <span className="font-serif italic font-medium text-white/60">Services</span></h2>
               <p className="text-white/40 font-medium">Browse our full library of messages.</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-12 border-t border-white/5">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.85]">
                <span className="block text-primary">Preaching</span>
                <span className="block">& Services</span>
              </h2>
              
              {/* Series Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  ALL
                </button>
                {uniqueSeries.map(s => (
                  <button
                    key={s as string}
                    onClick={() => setFilter(s as string)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${filter === s ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {(s as string).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="SEARCH SERMONS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>
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
