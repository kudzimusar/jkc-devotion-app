'use client';

import Link from 'next/link';
import { ChevronLeft, Heart, MapPin, Calendar, Users } from 'lucide-react';

const outreachPrograms = [
  {
    slug: 'toyoko-youth-outreach',
    name: 'Toyoko Youth Outreach',
    tagline: 'Breaking the cycle of poverty and exploitation',
    description: 'Aiming to break the cycle of poverty and exploitation, TYO brings hope and a brighter future to youth living on the streets. Our ministry outreach to the youth in Kabukicho, Shinjuku, focuses on providing support and guidance to those in need. Kabukicho, often referred to as Tokyo\'s red-light district, is a bustling area known for its nightlife. Unfortunately, it is also a hotspot for youth homelessness.',
    location: 'Kabukicho, Shinjuku',
    frequency: 'Monthly',
    image: '/jkc-devotion-app/images/outreach_toyoko.png',
    color: '#8B5CF6',
    signupUrl: 'https://www.japankingdomchurch.com/contact',
    donateUrl: 'https://www.japankingdomchurch.com/give',
  },
  {
    slug: 'akiramenai',
    name: 'Akiramenai (Don\'t Give Up)',
    tagline: 'Reaching Tokyo\'s homeless with love and provision',
    description: 'Akiramenai means "Don\'t Give Up" in Japanese. At Akiramenai, we provide outreach to Tokyo\'s homeless population by offering food, care, and shelter. Tokyo\'s homeless population is significant, encompassing both the young and the elderly. Jesus said, "Do not forget the poor" (Hebrews 13:16). Join us each month as we reach out to Tokyo\'s homeless, providing daily necessities, food, and friendship.',
    location: 'Shinjuku & Tama Riverside',
    frequency: 'Every 3rd Saturday',
    image: '/jkc-devotion-app/images/outreach_akiramenai.png',
    color: '#EF4444',
    signupUrl: 'https://form.jotform.me/81070224484451',
    donateUrl: 'https://www.japankingdomchurch.com/give',
    moreInfo: 'https://www.jpkb.org/akiramenai',
  },
  {
    slug: 'food-pantry',
    name: 'The Food Pantry',
    tagline: 'Providing nourishment to families in need',
    description: 'The Food Pantry Ministry is dedicated to combating hunger in Tokyo by providing essential nourishment to single mothers and low-income families. At Japan Kingdom Church, our food pantry is a vital resource for single mothers and their children, foreigners in need of food assistance, and the homeless. We ensure our pantry is stocked with relevant and nutritious food items.',
    location: 'Japan Kingdom Church, Akishima',
    frequency: 'When church doors are open',
    image: '/jkc-devotion-app/images/ministry_foodpantry_card.png',
    color: '#F59E0B',
    signupUrl: 'https://www.japankingdomchurch.com/contact',
    donateUrl: 'https://www.japankingdomchurch.com/give',
  },
  {
    slug: 'street-evangelism',
    name: 'Street Evangelism',
    tagline: 'Taking the gospel into the streets of Tokyo',
    description: 'Taking the gospel of Christ outside the 4 walls of the church and into the streets of Tokyo! At our street outreach, we bring the church to the people! If you enjoy singing, playing an instrument, having friendly conversations, or helping with organization and logistics, then street outreach is for you. Jesus said, "Go out and share the gospel" (Mark 16:15). Japan needs the seeds of the gospel message.',
    location: 'Streets of Tokyo',
    frequency: 'TBD',
    image: '/jkc-devotion-app/images/outreach_street_evangelism.png',
    color: '#10B981',
    signupUrl: 'https://www.japankingdomchurch.com/contact',
    donateUrl: 'https://www.japankingdomchurch.com/give',
  },
];

export default function OutreachPage() {
  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="relative py-40 px-6 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/jkc-devotion-app/images/outreach_akiramenai.png"
            alt="JKC Outreach"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase hover:text-[var(--jkc-gold)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO HOME
          </Link>
          <p className="text-[10px] font-black tracking-[0.5em] uppercase" style={{ color: 'var(--jkc-gold)' }}>
            GET INVOLVED
          </p>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white">
            Outreach
          </h1>
          <div className="w-24 h-1 mx-auto" style={{ background: 'var(--jkc-gold)' }} />
          <p className="text-xl text-slate-300 font-medium italic leading-relaxed max-w-2xl mx-auto">
            We believe the church exists for the world, not just for itself. These are our active outreach programs in Tokyo.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 px-6 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {outreachPrograms.map((program) => (
            <div
              key={program.slug}
              className="group rounded-[2.5rem] overflow-hidden border transition-all duration-300 hover:-translate-y-2"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={program.image}
                  alt={program.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                {/* Color accent tag */}
                <div
                  className="absolute top-6 left-6 px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase text-white"
                  style={{ background: program.color }}
                >
                  OUTREACH MINISTRY
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black leading-tight" style={{ color: 'var(--foreground)' }}>
                    {program.name}
                  </h2>
                  <p className="font-medium italic" style={{ color: program.color }}>
                    {program.tagline}
                  </p>
                </div>

                <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--muted-foreground)' }}>
                  {program.description}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: program.color }} />
                    {program.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: program.color }} />
                    {program.frequency}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href={`/welcome/outreach/${program.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white transition-all hover:scale-105"
                    style={{ background: 'var(--jkc-navy)' }}
                  >
                    LEARN MORE →
                  </Link>
                  <a
                    href={program.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:scale-105 border"
                    style={{ borderColor: program.color, color: program.color }}
                  >
                    <Users className="w-3 h-3" /> VOLUNTEER
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center space-y-6 py-16 rounded-[3rem] border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(245,166,35,0.1)' }}>
            <Heart className="w-8 h-8" style={{ color: 'var(--jkc-gold)' }} />
          </div>
          <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
            Want to make a difference?
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Every volunteer, every donation, and every prayer makes an eternal impact on the people of Japan. 
            Join us in taking the love of Christ to our city.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.japankingdomchurch.com/give"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase text-white transition-all hover:scale-105"
              style={{ background: 'var(--jkc-gold)', color: 'var(--jkc-navy)' }}
            >
              GIVE NOW
            </a>
            <Link
              href="/welcome/visit"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase transition-all hover:scale-105 border"
              style={{ borderColor: 'var(--jkc-navy)', color: 'var(--jkc-navy)' }}
            >
              VISIT US
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
