'use client';

export default function MissionStrip() {
  return (
    <div data-section="mission" className="relative">
      <section
        data-section="mission"
        className="py-24 px-6 text-center bg-[#f5a623] border-y border-[#e8940a]/30"
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl md:text-5xl font-serif italic font-medium text-[#1b3a6b]/90 leading-relaxed md:leading-tight">
            "Building a Strong Christian Community that Represents{' '}
            <span className="text-[#1b3a6b] non-italic font-black">Christ</span>{' '}
            to Japanese Society"
          </p>
        </div>
      </section>
      {/* Wave bottom — cream flows into next section */}
      <div className="relative h-16 bg-[#f5a623] overflow-hidden">
        <svg
          viewBox="0 0 1440 64"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
          style={{ height: '64px' }}
        >
          <path 
            className="wave-cream"
            d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z"
            fill="#fffdf7" 
          />
        </svg>
      </div>
    </div>
  );
}
