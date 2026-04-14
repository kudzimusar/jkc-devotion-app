'use client';

import { useChurch } from '@/lib/church-context';

export default function MissionStrip() {
  const { org, slug } = useChurch();
  const isJKC = slug === 'jkc-devotion-app' || slug === 'jkc';
  const mission = org?.mission_statement ?? (isJKC 
    ? "Building a Strong Christian Community that Represents Christ to Japanese Society"
    : "Building a Strong Christian Community that Represents Christ to Our Society");

  return (
    <div data-section="mission" className="relative">
      <section
        data-section="mission"
        className="py-24 px-6 text-center border-y"
        style={{ background: 'var(--jkc-gold)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl md:text-5xl font-serif italic font-medium leading-relaxed md:leading-tight"
             style={{ color: 'var(--jkc-navy)' }}>
             "{mission}"
          </p>
        </div>
      </section>
      {/* Wave bottom — flows into next section background */}
      <div className="relative h-16 overflow-hidden" style={{ background: 'var(--jkc-gold)' }}>
        <svg
          viewBox="0 0 1440 64"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
          style={{ height: '64px' }}
        >
          <path
            className="wave-gray"
            d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
            fill="var(--section-alt)"
          />
        </svg>
      </div>
    </div>
  );
}
