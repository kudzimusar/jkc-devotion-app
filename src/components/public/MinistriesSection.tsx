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
  { name: "Worship Ministry", slug: "worship-ministry", description: "Leading the sound of worship to our King." },
  { name: "Ushering Ministry", slug: "ushers", description: "Providing a warm welcome and order for every guest." },
  { name: "Evangelism Ministry", slug: "evangelism", description: "Taking the light of Christ to the streets of Tokyo." },
  { name: "Prayer Ministry", slug: "prayer", description: "Interceding for hearts, our city, and our nation." },
  { name: "Children's Ministry", slug: "kids-ministry", description: "Nurturing the future of the Kingdom of God." },
  { name: "Youth Ministry", slug: "youth-ministry", description: "Empowering young lives for spiritual transformation." },
];

const MINISTRY_IMAGES: Record<string, string> = {
  'worship-ministry': '/jkc-devotion-app/images/ministry_worship_card.png',
  'worship': '/jkc-devotion-app/images/ministry_worship_card.png',
  'ushers': '/jkc-devotion-app/images/ministry_ushers_card.png',
  'ushers-ministry': '/jkc-devotion-app/images/ministry_ushers_card.png',
  'evangelism': '/jkc-devotion-app/images/outreach_street_evangelism.png',
  'prayer': '/jkc-devotion-app/images/ministry_prayer_card.png',
  'kids-ministry': '/jkc-devotion-app/images/ministry_kids_card.png',
  'childrens': '/jkc-devotion-app/images/ministry_kids_card.png',
  'youth-ministry': '/jkc-devotion-app/images/outreach_toyoko.png',
  'youth': '/jkc-devotion-app/images/outreach_toyoko.png',
  'finance': '/jkc-devotion-app/images/ministry_finance_card.png',
  'finance-ministry': '/jkc-devotion-app/images/ministry_finance_card.png',
  'hospitality': '/jkc-devotion-app/images/ministry_hospitality_card.png',
  'hospitality-ministry': '/jkc-devotion-app/images/ministry_hospitality_card.png',
  'fellowship': '/jkc-devotion-app/images/ministry_fellowship_card.png',
  'fellowship-circles': '/jkc-devotion-app/images/ministry_fellowship_card.png',
  'akiramenai': '/jkc-devotion-app/images/outreach_akiramenai.png',
  'food-pantry': '/jkc-devotion-app/images/ministry_foodpantry_card.png',
  'media': '/jkc-devotion-app/images/hero-background.jpg',
  'missions': '/jkc-devotion-app/images/church/building-banner.png',
};

export default function MinistriesSection() {
  const { isDark } = usePublicTheme();
  const [ministries, setMinistries] = useState<Ministry[]>(fallbacks);

  useEffect(() => {
    supabase
      .from('ministries')
      .select('id, name, slug, description')
      .order('name', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMinistries(data);
        }
      });
  }, []);

  return (
    <section data-section="ministries" className="py-24 px-6 scroll-mt-20"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--jkc-gold)' }}>
              GET INVOLVED
            </p>
            <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
              Find Your <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-navy)' }}>Community</span>
            </h2>
          </div>
          <p className="text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
            Every ministry exists to help you grow deeper, connect further, and serve wider together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map((m, idx) => {
            const slugMatch = MINISTRY_IMAGES[m.slug];
            const nameMatch = Object.entries(MINISTRY_IMAGES).find(([k]) => m.name.toLowerCase().includes(k))?.[1];
            const imageUrl = (m as any).image_url || slugMatch || nameMatch || '/jkc-devotion-app/images/hero-background.jpg';
            
            return (
              <Link
                key={m.id || m.slug}
                href={`/welcome/ministries/${m.slug}`}
                className="group relative flex flex-col justify-end min-h-[220px] transition-all duration-300 overflow-hidden rounded-[2rem] border shadow-sm hover:-translate-y-2"
                style={{
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={imageUrl} 
                    alt={m.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative p-6 space-y-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-wide text-white drop-shadow-lg">
                      {m.name}
                    </h3>
                  </div>
                  <div className="overflow-hidden h-0 group-hover:h-12 transition-all duration-300">
                    <p className="text-[11px] leading-relaxed text-slate-200 line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span 
                      className="text-[9px] font-black tracking-[0.2em] uppercase inline-flex items-center gap-2"
                      style={{ color: 'var(--jkc-gold)' }}
                    >
                      LEARN MORE <span>→</span>
                    </span>
                  </div>
                </div>

                {/* Accent Line on hover */}
                <div className="absolute top-0 left-0 w-0 h-1 bg-[var(--jkc-gold)] group-hover:w-full transition-all duration-500" />
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
           <Link href="/welcome/ministries" className="text-[10px] font-black tracking-widest uppercase py-4 px-10 rounded-full border border-[var(--jkc-navy)] text-[var(--jkc-navy)] hover:bg-[var(--jkc-navy)] hover:text-white transition-all">
             VIEW ALL DEPARTMENTS
           </Link>
        </div>
      </div>
    </section>
  );
}
