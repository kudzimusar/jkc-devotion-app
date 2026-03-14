'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, description, location')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(3);

        if (error) throw error;
        setEvents(data || []);
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
        <p className="text-[10px] font-black tracking-[0.3em] text-[var(--primary)] opacity-60 uppercase">
          Upcoming Events
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white/90">
          What's <span className="font-serif italic font-medium">Happening</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {events.map((event) => (
          <div 
            key={event.id}
            className="glass rounded-[2.5rem] p-10 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black tracking-[0.2em] text-[var(--primary)] opacity-80 uppercase">
                  {format(parseISO(event.date), 'MMM dd')}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white/90 group-hover:text-[var(--primary)] transition-colors">
                  {event.title}
                </h3>
                
                {event.location && (
                  <div className="flex items-center gap-2 text-white/40">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">{event.location}</span>
                  </div>
                )}
                
                {event.description && (
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-2 italic">
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-8">
              <div className="h-px w-full bg-white/5 mb-6" />
              <button className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase group-hover:text-[var(--primary)] transition-colors">
                LEARN MORE →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
