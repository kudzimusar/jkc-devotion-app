'use client';

import ServiceSchedule from '@/components/public/ServiceSchedule';
import DirectionsSection from '@/components/public/DirectionsSection';

export default function VisitPage() {
  const expectations = [
    {
      title: "WHEN YOU ARRIVE",
      desc: "Our welcome team will greet you at the entrance. Service begins at 10:30AM — we recommend arriving by 10:15AM."
    },
    {
      title: "WHAT TO WEAR",
      desc: "Come as you are. There is no dress code at JKC. We want you to be comfortable and focus on worship."
    },
    {
      title: "CHILDREN",
      desc: "We have Junior Church available during the morning service for children. Parents check in kids at arrival."
    }
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500 blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">WE'D LOVE TO HAVE YOU</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Plan Your</span> Visit
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Visit</span>
          </nav>
        </div>
      </section>

      <div className="space-y-32">
        {/* Service Times (Reused Component) */}
        <section className="bg-white/5 border-y border-white/5">
          <ServiceSchedule />
        </section>

        {/* Directions (Reused Component) */}
        <div className="max-w-screen-xl mx-auto">
          <DirectionsSection />
        </div>

        {/* What to Expect */}
        <section className="py-24 px-6 max-w-screen-xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">VISITOR GUIDE</p>
            <h2 className="text-4xl md:text-5xl font-black italic font-serif">What to expect</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {expectations.map((item, idx) => (
              <div 
                key={idx} 
                className="glass rounded-[3rem] p-12 border border-white/10 space-y-6 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-black text-xs border border-[var(--primary)]/20">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest">{item.title}</h3>
                <p className="text-white/60 leading-relaxed font-bold italic text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plan My Visit CTA */}
        <section className="py-32 px-6 text-center space-y-12 bg-black/40 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-[var(--primary)]/20 via-transparent to-blue-500/20 blur-[100px]" />
          </div>
          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl md:text-7xl font-black italic font-serif max-w-3xl mx-auto">Ready to join us this Sunday?</h2>
            <a 
              href="https://calendly.com/visitjkc/service" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[var(--primary)] text-white font-black px-16 py-7 rounded-full text-sm tracking-[0.3em] hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary/40 uppercase"
            >
              PLAN MY VISIT →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
