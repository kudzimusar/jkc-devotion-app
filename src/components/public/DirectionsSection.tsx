'use client';

import { MapPin, Train, Car, ArrowRight } from 'lucide-react';
import { usePublicTheme } from './PublicThemeWrapper';
import { useChurch } from '@/lib/church-context';

export default function DirectionsSection() {
  const { org, slug } = useChurch();
  const { isDark } = usePublicTheme();
  
  const isJKC = slug === 'jkc-devotion-app' || slug === 'jkc';

  const address = org?.address ?? (isJKC ? '〒196-0015 東京都昭島市昭和町2-1-6' : 'Address Not Set');
  const addressSub = org?.address_sub ?? (isJKC ? 'TE Building, 3rd Floor, Akishima-shi, Tokyo' : 'Update in Mission Control');
  const googleMapsEmbedUrl = org?.google_maps_embed_url ?? (isJKC ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.567!2d139.3539!3d35.7059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6019144e82b3e6d1%3A0x1!2z5p2x5Lqs6YO95Lit5aSu5biC5YGL5Yqb5YS_77yS5LiB55uu77yR4oiS77yW!5e0!3m2!1sja!2sjp!4v1" : "");
  const googleMapsUrl = org?.google_maps_url ?? (isJKC ? "https://www.google.com/maps?q=Japan+Kingdom+Church+TE+Building+Akishima+Tokyo" : "#");
  const calendlyUrl = org?.calendly_url ?? (isJKC ? "https://calendly.com/visitjkc/service" : null);

  const directions = [
    {
      icon: <Train className="w-5 h-5" />,
      title: "By Train",
      desc: org?.directions_train ?? (isJKC ? "2 min walk from Akishima Station (West Gate exit)" : "Check local transit")
    },
    {
      icon: <Car className="w-5 h-5" />,
      title: "By Car",
      desc: org?.directions_car ?? (isJKC ? "Free parking directly beside the church (<1 min walk)" : "Parking available nearby")
    }
  ];

  return (
    <section data-section="directions" className="py-32 px-6 max-w-screen-xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 items-stretch">
        {/* Left — Google Maps embed */}
        <div className="rounded-[3rem] overflow-hidden aspect-video md:aspect-auto h-full min-h-[400px] shadow-2xl relative border"
             style={{ borderColor: 'var(--border)' }}>
          {googleMapsEmbedUrl ? (
            <iframe
              src={googleMapsEmbedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Church Location"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
              Map Location Not Set
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[3rem]" />
        </div>

        {/* Right — Info */}
        <div className="flex flex-col justify-center space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--jkc-navy)' }}>
              DIRECTIONS & PARKING
            </p>
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black" 
                  style={{ color: 'var(--foreground)' }}>Find Your Way</h2>
              <div className="flex items-start gap-4 pt-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                     style={{ 
                       background: 'var(--jkc-navy)',
                       borderColor: 'var(--border)' 
                     }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{address}</p>
                  <p style={{ color: 'var(--muted-foreground)' }}>{addressSub}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {directions.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-center group">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border"
                     style={{ 
                       background: 'var(--card)',
                       borderColor: 'var(--border)'
                     }}>
                  <div style={{ color: 'var(--jkc-gold)' }}>
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest uppercase mb-1"
                      style={{ color: 'var(--muted-foreground)' }}>{item.title}</h4>
                  <p className="font-medium" 
                     style={{ color: 'var(--foreground)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-4 rounded-full px-10 py-5 text-sm font-black tracking-[0.2em] transition-all w-full md:w-auto justify-center md:justify-start ${googleMapsUrl === '#' ? 'opacity-30 pointer-events-none' : ''}`}
              style={{
                background: 'var(--jkc-navy)',
                color: 'white',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              GET DIRECTIONS <ArrowRight className="w-4 h-4" />
            </a>
            
            {calendlyUrl && (
              <a
                href={calendlyUrl}
                target="_blank"
                className="inline-flex items-center gap-4 border-2 rounded-full px-10 py-5 text-sm font-black tracking-[0.2em] transition-all w-full md:w-auto justify-center md:justify-start"
                style={{
                  borderColor: 'var(--jkc-gold)',
                  color: 'var(--jkc-navy)',
                }}
              >
                PLAN A VISIT
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
