'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePublicTheme } from './PublicThemeWrapper';

/* Static fallback so the section is never blank */
const FALLBACK_EVENTS = [
  {
    id: 'f1',
    title: 'Sunday Morning Service',
    date: new Date().toISOString().split('T')[0],
    description: 'Join us every Sunday for worship, prayer and the Word of God.',
    location: 'TE Bldg. 3F — Akishima, Tokyo',
  },
  {
    id: 'f2',
    title: 'Prayer Meeting',
    date: new Date().toISOString().split('T')[0],
    description: 'Corporate prayer from 9:30 AM before the main service.',
    location: 'TE Bldg. 3F — Akishima, Tokyo',
  },
];

export default function EventsSection() {
  const { isDark } = usePublicTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name, event_date, description, location')
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(3);

        if (error) {
          // Silently fall back — events table may not exist yet
          setEvents(FALLBACK_EVENTS);
          return;
        }

        const mappedData = (data || []).map(e => ({
          id: e.id,
          title: e.name,
          date: e.event_date,
          description: e.description,
          location: e.location
        }));

        setEvents(mappedData.length > 0 ? mappedData : FALLBACK_EVENTS);
      } catch {
        // Silently serve fallbacks
        setEvents(FALLBACK_EVENTS);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) return null;

  return (
    <section className="py-24 px-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-3 mb-12">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase"
             style={{ color: 'var(--jkc-gold)' }}>
            Upcoming Events
          </p>
          <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
            What's <span className="font-serif italic font-medium" style={{ color: 'var(--jkc-navy)' }}>Happening</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 group"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
              }}
            >
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: 'var(--jkc-navy)' }}>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] font-black tracking-[0.2em] uppercase"
                       style={{ color: 'var(--jkc-gold)' }}>
                    {format(parseISO(event.date), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black leading-tight"
                      style={{ color: 'var(--foreground)' }}>
                    {event.title}
                  </h3>

                  {event.location && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-semibold">{event.location}</span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm leading-relaxed line-clamp-2"
                       style={{ color: 'var(--muted-foreground)' }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
                <button
                  className="text-[10px] font-black tracking-[0.3em] uppercase inline-flex items-center gap-1.5 group-hover:gap-3 transition-all"
                  style={{ color: 'var(--jkc-navy)' }}
                >
                  LEARN MORE →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
