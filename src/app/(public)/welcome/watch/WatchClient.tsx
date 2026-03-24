'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Youtube, Search, LucideIcon, FileText, Download, PlayCircle, Star, BookOpen, User, Activity, Heart, Bookmark, Share2, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  transcript_text?: string;
  assets?: any[];
}

export default function WatchClient() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'salvation_decision' | 'prayer_request' | 'testimony' | 'membership_interest' | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
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
      const feat = data?.find((s: any) => s.is_featured);
      if (feat) setActiveSermon(feat);
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

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?sermon=${currentSermon?.id}` : '';
    navigator.clipboard.writeText(url);
    toast.success("Link copied! Share with your community.");
  };

  const toggleInteraction = async (type: 'like' | 'bookmark') => {
    if (!currentSermon) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Please sign in to interact.");
        return;
    }

    const { data: orgData } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgData?.[0]?.id;
    if (!orgId) return;

    if (type === 'like' ? isLiked : isBookmarked) {
        await supabase.from('sermon_interactions').delete().eq('sermon_id', currentSermon.id).eq('user_id', user.id).eq('type', type);
        type === 'like' ? setIsLiked(false) : setIsBookmarked(false);
    } else {
        await supabase.from('sermon_interactions').insert({
            org_id: orgId,
            sermon_id: currentSermon.id,
            user_id: user.id,
            type: type
        });
        type === 'like' ? setIsLiked(true) : setIsBookmarked(true);
        toast.success(type === 'like' ? "Message liked" : "Saved to library");
    }
  };

  const submitSpiritualResponse = async () => {
    if (!responseType || !currentSermon) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Please sign in to respond.");
        return;
    }

    setIsSubmittingResponse(true);
    const { data: orgData } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgData?.[0]?.id;

    const { error } = await supabase.from('spiritual_responses').insert({
        org_id: orgId,
        sermon_id: currentSermon.id,
        user_id: user.id,
        type: responseType,
        message: responseMessage
    });

    if (error) {
        toast.error("Failed to send response.");
    } else {
        toast.success("Your response has been received. Our leadership will follow up.");
        setShowResponseModal(false);
        setResponseMessage('');
        setResponseType(null);
    }
    setIsSubmittingResponse(false);
  };

  const featured = sermons.find(s => s.is_featured);
  const currentSermon = activeSermon || featured;

  // Sync interactions on sermon change
  useEffect(() => {
    const syncInts = async () => {
        if (!currentSermon) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('sermon_interactions').select('type').eq('sermon_id', currentSermon.id).eq('user_id', user.id);
        setIsLiked(data?.some(d => d.type === 'like') || false);
        setIsBookmarked(data?.some(d => d.type === 'bookmark') || false);
    };
    syncInts();
  }, [currentSermon]);

  // Watch Next Logic
  const upNextSermon = sermons
    .filter(s => s.id !== currentSermon?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const uniqueSeries = Array.from(new Set(sermons.map(s => s.series).filter(Boolean)));

  // Re-init player when activeSermon changes
  useEffect(() => {
    if (activeSermon && !loading && !liveStream) {
        const vidId = activeSermon.youtube_url.split('v=')[1] || activeSermon.youtube_url.split('/').pop();
        if (vidId) {
            // Give API time to load
            const sermonId = activeSermon.id;
            const check = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    initPlayer(vidId, sermonId);
                    clearInterval(check);
                }
            }, 500);
        }
    }
  }, [activeSermon, loading, liveStream]);
  const filteredSermons = sermons
    .filter(s => s.id !== currentSermon?.id)
    .filter(s => filter === 'all' || s.series === filter)
    .filter(s => 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      s.speaker.toLowerCase().includes(search.toLowerCase()) ||
      s.series.toLowerCase().includes(search.toLowerCase()) ||
      (s.transcript_text && s.transcript_text.toLowerCase().includes(search.toLowerCase()))
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
          sermons.length > 0 && currentSermon && (
            <section className="space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <span className="bg-primary/10 text-primary text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         NOW STREAMING
                    </span>
                    {currentSermon.series && (
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                            / SERIES / <span className="text-white/60">{currentSermon.series}</span>
                        </span>
                    )}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tight uppercase leading-tight mt-4">
                    {currentSermon.title}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => toggleInteraction('like')} 
                        className={`p-4 rounded-2xl hover:bg-white/10 transition-all border ${isLiked ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'} group`}
                     >
                        <Heart size={24} className={`${isLiked ? 'text-red-500 scale-110' : 'text-white/40 group-hover:text-red-500'} transition-all`} fill={isLiked ? 'currentColor' : 'none'} />
                     </button>
                     <button 
                        onClick={() => toggleInteraction('bookmark')} 
                        className={`p-4 rounded-2xl hover:bg-white/10 transition-all border ${isBookmarked ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'} group`}
                     >
                        <Bookmark size={24} className={`${isBookmarked ? 'text-primary scale-110' : 'text-white/40 group-hover:text-primary'} transition-all`} fill={isBookmarked ? 'currentColor' : 'none'} />
                     </button>
                     <button onClick={handleShare} className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
                        <Share2 size={24} className="text-white/40 group-hover:text-primary transition-colors" />
                     </button>
                </div>
              </div>

              <div className="flex justify-center md:justify-start">
                    <button 
                        onClick={() => setShowResponseModal(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-[2rem] text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] flex items-center gap-3 group"
                    >
                        <Star size={16} className="group-hover:rotate-45 transition-transform" />
                        Respond to the Word
                    </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
                  <div className="aspect-video w-full bg-black relative" id="featured-player">
                    {/* YouTube Player will be injected here */}
                  </div>
                </div>

                {/* Watch Next Sidebar */}
                {upNextSermon && (
                    <div className="hidden lg:flex flex-col gap-6">
                        <h3 className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">Up Next</h3>
                        <div 
                            onClick={() => {
                                setActiveSermon(upNextSermon);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="glass group cursor-pointer rounded-[2rem] border border-white/5 p-6 hover:border-primary/30 transition-all space-y-4"
                        >
                            <div className="aspect-video w-full bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                <Activity size={80} className="text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <PlayCircle size={40} className="text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-primary uppercase tracking-widest">{format(new Date(upNextSermon.date), 'MMM dd, yyyy')}</p>
                                <h4 className="text-sm font-black text-white/90 leading-tight uppercase line-clamp-2">{upNextSermon.title}</h4>
                                <p className="text-[9px] font-medium text-white/30 uppercase italic">{upNextSermon.speaker}</p>
                            </div>
                        </div>
                    </div>
                )}
              </div>

              {/* Media Assets Actions */}
              {currentSermon?.assets && currentSermon.assets.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {currentSermon.assets.map((asset: any) => (
                    <button 
                      key={asset.id} 
                      onClick={() => asset.type === 'transcript' ? setShowTranscript(!showTranscript) : window.open(asset.url, '_blank')}
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
              {showTranscript && currentSermon.assets?.some(a => (a.type === 'transcript' || a.type === 'notes') && a.status === 'active') && (
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
                        {currentSermon.transcript_text || (currentSermon.assets.find(a => a.type === 'transcript')?.metadata as any)?.full_text}
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                       <div className="space-y-4">
                        <h3 className="text-xs font-black tracking-widest uppercase text-primary">Summary</h3>
                        <p className="text-sm font-medium leading-relaxed italic text-white/80">
                           {(currentSermon.assets.find(a => a.type === 'notes')?.metadata as any)?.summary}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-xs font-black tracking-widest uppercase text-primary">Key Points</h3>
                        <div className="space-y-2">
                          {(currentSermon.assets.find(a => a.type === 'notes')?.metadata as any)?.key_points?.map((point: string, idx: number) => (
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
        {/* RELATED CONTENT / WATCH NEXT RAIL */}
        {currentSermon && !liveStream && (         <section className="space-y-8 py-12 border-y border-white/5">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black tracking-[0.3em] text-white/40 uppercase">Recommended For You</h3>
                 {currentSermon.series && <span className="text-[10px] font-black text-primary uppercase">MORE FROM {currentSermon.series}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {sermons
                  .filter(s => s.id !== currentSermon.id)
                  .sort((a, b) => {
                    // Prioritize same series
                    if (a.series === currentSermon.series && b.series !== currentSermon.series) return -1;
                    if (a.series !== currentSermon.series && b.series === currentSermon.series) return 1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                  })
                  .slice(0, 4)
                  .map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => {
                        setActiveSermon(s);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex flex-col gap-4 text-left transition-all hover:-translate-y-1"
                    >
                      <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PlayCircle className="text-white" size={32} />
                         </div>
                         <img 
                           src={`https://img.youtube.com/vi/${s.youtube_url.split('v=')[1] || s.youtube_url.split('/').pop()}/mqdefault.jpg`} 
                           alt={s.title}
                           className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                         />
                      </div>
                      <div>
                         <p className="text-[8px] font-black tracking-widest text-primary uppercase mb-1">{s.series || 'Series'}</p>
                         <h4 className="text-xs font-black text-white/80 group-hover:text-primary transition-colors line-clamp-2">{s.title}</h4>
                      </div>
                    </div>
                  ))}
              </div>
           </section>
        )}

        {/* Global Footer Components */}
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
                <div className="pt-8">
                  <button 
                    onClick={() => {
                      setActiveSermon(s);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[10px] font-black tracking-widest text-white/30 group-hover:text-white transition-colors flex items-center gap-2"
                  >
                    WATCH SERMON <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <TestimoniesSection />
      </div>

      {/* Spiritual Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-card glass border border-white/10 w-full max-w-xl rounded-[3rem] shadow-2xl p-10 relative">
                <button onClick={() => {setShowResponseModal(false); setResponseType(null); setResponseMessage('');}} className="absolute top-8 right-8 text-white/40 hover:text-white">
                    <X size={24} />
                </button>
                
                <div className="text-center mb-10 space-y-2">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Respond to the Word</h3>
                    <p className="text-xs font-black tracking-widest text-primary uppercase">Your spiritual journey matters to us.</p>
                </div>

                {!responseType ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'salvation_decision', label: 'I GAVE MY LIFE TO CHRIST', icon: Star },
                            { id: 'prayer_request', label: 'I NEED PRAYER', icon: Activity },
                            { id: 'testimony', label: 'I HAVE A TESTIMONY', icon: FileText },
                            { id: 'membership_interest', label: 'I WANT TO JOIN THIS CHURCH', icon: User }
                        ].map((btn) => (
                            <button 
                                key={btn.id}
                                onClick={() => setResponseType(btn.id as any)}
                                className="glass hover:bg-white/10 border border-white/5 p-6 rounded-2xl flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <btn.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest text-white/60 group-hover:text-white uppercase">{btn.label}</span>
                                </div>
                                <ArrowRight size={16} className="text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-3">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">SELECTED: {responseType?.replace(/_/g, ' ')}</span>
                            <button onClick={() => setResponseType(null)} className="ml-auto text-[9px] font-black text-white/20 hover:text-white uppercase">Change</button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 tracking-widest uppercase">Add a message (Optional)</label>
                            <textarea 
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white focus:border-primary outline-none transition-all placeholder:text-white/10"
                            />
                        </div>
                        <button 
                            onClick={submitSpiritualResponse}
                            disabled={isSubmittingResponse}
                            className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmittingResponse ? 'SENDING...' : 'CONFIRM RESPONSE'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
