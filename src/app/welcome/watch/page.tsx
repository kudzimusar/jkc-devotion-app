'use client';

export default function WatchPage() {
  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SERMONS · TESTIMONIES · LIVE STREAM</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Watch</span> Live
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Watch</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        {/* Latest Sermon */}
        <section className="space-y-12">
          <div className="space-y-4 text-center">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">LATEST SERMON</p>
            <h2 className="text-4xl md:text-5xl font-black italic font-serif">"A Genuine Believer"</h2>
          </div>
          
          <div className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="aspect-video w-full">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed?listType=user_uploads&list=japankingdomchurch" 
                title="YouTube Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5">
              <div className="space-y-2">
                <p className="text-[10px] font-black tracking-[0.5em] text-[var(--primary)] uppercase">SPEAKER</p>
                <h3 className="text-3xl font-black">Elder Sanna Patterson</h3>
              </div>
              <a 
                href="https://www.youtube.com/@JapanKingdomChurch/streams" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black font-black px-12 py-5 rounded-full text-xs tracking-[0.3em] hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap"
              >
                WATCH MORE SERMONS →
              </a>
            </div>
          </div>
        </section>

        {/* Testimonies */}
        <section className="relative rounded-[4rem] overflow-hidden bg-white/5 border border-white/5 p-16 md:p-32 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 blur-[100px] rounded-full" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">TRANSFORMED LIVES</p>
              <h2 className="text-4xl md:text-5xl font-black italic font-serif uppercase tracking-tight">Check Out <br className="hidden md:block"/> Testimonies</h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto italic font-medium pt-4">Hear what God is doing in the lives of our members across Japan.</p>
            </div>
            <a 
              href="https://youtube.com/playlist?list=PLrToBpeUhvIaxvLawq93QKwEzzIi-Oq0P" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-white/20 text-white font-black px-12 py-5 rounded-full text-xs tracking-[0.3em] hover:bg-white/5 hover:border-white/40 active:scale-95 transition-all"
            >
              WATCH TESTIMONIES →
            </a>
          </div>
        </section>

        {/* Watch Live CTA */}
        <section className="space-y-12 text-center pb-12">
           <div className="inline-flex glass-card rounded-full px-10 py-5 text-sm font-black tracking-[0.3em] text-[var(--primary)] border border-[var(--primary)]/20 shadow-2xl shadow-primary/10">
              SUNDAYS @ 10:30AM JST
           </div>
           <h2 className="text-4xl md:text-6xl font-black italic font-serif max-w-2xl mx-auto">Join us live every Sunday morning</h2>
           <a 
             href="http://youtube.com/japankingdomchurch" 
             target="_blank"
             rel="noopener noreferrer"
             className="inline-block bg-[var(--primary)] text-white font-black px-16 py-6 rounded-full text-xs tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20"
           >
             WATCH LIVE ON YOUTUBE →
           </a>
        </section>
      </div>
    </div>
  );
}
