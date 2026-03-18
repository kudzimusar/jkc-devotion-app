
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
      {/* SECTION 1: HERO - OUR PASTOR & HISTORY */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center" style={{ backgroundColor: '#EE9B33' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/40 blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-black/20 blur-[80px] -ml-32 -mb-32" />
        </div>

        <div className="max-w-screen-xl mx-auto px-6 w-full relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Pastor Image */}
            <div className="relative">
              <div className="relative z-10 transform -rotate-1 hover:rotate-0 transition-transform duration-700">
                <img 
                  src="/jkc-devotion-app/images/pastor/pastor-and-chiaki.png" 
                  alt="Pastor Marcel & Chiaki" 
                  className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                />
              </div>
              {/* Decorative background shape */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-white/5 rounded-[4rem] rotate-6 pointer-events-none" />
            </div>

            {/* Right Column: Pastor History */}
            <div className="space-y-8 text-white">
              <div className="space-y-4">
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                  <span className="block opacity-90">OUR</span>
                  <span className="block" style={{ color: 'var(--jkc-navy)' }}>PASTOR</span>
                </h1>
                <div className="w-20 h-2 bg-white" />
              </div>
              
              <div className="space-y-6 text-xl md:text-2xl font-medium leading-relaxed opacity-95">
                <p>
                  Pastor Marcel Jonte Gadsden was born in Kamp Lintford, Germany and traveled the world 
                  through his father's military career, and arrived in Japan in July of 1999.
                </p>
                <p>
                  Marcel studied for several years under the tutelage of overseeing Bishop, 
                  the late Bishop Nathaniel Holcomb of the Christian House of Prayer (CHOP) 
                  in Killeen Texas, and earned his Pastorate in 2017.
                </p>
                <div className="pt-4">
                  <Link 
                    href="/welcome/our-pastor"
                    className="inline-flex items-center gap-4 px-10 py-5 rounded-full text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'var(--jkc-navy)', color: 'white' }}
                  >
                    LEARN MORE <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE BEGINNING (CHURCH HISTORY) */}
      <section className="py-24 px-6" style={{ background: 'var(--jkc-navy)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.5em] text-[var(--jkc-gold)] uppercase">THE BEGINNING</p>
            <div className="w-12 h-1 bg-[var(--jkc-gold)] mx-auto" />
          </div>
          
          <div className="space-y-8 text-2xl md:text-3xl font-light text-center leading-relaxed text-white italic">
            <p>
              In 2017, Japan Kingdom Church held its first service in Pastor Marcel's living room, 
              gathering those who had no knowledge of Christ from the streets. By following Christ's 
              example of focusing on the lost, the poor, and the needy, the small house church began to grow.
            </p>
            <p>
               Recognizing the need to further support the community, Pastor Marcel envisioned a church facility that provided not only space for worship services but also practical support, including a shower room for the homeless. Miraculously, God led the church to a building that could accommodate both English and Japanese worship services as well as a care center.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pb-8">
            <img src="/jkc-devotion-app/images/history/beginning-1.png" className="w-full aspect-square object-cover rounded-3xl grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 shadow-xl" alt="History" />
            <img src="/jkc-devotion-app/images/history/beginning-2.png" className="w-full aspect-square object-cover rounded-3xl grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 shadow-xl" alt="History" />
            <img src="/jkc-devotion-app/images/history/beginning-3.png" className="w-full aspect-square object-cover rounded-3xl grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 shadow-xl" alt="History" />
            <img src="/jkc-devotion-app/images/church/building-banner.png" className="w-full aspect-square object-cover rounded-3xl grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105 shadow-xl" alt="History" />
          </div>

          <p className="text-xl text-white/70 max-w-2xl mx-auto pt-8">
             Japan Kingdom Church has since relocated to a prominent location just two minutes from Akishima train station, offering high visibility for more outreach to the lost. JKC continues its mission to save souls and support those in need.
          </p>
        </div>
      </section>

      {/* SECTION 3: VISION & MISSION */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900 overflow-hidden relative">
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 relative z-10">
          <div className="group rounded-[4rem] p-16 border-2 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-center space-y-6" 
               style={{ background: 'var(--card)', borderColor: 'var(--jkc-gold)' }}>
             <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase">OUR VISION</p>
             <h2 className="text-4xl font-black italic text-slate-800 dark:text-white leading-tight">
               "To Make a Difference In Japan and Around the World Together!"
             </h2>
          </div>
          <div className="group rounded-[4rem] p-16 border-2 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-center space-y-6" 
               style={{ background: 'var(--card)', borderColor: 'var(--jkc-navy)' }}>
             <p className="text-[10px] font-black tracking-widest text-[var(--jkc-navy)] uppercase">OUR MISSION</p>
             <h2 className="text-4xl font-black italic text-slate-800 dark:text-white leading-tight">
               "We exist to build a strong Christian community that represents Christ to society."
             </h2>
          </div>
        </div>
      </section>

      {/* SECTION 4: STATEMENT OF FAITH */}
      <section className="py-24 px-6" style={{ background: 'var(--section-alt)' }}>
        <div className="max-w-screen-xl mx-auto space-y-20">
          <div className="text-center space-y-4">
             <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter" style={{ color: 'var(--foreground)' }}>
               Statement <span className="text-[var(--jkc-gold)]">Of Faith</span>
             </h2>
             <div className="w-20 h-2 bg-[var(--jkc-navy)] mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
            {beliefs.map((belief, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <CheckCircle2 className="w-6 h-6 text-[var(--jkc-gold)]" />
                </div>
                <p className="text-xl font-bold leading-snug pt-1" style={{ color: 'var(--foreground)' }}>
                  {belief}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
