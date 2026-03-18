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
        // No need for else setMinistries(fallbacks) since it's already initial state
      });
  }, []);

  return (
    <section data-section="ministries" className="py-32 px-6 scroll-mt-20 border-t"
             style={{ background: 'var(--section-alt)', borderColor: 'var(--border)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-4 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase"
             style={{ color: 'var(--jkc-navy)' }}>
            GET INVOLVED
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            Find Your <span className="font-serif italic font-medium">Community</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map((m) => (
            <div
              key={m.id || m.slug}
              className="group relative rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[280px] transition-all duration-500 cursor-pointer overflow-hidden border"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <div className="absolute -right-12 -top-12 w-40 h-40 blur-3xl rounded-full transition-all duration-500"
                   style={{ background: 'var(--muted)' }} />

              <div className="relative space-y-4">
                <h3 className="text-2xl font-black transition-colors"
                    style={{ color: 'var(--foreground)' }}>
                  {m.name}
                </h3>
                <p className="text-base leading-relaxed font-medium"
                   style={{ color: 'var(--muted-foreground)' }}>
                  {m.description}
                </p>
              </div>

              <div className="relative pt-8">
                <Link
                  href={`/welcome/ministries/${m.slug}`}
                  className="text-[10px] font-black tracking-[0.2em] uppercase group-hover:translate-x-2 transition-transform inline-flex items-center gap-2"
                  style={{ color: 'var(--jkc-gold)' }}
                >
                  LEARN MORE <span className="text-lg">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
