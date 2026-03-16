'use client';

import { MapPin, Train, Car, ArrowRight } from 'lucide-react';

export default function DirectionsSection() {
  const directions = [
    {
      icon: <Train className="w-5 h-5" />,
      title: "By Train",
      desc: "2 min walk from Akishima Station (West Gate exit)"
    },
    {
      icon: <Car className="w-5 h-5" />,
      title: "By Car",
      desc: "Free parking directly beside the church (<1 min walk)"
    }
  ];

  return (
    <section data-section="directions" className="py-32 px-6 max-w-screen-xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 items-stretch">
        {/* Left — Google Maps embed */}
        <div className="rounded-[3rem] overflow-hidden aspect-video md:aspect-auto h-full min-h-[400px] border border-white/10 shadow-2xl relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.567!2d139.3539!3d35.7059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6019144e82b3e6d1%3A0x1!2z5p2x5Lqs6YO95Lit5aSu5biC5YGL5Yqb5YS_77yS5LiB55uu77yR4oiS77yW!5e0!3m2!1sja!2sjp!4v1"
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Japan Kingdom Church Location"
          />
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[3rem]" />
        </div>

        {/* Right — Info */}
        <div className="flex flex-col justify-center space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">
              DIRECTIONS & PARKING
            </p>
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-white/90">Find Your Way</h2>
              <div className="flex items-start gap-4 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                  <MapPin className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white/90">〒196-0015 東京都昭島市昭和町2-1-6</p>
                  <p className="text-white/60">TE Building, 3rd Floor, Akishima-shi, Tokyo</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {directions.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-center group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[var(--primary)]/40 transition-colors">
                  <div className="text-white/40 group-hover:text-[var(--primary)] transition-colors">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest text-white/30 uppercase mb-1">{item.title}</h4>
                  <p className="text-white/70 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <a 
              href="https://goo.gl/maps/7qJWeT4riicqcBrj9" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 border border-white/20 rounded-full px-10 py-5 text-sm font-black tracking-[0.2em] text-white hover:bg-white/5 hover:border-white/40 active:scale-95 transition-all w-full md:w-auto justify-center md:justify-start"
            >
              GET DIRECTIONS <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
