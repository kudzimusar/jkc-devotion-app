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

  const outreach = [
    {
      title: "Toyoko Youth Outreach",
      slug: "toyoko-youth-outreach",
      desc: "Breaking the cycle of poverty and exploitation among youth in Kabukicho, Shinjuku.",
      image: "/jkc-devotion-app/images/outreach_toyoko.png",
      color: "#8B5CF6"
    },
    {
      title: "Akiramenai — Don't Give Up",
      slug: "akiramenai",
      desc: "Providing food, care, and shelter to Tokyo's homeless population every 3rd Saturday.",
      image: "/jkc-devotion-app/images/outreach_akiramenai.png",
      color: "#EF4444"
    },
    {
      title: "The Food Pantry",
      slug: "food-pantry",
      desc: "Combating hunger by providing nourishment to single mothers and low-income families.",
      image: "/jkc-devotion-app/images/ministry_foodpantry_card.png",
      color: "#F59E0B"
    },
    {
      title: "Street Evangelism",
      slug: "street-evangelism",
      desc: "Taking the gospel of Christ outside the 4 walls of the church into the streets of Tokyo.",
      image: "/jkc-devotion-app/images/outreach_street_evangelism.png",
      color: "#10B981"
    },
  ];

  return (
    <div className="pt-16 min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section data-section="about-hero" className="relative py-40 px-6 flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/jkc-devotion-app/images/outreach_akiramenai.png"
            alt="JKC About"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">OUR STORY · OUR BELIEFS · OUR MISSION</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            About <span className="font-serif italic font-medium normal-case" style={{ color: 'var(--jkc-gold)' }}>Us</span>
          </h1>
          <div className="w-20 h-1 mx-auto" style={{ background: 'var(--jkc-gold)' }} />
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">

        {/* History */}
        <section data-section="about-history" className="grid lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--jkc-gold)' }}>THE BEGINNING</p>
              <h2 className="text-4xl md:text-5xl font-black italic" style={{ color: 'var(--foreground)' }}>A Vision for Japan</h2>
              <div className="w-12 h-1" style={{ background: 'var(--jkc-navy)' }} />
            </div>
            <div className="space-y-6 text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              <p>In 2017, Japan Kingdom Church held its first service in Pastor Marcel's living room, gathering those who had no knowledge of Christ from the streets. By following Christ's example of focusing on the lost, the poor, and the needy, the small house church began to grow.</p>
              <p>Recognizing the need to further support the community, Pastor Marcel envisioned a church facility that provided not only space for worship services but also practical support, including a shower room for the homeless. Miraculously, God led the church to a building that could accommodate both English and Japanese worship services.</p>
              <p>Japan Kingdom Church has since relocated to a prominent location just two minutes from Akishima train station. JKC continues its mission to save souls and support those in need.</p>
            </div>
          </div>
          <div className="relative rounded-[3rem] overflow-hidden group" style={{ border: '1px solid var(--border)' }}>
            <img
              src="/jkc-devotion-app/images/pastor/pastor-and-chiaki.png"
              alt="Pastor Marcel and Chiaki"
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
        </section>

        {/* Vision / Mission */}
        <section data-section="about-vision" className="grid md:grid-cols-2 gap-8">
          <div className="rounded-[3rem] p-12 border space-y-6" style={{ background: 'var(--card)', borderColor: 'var(--border)', borderLeft: '4px solid var(--jkc-gold)' }}>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--jkc-gold)' }}>OUR VISION</p>
            <p className="text-3xl font-black italic leading-tight" style={{ color: 'var(--foreground)' }}>"To Make a Difference In Japan and Around the World Together!"</p>
          </div>
          <div className="rounded-[3rem] p-12 border space-y-6" style={{ background: 'var(--card)', borderColor: 'var(--border)', borderLeft: '4px solid var(--jkc-navy)' }}>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--jkc-navy)' }}>OUR MISSION</p>
            <p className="text-3xl font-black italic leading-tight" style={{ color: 'var(--foreground)' }}>"We exist to build a strong Christian community that represents Christ to society."</p>
          </div>
        </section>

        {/* Outreach Section */}
        <section data-section="about-outreach" className="space-y-12">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--jkc-gold)' }}>OUR IMPACT</p>
            <h2 className="text-4xl md:text-6xl font-black" style={{ color: 'var(--foreground)' }}>
              Community <span className="font-serif italic font-medium">Outreach</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              We believe the church exists for the world. Here are our active outreach programs in Tokyo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {outreach.map((item) => (
              <Link
                key={item.slug}
                href={`/welcome/outreach/${item.slug}`}
                className="group rounded-[2.5rem] overflow-hidden border flex flex-col transition-all duration-300 hover:-translate-y-2"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' }}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-white"
                    style={{ background: item.color }}
                  >
                    OUTREACH
                  </div>
                </div>
                <div className="p-8 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {item.desc}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase group-hover:gap-3 transition-all mt-4"
                    style={{ color: item.color }}
                  >
                    LEARN MORE <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/welcome/outreach"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase text-white transition-all hover:scale-105"
              style={{ background: 'var(--jkc-navy)', boxShadow: '0 8px 24px rgba(27,58,107,0.3)' }}
            >
              VIEW ALL OUTREACH PROGRAMS →
            </Link>
          </div>
        </section>

        {/* Statement of Faith */}
        <section data-section="about-beliefs" className="space-y-12 rounded-[4rem] p-12 md:p-20 border" style={{ background: 'var(--section-alt)', borderColor: 'var(--border)' }}>
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--jkc-gold)' }}>WHAT WE BELIEVE</p>
            <h2 className="text-4xl md:text-6xl font-black" style={{ color: 'var(--foreground)' }}>
              Statement of <span className="font-serif italic font-medium">Faith</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {beliefs.map((belief, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div
                  className="mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all group-hover:scale-110"
                  style={{ background: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.3)' }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <p className="font-bold leading-relaxed" style={{ color: 'var(--foreground)' }}>{belief}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
