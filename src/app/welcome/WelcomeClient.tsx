
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@/lib/auth';
import HeroSection from '@/components/public/HeroSection';
import MissionStrip from '@/components/public/MissionStrip';
import SermonSection from '@/components/public/SermonSection';
import NewHereSection from '@/components/public/NewHereSection';
import SundayCheckIn from '@/components/public/SundayCheckIn';
import EventsSection from '@/components/public/EventsSection';
import ServiceSchedule from '@/components/public/ServiceSchedule';
import DirectionsSection from '@/components/public/DirectionsSection';
import ConnectSection from '@/components/public/ConnectSection';
import { FeedSection } from '@/components/feed/FeedSection';
import MinistriesSection from '@/components/public/MinistriesSection';
import TestimoniesSection from '@/components/public/TestimoniesSection';
import { GlobalAIAssistant } from '@/components/layout/GlobalAIAssistant';

import { motion } from 'framer-motion';

const FadeInSection = ({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default function WelcomeClient() {
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    Auth.getCurrentUser().then(setUser);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          const u = await Auth.getCurrentUser();
          setUser(u);
        } else {
          setUser(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="overflow-x-hidden pt-16">
      <HeroSection />
      
      <FadeInSection>
        <MissionStrip />
      </FadeInSection>
      
      {user?.id && (
        <section className="bg-black/20 border-y border-white/5 py-12">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-8 ml-4">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <span className="text-xs font-black">FEED</span>
              </div>
              <h2 className="text-2xl font-black italic">Church Announcements</h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <FeedSection />
            </div>
          </div>
        </section>
      )}

      <SundayCheckIn user={user} currentDate={currentDate} />
      
      <FadeInSection delay={0.1}>
        <SermonSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <TestimoniesSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <NewHereSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <MinistriesSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <EventsSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <ServiceSchedule />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <DirectionsSection />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <ConnectSection />
      </FadeInSection>

      <GlobalAIAssistant
        user={user}
        userRole={null}
        currentPage="welcome"
        stats={null}
        devotion={null}
      />
    </div>
  );
}
