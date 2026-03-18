'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { basePath as BP } from '@/lib/utils';
import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';

type Ministry = {
  id?: string;
  name: string;
  slug: string;
  description: string;
};

const fallbacks: Ministry[] = [
  {
    name: "Children's Ministry", slug: "kids-ministry",
    description: "Nurturing the next generation in faith."
  },
  {
    name: "Youth Ministry", slug: "youth-ministry",
    description: "Empowering young people to live for Christ."
  },
  {
    name: "Worship Ministry", slug: "worship-ministry",
    description: "Leading the congregation into God's presence."
  },
  {
    name: "Women's Ministry", slug: "womens-ministry",
    description: "Equipping women to walk in purpose and grace."
  },
  {
    name: "Men's Ministry", slug: "mens-ministry",
    description: "Building men of faith, character, and vision."
  },
  {
    name: "Language School", slug: "language-school",
    description: "Kingdom Language School — bridging cultures."
  }
];

/* Accent colours rotate across cards for visual variety */
const accentColors = [
  { border: 'var(--jkc-gold)',  dot: 'var(--jkc-gold)' },
  { border: 'var(--jkc-navy)', dot: 'var(--jkc-navy)' },
  { border: 'var(--jkc-gold)', dot: 'var(--jkc-gold)' },
  { border: 'var(--jkc-navy)', dot: 'var(--jkc-navy)' },
  { border: 'var(--jkc-gold)', dot: 'var(--jkc-gold)' },
  { border: 'var(--jkc-navy)', dot: 'var(--jkc-navy)' },
];

export default function MinistriesSection() {
  const { isDark } = usePublicTheme();
  const [ministries, setMinistries] = useState<Ministry[]>(fallbacks);

  useEffect(() => {
    supabase
      .from('ministries')
      .select('id, name, slug, description')
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMinistries(data);
        }
      });
  }, []);

  return (
    <section data-section="ministries" className="py-32 px-6 scroll-mt-20"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-3 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            GET INVOLVED
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            Find Your <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-navy)' }}>Community</span>
          </h2>
          <p className="text-base max-w-xl" style={{ color: 'var(--muted-foreground)' }}>
            Every ministry exists to help you grow deeper, connect further, and serve wider.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map((m, idx) => {
            const accent = accentColors[idx % accentColors.length];
            const imageUrl = (m as any).image_url;
            return (
              <div
                key={m.id || m.slug}
                className="group relative flex flex-col justify-end min-h-[360px] transition-all duration-300 cursor-pointer overflow-hidden rounded-[2.5rem] border"
                style={{
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--card-shadow)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-2xl)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
                }}
              >
                {/* Background Image */}
                {imageUrl && (
                  <>
                    <img 
                      src={imageUrl} 
                      alt={m.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  </>
                )}

                {/* Content Overlay */}
                <div className="relative p-8 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black leading-tight text-white drop-shadow-md">
                      {m.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-200 line-clamp-2">
                      {m.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/welcome/ministries/${m.slug}`}
                      className="text-[10px] font-black tracking-[0.25em] uppercase inline-flex items-center gap-2 group-hover:gap-3 transition-all"
                      style={{ color: 'var(--jkc-gold)' }}
                    >
                      LEARN MORE <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Accent Dot */}
                <div className="absolute top-8 right-8 w-2 h-2 rounded-full ring-4 ring-white/10"
                     style={{ background: accent.dot }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
