'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePublicTheme } from './PublicThemeWrapper';

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

        if (error) throw error;
        
        // Map to internal UI names for consistency
        const mappedData = (data || []).map(e => ({
          id: e.id,
          title: e.name,
          date: e.event_date,
          description: e.description,
          location: e.location
        }));
        setEvents(mappedData);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section className="py-20 px-6 max-w-screen-xl mx-auto">
      <div className="space-y-4 mb-12">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase"
           style={{ color: 'var(--jkc-navy)' }}>
          Upcoming Events
        </p>
        <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--foreground)' }}>
          What's <span className="font-serif italic font-medium">Happening</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {events.map((event) => (
          <div 
            key={event.id}
            className="rounded-[2.5rem] p-10 transition-all group flex flex-col justify-between border"
            style={{
               background: 'var(--card)',
               borderColor: 'var(--border)',
               boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                     style={{ background: 'var(--jkc-navy)', borderColor: 'var(--border)' }}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-[10px] font-black tracking-[0.2em] uppercase"
                     style={{ color: 'var(--jkc-gold)' }}>
                  {format(parseISO(event.date), 'MMM dd')}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black transition-colors"
                    style={{ color: 'var(--foreground)' }}>
                  {event.title}
                </h3>
                
                {event.location && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">{event.location}</span>
                  </div>
                )}
                
                {event.description && (
                  <p className="text-sm leading-relaxed line-clamp-2 italic"
                     style={{ color: 'var(--muted-foreground)' }}>
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-8">
              <div className="h-px w-full mb-6" style={{ background: 'var(--border)' }} />
              <button className="text-[10px] font-black tracking-[0.3em] uppercase transition-colors"
                      style={{ color: 'var(--jkc-navy)' }}>
                LEARN MORE →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
