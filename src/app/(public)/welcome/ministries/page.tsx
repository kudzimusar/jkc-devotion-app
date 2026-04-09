
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { ChevronLeft, ArrowRight, Loader2 } from 'lucide-react';

type Ministry = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

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
  'bible-study': '/jkc-devotion-app/images/ministry_fellowship_card.png',
  'bible-study-groups': '/jkc-devotion-app/images/ministry_fellowship_card.png',
  'akiramenai': '/jkc-devotion-app/images/outreach_akiramenai.png',
  'food-pantry': '/jkc-devotion-app/images/ministry_foodpantry_card.png',
};

export default function MinistriesListPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMinistries() {
      try {
        const orgId = await resolvePublicOrgId();
        const { data, error } = await supabase
          .from('vw_ministry_directory')
          .select('id, name, slug, description, category, is_active')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('category');

        if (error) throw error;
        if (data) setMinistries(data);
      } catch (err) {
        console.error('Failed to fetch ministries:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMinistries();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: 'var(--background)' }}>
      <div className="max-w-screen-xl mx-auto px-6">
        <Link 
          href="/welcome" 
          className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase mb-12 hover:translate-x-[-4px] transition-transform"
          style={{ color: 'var(--jkc-gold)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-4 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60" style={{ color: 'var(--foreground)' }}>ALL DEPARTMENTS</p>
          <h1 className="text-5xl md:text-7xl font-black italic" style={{ color: 'var(--foreground)' }}>
            Get <span style={{ color: 'var(--jkc-navy)' }}>Involved.</span>
          </h1>
          <p className="text-xl max-w-xl opacity-70" style={{ color: 'var(--foreground)' }}>
            Find your community and discover where your gifts fit best in the Kingdom.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center flex-col items-center gap-4 py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--jkc-navy)]" />
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--jkc-navy)]">Loading Ministries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ministries.map(m => {
                const isOutreach = ['toyoko-youth-outreach', 'akiramenai', 'food-pantry', 'street-evangelism'].includes(m.slug);
                const rootPath = isOutreach ? '/welcome/outreach' : '/welcome/ministries';
                
                const slugMatch = MINISTRY_IMAGES[m.slug];
                const nameMatch = Object.entries(MINISTRY_IMAGES).find(([k]) => m.name.toLowerCase().includes(k))?.[1];
                const imageUrl = slugMatch || nameMatch || '/jkc-devotion-app/images/hero-background.jpg';

                return (
                  <Link
                    key={m.id}
                    href={`${rootPath}/${m.slug}`}
                    className="group relative h-[300px] rounded-[3rem] overflow-hidden border transition-all hover:-translate-y-2 hover:shadow-2xl"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={m.name} 
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                    
                    <div className="absolute inset-x-8 bottom-8">
                      <h3 className="text-xl font-black uppercase text-white mb-2 drop-shadow-md">{m.name}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-4 h-0 group-hover:h-auto">
                        {m.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white/50 group-hover:text-[var(--jkc-gold)] uppercase transition-colors">
                        Explore <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
