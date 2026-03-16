'use client';

import { motion } from 'framer-motion';

export default function ServiceSchedule() {
  const schedules = [
    {
      label: "PRAYER SERVICE",
      time: "09:30 — 10:00",
      note: "All welcome"
    },
    {
      label: "MORNING SERVICE",
      time: "10:30 — 12:30",
      note: "In-person & online"
    }
  ];

  return (
  <div data-section="schedule" className="relative">
    {/* Wave top — from cream into navy */}
    <div className="h-16 bg-[#fef8ec] overflow-hidden">
      <svg viewBox="0 0 1440 64" className="w-full h-full"
        preserveAspectRatio="none">
        <path 
          className="wave-navy"
          d="M0,0 C360,64 1080,64 1440,0 L1440,64 L0,64 Z"
          fill="#1b3a6b" 
        />
      </svg>
    </div>
    <section id="visit" data-section="schedule"
      className="py-32 px-6 text-center bg-black/20 scroll-mt-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">
            CHURCH SCHEDULE
          </p>
          <h2 className="text-4xl md:text-6xl font-black text-white/90">
            Join Us <span className="font-serif italic font-medium">Every Sunday</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {schedules.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="glass rounded-[2.5rem] p-10 border border-white/10 hover:border-[var(--primary)]/30 transition-all group"
            >
              <p className="text-[10px] font-black tracking-widest text-white/40 mb-2 uppercase">{item.label}</p>
              <h3 className="text-4xl font-black text-[var(--primary)]">{item.time}</h3>
              <p className="text-white/30 text-xs font-bold mt-4 tracking-widest uppercase">{item.note}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <a 
            href="https://calendly.com/visitjkc/service" 
            target="_blank"
            className="inline-flex items-center gap-4 bg-[var(--primary)] text-white font-black px-12 py-6 rounded-full text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            PLAN MY VISIT →
          </a>
        </div>
      </div>
    </section>
    {/* Wave bottom — navy into cream */}
    <div className="h-16 bg-[#1b3a6b] overflow-hidden">
      <svg viewBox="0 0 1440 64" className="w-full h-full"
        preserveAspectRatio="none">
        <path 
          className="wave-cream"
          d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
          fill="#f8f6f0" 
        />
      </svg>
    </div>
  </div>
  );
}
