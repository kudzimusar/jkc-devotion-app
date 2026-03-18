
'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutClient() {
  const beliefs = [
    "The Trinity: Father, Son, and Holy Spirit",
    "Jesus is God manifest in the flesh",
    "Jesus is the only way to the Father",
    "The Word of God is infallible and living",
    "Sin separates us from God and requires repentance",
    "Salvation is by faith in Christ through grace",
    "Baptism demonstrates our association with the death and resurrection of Christ",
    "All gifts of the Spirit (e.g., healing, speaking in tongues)",
    "Holy communion is to be observed to remember the sacrifice of Christ",
    "Giving tithes and offerings",
    "Each person has a purpose and mission to fulfill on earth",
    "The second coming of Christ"
  ];

  return (
    <div className="pt-16 min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Section 1 — Page Hero */}
      <section data-section="about-hero" className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/jkc-devotion-app/images/church/building-banner.png"
            alt="JKC About"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-serif italic text-white leading-tight">
            About Us
          </h1>
          <p className="text-[10px] font-black tracking-[0.5em] text-white/60 uppercase">
            Our Story · Our Beliefs · Our Mission
          </p>
        </div>
      </section>

      {/* Section 2 — Church History */}
      <section data-section="about-history" className="py-24 px-6 relative overflow-hidden" style={{ background: 'var(--jkc-navy)' }}>
        {/* Top curved divider effect */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]" style={{ fill: 'var(--background)' }}>
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
        </div>

        <div className="max-w-4xl mx-auto space-y-16 text-white text-center">
          <div className="space-y-4 pt-12">
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-[var(--jkc-gold)]">THE BEGINNING</h2>
            <div className="w-12 h-1 bg-[var(--jkc-gold)] mx-auto" />
            <p className="text-xl md:text-2xl leading-relaxed text-slate-100 font-light max-w-3xl mx-auto">
              In 2017, Japan Kingdom Church held its first service in Pastor Marcel's living room, gathering those who had no knowledge of Christ from the streets. By following Christ's example of focusing on the lost, the poor, and the needy, the small house church began to grow.
            </p>
          </div>

          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
            <img 
              src="/jkc-devotion-app/images/history/beginning-1.png" 
              alt="The Beginning - Pastor Marcel House Church" 
              className="w-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
            />
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-xl md:text-2xl leading-relaxed text-slate-100 font-light max-w-3xl mx-auto">
              Recognizing the need to further support the community, Pastor Marcel envisioned a church facility that provided not only space for worship services but also practical support, including a shower room for the homeless. Miraculously, God led the church to a building that could accommodate both English and Japanese worship services as well as a care center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden shadow-lg transform md:-rotate-2 hover:rotate-0 transition-transform duration-500">
               <img src="/jkc-devotion-app/images/history/beginning-2.png" className="w-full h-full object-cover" alt="History" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg border-2 border-[var(--jkc-gold)]/30">
               <img src="/jkc-devotion-app/images/history/beginning-3.png" className="w-full h-full object-cover" alt="History" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
               <img src="/jkc-devotion-app/images/pastor/pastor-and-chiaki.png" className="w-full h-full object-cover" alt="History" />
            </div>
          </div>

          <div className="space-y-8 pt-8">
            <p className="text-xl md:text-2xl leading-relaxed text-slate-100 font-light max-w-3xl mx-auto">
                Since then, Japan Kingdom Church has rehabilitated over a dozen homeless individuals and has witnessed both foreigners and Japanese natives give their lives to Christ and become disciples.
            </p>
            <p className="text-xl md:text-2xl leading-relaxed text-slate-100 font-light max-w-3xl mx-auto">
                Japan Kingdom Church has since relocated to a prominent location just two minutes from Akishima train station, offering high visibility for more outreach to the lost. JKC continues its mission to save souls and support those in need.
            </p>
            <div className="rounded-[3rem] overflow-hidden shadow-2xl">
               <img src="/jkc-devotion-app/images/church/building-banner.png" className="w-full h-64 object-cover" alt="Current Location" />
            </div>
          </div>
        </div>

        {/* Bottom curved divider effect */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]" style={{ fill: 'var(--background)' }}>
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        {/* Section 3 — Vision and Mission */}
        <section data-section="about-vision" className="grid md:grid-cols-2 gap-8">
          <div className="rounded-[4rem] p-12 md:p-16 border space-y-8 flex flex-col justify-center backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500" 
               style={{ background: 'var(--card)', borderColor: 'var(--border)', borderTop: '6px solid var(--jkc-gold)', boxShadow: 'var(--card-shadow)' }}>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-[var(--jkc-gold)]">OUR VISION</p>
            <p className="text-3xl md:text-4xl font-black italic leading-tight" style={{ color: 'var(--foreground)' }}>
              "To Make a Difference In Japan and Around the World Together!"
            </p>
          </div>
          <div className="rounded-[4rem] p-12 md:p-16 border space-y-8 flex flex-col justify-center backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500" 
               style={{ background: 'var(--card)', borderColor: 'var(--border)', borderTop: '6px solid var(--jkc-navy)', boxShadow: 'var(--card-shadow)' }}>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-[var(--jkc-navy)]">OUR MISSION</p>
            <p className="text-3xl md:text-4xl font-black italic leading-tight" style={{ color: 'var(--foreground)' }}>
              "We exist to build a strong Christian community that represents Christ to society."
            </p>
          </div>
        </section>

        {/* Section 4 — Statement of Faith */}
        <section data-section="about-beliefs" className="space-y-16 py-12">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--jkc-gold)' }}>WHAT WE BELIEVE</p>
            <h2 className="text-4xl md:text-7xl font-black" style={{ color: 'var(--foreground)' }}>
              Statement of <span className="font-serif italic font-medium">Faith</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {beliefs.map((belief, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div
                  className="mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:bg-[var(--jkc-gold)] group-hover:border-transparent group-hover:scale-110"
                  style={{ background: 'rgba(245,166,35,0.05)', borderColor: 'rgba(245,166,35,0.2)' }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--jkc-gold)] group-hover:text-white transition-colors" />
                </div>
                <p className="font-bold text-lg leading-snug pt-1" style={{ color: 'var(--foreground)' }}>{belief}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
