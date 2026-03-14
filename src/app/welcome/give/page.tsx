'use client';

export default function GivePage() {
  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500 blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SUPPORTING THE MISSION</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Give</span> Online
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Give</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        {/* Why We Give */}
        <section className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">WORSHIP THROUGH GIVING</p>
              <h2 className="text-4xl md:text-6xl font-black italic font-serif">Why we give</h2>
            </div>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed font-bold">
              <p>
                Giving is an act of worship. At Japan Kingdom Church, your generosity
                directly supports our mission to reach the lost, care for the homeless,
                and build disciples for Christ in Japan.
              </p>
              <p className="font-medium text-white/50">
                Every gift — no matter the size — makes a real difference in our
                community. Thank you for partnering with us to build a strong Christian
                community that represents Christ to society.
              </p>
            </div>
          </div>
          <div className="glass rounded-[4rem] p-16 md:p-20 border border-white/5 bg-white/5 flex items-center justify-center text-center">
             <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-3xl mx-auto border border-primary/20 mb-6">¥</div>
                <h3 className="text-2xl font-black italic font-serif leading-tight text-white/90">God Loves a <br/>Cheerful Giver</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">2 CORINTHIANS 9:7</p>
             </div>
          </div>
        </section>

        {/* Ways to Give */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-8 border-l-[var(--primary)] space-y-8 bg-white/5 group hover:bg-white/10 transition-colors">
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.3em] text-[var(--primary)] uppercase">OPTION 01</p>
              <h3 className="text-4xl font-black italic font-serif">Give Online</h3>
              <p className="text-white/60 leading-relaxed font-medium italic">
                Securely give online via our giving platform. Simple and fast.
              </p>
            </div>
            <button className="bg-[var(--primary)] text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center">
               GIVE ONLINE →
            </button>
          </div>

          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-8 border-l-white/30 space-y-8 bg-white/5 group hover:bg-white/10 transition-colors">
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">OPTION 02</p>
              <h3 className="text-4xl font-black italic font-serif">Give In Person</h3>
              <p className="text-white/60 leading-relaxed font-medium italic">
                Bring your offering on Sundays during the morning service. Offering envelopes are available at the entrance.
              </p>
            </div>
            <div className="flex items-center gap-4 text-white/40 text-[10px] font-black tracking-[0.2em] border-t border-white/5 pt-8">
               <span className="w-2 h-2 rounded-full bg-white/20" />
               SUNDAY SERVICES @ 10:30AM
            </div>
          </div>
        </section>

        {/* Tithing Scripture */}
        <section className="py-24 text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-10">
            <p className="text-3xl md:text-5xl font-serif italic font-medium text-white/70 leading-tight">
              "Bring the whole tithe into the storehouse, that there may be food in my house."
            </p>
            <div className="space-y-2">
               <div className="h-px w-20 bg-[var(--primary)]/30 mx-auto mb-6" />
               <p className="text-xs font-black tracking-[0.5em] text-[var(--primary)] uppercase">Malachi 3:10</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
