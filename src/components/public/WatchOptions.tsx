'use client';

import { Tv, MapPin, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const options = [
  {
    Icon: MapPin,
    title: 'Join In Person',
    desc: 'Experience the energy of worshipping together every Sunday at TE Building 3F, Akishima, Tokyo.',
    cta: 'PLAN MY VISIT',
    href: 'https://www.google.com/maps?q=Japan+Kingdom+Church+TE+Building+Akishima+Tokyo',
    accent: 'var(--jkc-gold)',
    external: true,
  },
  {
    Icon: Wifi,
    title: 'Watch the Stream',
    desc: 'Catch the live service or replay at any time on our website — available every Sunday from 10:30AM JST.',
    cta: 'WATCH ONLINE',
    href: '/welcome/watch',
    accent: '#ffffff',
  },
  {
    Icon: Tv,
    title: 'On-Demand Library',
    desc: 'Deep-dive into our full archive of sermons, teaching series, and devotional messages on YouTube.',
    cta: 'BROWSE YOUTUBE',
    href: 'https://www.youtube.com/@JapanKingdomChurch/streams',
    accent: 'var(--jkc-gold)',
    external: true,
  },
];

export default function WatchOptions() {
  return (
    <section
      className="py-32 px-6"
      style={{ background: 'var(--footer-bg)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            HOW TO EXPERIENCE JKC
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: '#ffffff' }}>
            Choose Your{' '}
            <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-gold)' }}>
              Experience
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {options.map(({ Icon, title, desc, cta, href, accent, external }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: `3px solid ${accent}`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black" style={{ color: '#ffffff' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--footer-muted)' }}>{desc}</p>
                </div>
              </div>

              <div className="pt-8">
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black tracking-[0.3em] uppercase inline-flex items-center gap-2 group-hover:gap-3 transition-all"
                    style={{ color: accent }}
                  >
                    {cta} →
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="text-[10px] font-black tracking-[0.3em] uppercase inline-flex items-center gap-2 group-hover:gap-3 transition-all"
                    style={{ color: accent }}
                  >
                    {cta} →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
