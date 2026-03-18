'use client';

import { motion } from 'framer-motion';

const stats = [
  { value: '9+',      label: 'Years of Ministry' },
  { value: '10+',     label: 'Member Families' },
  { value: 'ENG/JAP', label: 'Languages Spoken' },
  { value: '6+',      label: 'Active Ministries' },
];

export default function ImpactStrip() {
  return (
    <section
      className="py-16 px-6 border-y"
      style={{ background: 'var(--jkc-navy)', borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="flex flex-col items-center text-center px-4 md:border-r last:border-0 border-white/10"
            >
              <div className="relative mb-2">
                <span
                  className="text-5xl md:text-6xl font-black leading-none flex items-baseline justify-center"
                  style={{ color: 'var(--jkc-gold)' }}
                >
                  {stat.value}
                </span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full opacity-30" style={{ background: 'var(--jkc-gold)' }} />
              </div>
              <span
                className="mt-4 text-[11px] font-black tracking-[0.4em] uppercase opacity-60 leading-tight"
                style={{ color: '#ffffff' }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
