
'use client';

import { CheckCircle2 } from 'lucide-react';

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

  const outreach = [
    { 
      title: "Akiramenai Homeless Program", 
      desc: "Rehabilitating and supporting homeless individuals in Tokyo.",
      image: "/jkc-devotion-app/images/outreach/akiramenai.jpg"
    },
    { 
      title: "Food Pantry", 
      desc: "Providing food support to those in need in our community.",
      image: "/jkc-devotion-app/images/outreach/food-pantry.jpg"
    },
    { 
      title: "PinkLove Women's Outreach", 
      desc: "Supporting and caring for women in Tokyo's urban environment.",
      image: "/jkc-devotion-app/images/outreach/pinklove.jpg"
    },
    { 
      title: "Street Evangelism", 
      desc: "Sharing hope and faith on the streets of Tokyo.",
      image: "/jkc-devotion-app/images/outreach/street-evangelism.jpg"
    },
    { 
      title: "Toyoko Youth Program", 
      desc: "Providing a safe space and mentorship for young people.",
      image: "/jkc-devotion-app/images/outreach/toyoko-youth.jpg"
    }
  ];

  return (
    <div className="pt-16 min-h-screen bg-[oklch(0.08_0.04_255)] text-white">
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">OUR STORY · OUR BELIEFS · OUR MISSION</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">About</span> Us
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>About Us</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        <section className="grid lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">THE BEGINNING</p>
              <h2 className="text-4xl md:text-5xl font-black italic font-serif">A Vision for Japan</h2>
            </div>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed">
              <p>In 2017, Japan Kingdom Church held its first service in Pastor Marcel's living room, gathering those who had no knowledge of Christ from the streets. By following Christ's example of focusing on the lost, the poor, and the needy, the small house church began to grow.</p>
              
              <p>Recognizing the need to further support the community, Pastor Marcel envisioned a church facility that provided not only space for worship services but also practical support, including a shower room for the homeless. Miraculously, God led the church to a building that could accommodate both English and Japanese worship services as well as a care center.</p>

              {/* History Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                {[
                  { src: '/jkc-devotion-app/images/history/beginning-1.png', alt: 'JKC early days' },
                  { src: '/jkc-devotion-app/images/history/beginning-2.png', alt: 'JKC congregation' },
                  { src: '/jkc-devotion-app/images/history/beginning-3.png', alt: 'JKC growth' },
                ].map(img => (
                  <div key={img.src} className="rounded-[1.5rem] overflow-hidden aspect-video border border-white/10 glass">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <p>Since then, Japan Kingdom Church has rehabilitated over a dozen homeless individuals and has witnessed both foreigners and Japanese natives give their lives to Christ and become disciples.</p>

              {/* Service Photos */}
              <div className="grid grid-cols-3 gap-4 my-8">
                {[
                  '/jkc-devotion-app/images/history/service-1.jpg',
                  '/jkc-devotion-app/images/history/service-2.jpg',
                  '/jkc-devotion-app/images/history/service-3.jpg',
                ].map(src => (
                  <div key={src} className="rounded-2xl overflow-hidden aspect-square border border-white/10 glass">
                    <img src={src} alt="JKC service" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>

              <p>Japan Kingdom Church has since relocated to a prominent location just two minutes from Akishima train station, offering high visibility for more outreach to the lost. JKC continues its mission to save souls and support those in need.</p>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-auto md:h-[600px] glass rounded-[3rem] border border-white/10 overflow-hidden group">
            <img 
              src="/jkc-devotion-app/images/pastor/pastor-and-chiaki.png" 
              alt="Pastor Marcel and Chiaki"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-[var(--primary)] space-y-6 bg-white/5">
            <p className="text-[10px] font-black tracking-[0.3em] text-[var(--primary)] uppercase">OUR VISION</p>
            <p className="text-3xl font-black italic font-serif leading-tight">"To Make a Difference In Japan and Around the World Together!"</p>
          </div>
          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-indigo-400 space-y-6 bg-white/5">
            <p className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">OUR MISSION</p>
            <p className="text-3xl font-black italic font-serif leading-tight">"We exist to build a strong Christian community that represents Christ to society."</p>
          </div>
        </section>

        {/* Outreach Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">OUR IMPACT</p>
            <h2 className="text-4xl md:text-6xl font-black italic font-serif">Community Outreach</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {outreach.map((item, idx) => (
              <div key={idx} className="group glass rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col h-full bg-white/5">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-8 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{item.title}</h3>
                  <p className="text-white/50 text-xs font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-12 bg-white/5 rounded-[4rem] p-12 md:p-20 border border-white/5 shadow-2xl">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">WHAT WE BELIEVE</p>
            <h2 className="text-4xl md:text-6xl font-black italic font-serif">Statement of Faith</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {beliefs.map((belief, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div className="mt-1 w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)] group-hover:text-white transition-all"><CheckCircle2 className="w-4 h-4 text-[var(--primary)] group-hover:text-white" /></div>
                <p className="text-white/80 font-bold leading-relaxed">{belief}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
