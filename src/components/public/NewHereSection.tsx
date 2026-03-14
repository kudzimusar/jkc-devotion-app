'use client';

import Link from 'next/link';

export default function NewHereSection() {
  return (
    <section className="py-24 px-6 bg-white/5 border-y border-white/5">
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Card 1 — New Visitor */}
        <div className="glass-card rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-[var(--primary)] space-y-8 flex flex-col justify-between hover:bg-white/10 transition-colors group">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white/90">First time here?</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              We'd love to welcome you. Come as you are — no experience needed. Find out what to expect when you visit us.
            </p>
          </div>
          <div className="pt-6">
            <a 
              href="https://calendly.com/visitjkc/service" 
              target="_blank"
              className="inline-block bg-[var(--primary)] text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] shadow-xl shadow-primary/20 group-hover:scale-105 active:scale-95 transition-all text-center"
            >
              PLAN MY VISIT
            </a>
          </div>
        </div>

        {/* Card 2 — Returning Member */}
        <div className="glass-card rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-indigo-400 space-y-8 flex flex-col justify-between hover:bg-white/10 transition-colors group">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white/90">Part of the family?</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Access sermons, devotionals, ministry tools and your church community. Everything you need in one place.
            </p>
          </div>
          <div className="pt-6">
            <Link 
              href="/" 
              className="inline-block border border-white/20 text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] group-hover:bg-white/5 group-hover:border-white/40 active:scale-95 transition-all text-center"
            >
              SIGN IN TO CHURCH OS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
