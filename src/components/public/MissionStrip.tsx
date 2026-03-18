'use client';

export default function MissionStrip() {
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
            "Building a Strong Christian Community that Represents{' '}
            <span className="non-italic font-black">Christ</span>{' '}
            to Japanese Society"
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
