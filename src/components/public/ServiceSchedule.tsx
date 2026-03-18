'use client';

import { motion } from 'framer-motion';
import { usePublicTheme } from './PublicThemeWrapper';

export default function ServiceSchedule() {
  const { isDark } = usePublicTheme();
  const schedules = [
    {
      label: "PRAYER SERVICE",
      time: "09:30 — 10:00",
      note: "All welcome"
    },
    {
      label: "MORNING SERVICE",
      time: "10:30 — 12:30",
      note: "IN-PERSON & ONLINE"
    }
  ];

  return (
    <div data-section="schedule" className="relative">
      {/* Wave top — from cream into navy */}
      <div className="h-16 overflow-hidden" style={{ background: 'var(--background)' }}>
        <svg viewBox="0 0 1440 64" className="w-full h-full"
          preserveAspectRatio="none">
          <path
            className="wave-navy"
            d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z"
            fill="var(--footer-bg)"
          />
        </svg>
      </div>
      <section id="visit" data-section="schedule"
        className="py-32 px-6 text-center scroll-mt-20"
        style={{ background: 'var(--footer-bg)' }}>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--footer-muted)' }}>
              CHURCH SCHEDULE
            </p>
            <h2 className="text-4xl md:text-6xl font-black" style={{ color: 'var(--footer-fg)' }}>
              Join Us <span className="font-serif italic font-medium">Every Sunday</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {schedules.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="rounded-[2.5rem] p-10 transition-all group"
                style={{
                  background: 'var(--footer-bg)',
                  border: '1px solid var(--jkc-gold)',
                  boxShadow: 'var(--shadow-xl)'
                }}
              >
                <p className="text-[10px] font-black tracking-widest uppercase mb-2"
                   style={{ color: 'var(--footer-muted)' }}>{item.label}</p>
                <h3 className="text-4xl font-black" style={{ color: 'var(--jkc-gold)' }}>{item.time}</h3>
                <p className="text-xs font-bold mt-4 tracking-widest uppercase"
                   style={{ color: 'var(--footer-muted)' }}>{item.note}</p>
              </motion.div>
            ))}
          </div>

          <div className="pt-8">
            <a
              href="https://calendly.com/visitjkc/service"
              target="_blank"
              className="inline-flex items-center gap-4 font-black px-12 py-6 rounded-full text-sm tracking-[0.2em] transition-all"
              style={{
                background: 'var(--jkc-gold)',
                color: 'var(--jkc-navy)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              PLAN MY VISIT →
            </a>
          </div>
        </div>
      </section>
      {/* Wave bottom — navy into cream */}
      <div className="h-16 overflow-hidden" 
           style={{ background: 'var(--footer-bg)' }}>
        <svg viewBox="0 0 1440 64" className="w-full h-full"
          preserveAspectRatio="none">
          <path
            className="wave-cream"
            d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </div>
  );
}
