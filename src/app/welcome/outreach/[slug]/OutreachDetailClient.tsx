'use client';

import Link from 'next/link';
import { ChevronLeft, MapPin, Calendar, Heart, ExternalLink, Users } from 'lucide-react';

const OUTREACH_DATA: Record<string, {
  name: string;
  tagline: string;
  description: string;
  fullDescription: string;
  location: string;
  frequency: string;
  image: string;
  color: string;
  signupUrl: string;
  donateUrl: string;
  moreInfo?: string;
  scripture?: string;
  howToHelp: string[];
}> = {
  'toyoko-youth-outreach': {
    name: 'Toyoko Youth Outreach',
    tagline: 'Breaking the cycle of poverty and exploitation',
    description: 'Aiming to break the cycle of poverty and exploitation, TYO brings hope and a brighter future to youth living on the streets.',
    fullDescription: `Our ministry outreach to the youth in Kabukicho, Shinjuku, focuses on providing support and guidance to those in need. Kabukicho, often referred to as Tokyo's red-light district, is a bustling area known for its nightlife and entertainment. Unfortunately, it is also a hotspot for various social issues, including youth homelessness.

By offering practical assistance and sharing the love of Christ, we strive to make a positive impact on their lives. You can join us in this vital ministry by volunteering your time, donating resources, or providing mentorship. Together, we can bring light to the youth in Kabukicho and help them find a better path forward.`,
    location: 'Kabukicho, Shinjuku',
    frequency: 'Monthly (dates announced)',
    image: '/jkc-devotion-app/images/outreach_toyoko.png',
    color: '#8B5CF6',
    scripture: '"The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor." — Luke 4:18',
    signupUrl: '/welcome/visit',
    donateUrl: '/welcome/give',
    howToHelp: [
      'Volunteer your time during monthly outreach nights',
      'Provide financial support for care packages and meals',
      'Offer mentorship to youth who need guidance',
      'Pray for the youth and the Kabukicho community',
    ],
  },
  'akiramenai': {
    name: 'Akiramenai (Don\'t Give Up)',
    tagline: 'Reaching Tokyo\'s homeless with love and provision',
    description: 'Akiramenai means "Don\'t Give Up" in Japanese. We provide outreach to Tokyo\'s homeless population by offering food, care, and shelter.',
    fullDescription: `Tokyo's homeless population is significant, encompassing both the young and the elderly. Jesus said, "Do not forget the poor" (Hebrews 13:16). Join us each month as we reach out to Tokyo's homeless, providing daily necessities, food, and friendship.

Volunteers come together to create care packs and deliver them to the homeless. Each outreach includes a Japanese interpreter to ensure effective communication. Our team meets at the church and travels together to Shinjuku and the Tama Riverside to distribute care packs and share a warm meal.`,
    location: 'Shinjuku & Tama Riverside, Tokyo',
    frequency: 'Every 3rd Saturday of the month',
    image: '/jkc-devotion-app/images/outreach_akiramenai.png',
    color: '#EF4444',
    scripture: '"Do not forget to do good and to share with others, for with such sacrifices God is pleased." — Hebrews 13:16',
    signupUrl: 'https://form.jotform.me/81070224484451',
    donateUrl: '/welcome/give',
    moreInfo: 'https://www.jpkb.org/akiramenai',
    howToHelp: [
      'Join us every 3rd Saturday for hands-on outreach',
      'Help assemble care packs (hygiene kits, food, blankets)',
      'Donate supplies: non-perishable food, clothing, toiletries',
      'Support with financial donations for resources',
    ],
  },
  'food-pantry': {
    name: 'The Food Pantry',
    tagline: 'Providing nourishment to families in need',
    description: 'The Food Pantry Ministry is dedicated to combating hunger in Tokyo by providing essential nourishment to single mothers and low-income families.',
    fullDescription: `At Japan Kingdom Church, our food pantry is a vital resource for single mothers and their children, foreigners in need of food assistance, and the homeless. We ensure our pantry is stocked with relevant and nutritious food items to meet the diverse needs of our community.

We welcome volunteers to support our mission by donating to the food pantry or helping with food deliveries. Your contributions and time make a significant difference in the lives of those we serve. Join us in this meaningful outreach to provide sustenance and hope to those in need.`,
    location: 'Japan Kingdom Church, 〒196-0015 Akishima, Tokyo',
    frequency: 'When church doors are open',
    image: '/jkc-devotion-app/images/ministry_foodpantry_card.png',
    color: '#F59E0B',
    scripture: '"I was hungry and you gave me food, I was thirsty and you gave me drink." — Matthew 25:35',
    signupUrl: '/welcome/visit',
    donateUrl: '/welcome/give',
    howToHelp: [
      'Donate non-perishable food items to the pantry',
      'Volunteer to help sort and distribute food',
      'Support with financial donations for purchasing supplies',
      'Spread the word to those in your community who are in need',
    ],
  },
  'street-evangelism': {
    name: 'Street Evangelism',
    tagline: 'Taking the gospel into the streets of Tokyo',
    description: 'Taking the gospel of Christ outside the 4 walls of the church and into the streets of Tokyo!',
    fullDescription: `At our street outreach, we bring the church to the people! If you enjoy singing, playing an instrument, having friendly conversations, or helping with organization and logistics, then street outreach is for you.

Jesus said, "Go out and share the gospel" (Mark 16:15). Japan needs the seeds of the gospel message so that a harvest can take place. Be a sower today! Our team uses music, conversation, and practical love to connect with people on the streets of Tokyo and share the life-changing message of Jesus Christ.`,
    location: 'Streets of Tokyo (announced per event)',
    frequency: 'TBD — check the Events Calendar',
    image: '/jkc-devotion-app/images/outreach_street_evangelism.png',
    color: '#10B981',
    scripture: '"Go into all the world and preach the gospel to all creation." — Mark 16:15',
    signupUrl: '/welcome/visit',
    donateUrl: '/welcome/give',
    howToHelp: [
      'Join the team for street outreach events',
      'Share your musical gifts (guitar, voice, etc.)',
      'Engage in friendly conversations with passersby',
      'Help with logistics and organisation on outreach days',
    ],
  },
};

export default function OutreachDetailClient({ slug }: { slug: string }) {
  const program = OUTREACH_DATA[slug];

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 space-y-6" style={{ background: 'var(--background)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--foreground)' }}>Outreach Program Not Found</h1>
        <Link href="/welcome/outreach" className="font-black uppercase tracking-widest" style={{ color: 'var(--jkc-gold)' }}>
          ← Back to Outreach
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <section className="relative py-48 px-6 flex items-center justify-center overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <img
          src={program.image}
          alt={program.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
        <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
          <Link
            href="/welcome/outreach"
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase hover:text-[var(--jkc-gold)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO OUTREACH
          </Link>
          <div
            className="inline-block px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase text-white"
            style={{ background: program.color }}
          >
            OUTREACH MINISTRY
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            {program.name}
          </h1>
          <div className="w-24 h-1 mx-auto" style={{ background: 'var(--jkc-gold)' }} />
          <p className="text-xl text-slate-300 font-medium italic leading-relaxed max-w-2xl mx-auto">
            {program.tagline}
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

          {/* Left: Details */}
          <div className="space-y-10">
            {/* Scripture */}
            {program.scripture && (
              <blockquote
                className="border-l-4 pl-6 py-4 rounded-r-2xl italic text-lg font-medium leading-relaxed"
                style={{ borderColor: program.color, background: 'var(--section-alt)', color: 'var(--foreground)' }}
              >
                {program.scripture}
              </blockquote>
            )}

            <div className="space-y-4">
              <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>About This Outreach</h2>
              <div className="w-12 h-1" style={{ background: 'var(--jkc-navy)' }} />
              {program.fullDescription.split('\n\n').map((para, i) => (
                <p key={i} className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {para}
                </p>
              ))}
            </div>

            {/* Meta Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 border space-y-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <MapPin className="w-5 h-5 mb-1" style={{ color: program.color }} />
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--muted-foreground)' }}>Location</p>
                <p className="font-bold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{program.location}</p>
              </div>
              <div className="rounded-2xl p-6 border space-y-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <Calendar className="w-5 h-5 mb-1" style={{ color: program.color }} />
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--muted-foreground)' }}>Schedule</p>
                <p className="font-bold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{program.frequency}</p>
              </div>
            </div>

            {/* How to Help */}
            <div className="space-y-4">
              <h3 className="text-xl font-black" style={{ color: 'var(--foreground)' }}>How You Can Help</h3>
              <ul className="space-y-3">
                {program.howToHelp.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-black" style={{ background: program.color }}>
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {program.moreInfo && (
              <a
                href={program.moreInfo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: program.color }}
              >
                <ExternalLink className="w-4 h-4" />
                More Information →
              </a>
            )}
          </div>

          {/* Right: Action Panel */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-[2.5rem] p-10 border shadow-xl space-y-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${program.color}20` }}>
                  <Heart className="w-7 h-7" style={{ color: program.color }} />
                </div>
                <h2 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>Get Involved</h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Every volunteer and every donation makes an eternal difference in the lives of people in Tokyo.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={program.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase text-white transition-all hover:scale-105"
                  style={{ background: 'var(--jkc-navy)', boxShadow: '0 8px 24px rgba(27,58,107,0.3)' }}
                >
                  <Users className="w-4 h-4" /> SIGN UP TO VOLUNTEER
                </a>
                <a
                  href={program.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-full text-sm font-black tracking-[0.2em] uppercase transition-all hover:scale-105 border"
                  style={{ borderColor: program.color, color: program.color }}
                >
                  DONATE TO THIS MINISTRY
                </a>
              </div>
            </div>

            {/* All Outreaches link */}
            <Link
              href="/welcome/outreach"
              className="flex items-center gap-2 text-sm font-bold transition-all hover:gap-3"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              View all outreach programs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
