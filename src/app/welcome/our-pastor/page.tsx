
'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight, Quote, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function OurPastorPage() {
  const books = [
    {
      title: "Power of Purpose",
      src: "/jkc-devotion-app/images/books/book-power-of-purpose.png",
      link: "https://a.co/d/0hKjjYn1",
      desc: "Discovering why you are here and where you are going."
    },
    {
      title: "A Miraculous Encounter",
      src: "/jkc-devotion-app/images/books/book-miraculous-encounter.webp",
      link: "https://a.co/d/0eXyvya6",
      desc: "A true story of how God intervened in the most unlikely place."
    },
    {
      title: "The Reason I'm Black",
      src: "/jkc-devotion-app/images/books/book-why-i-am-black.png",
      link: "https://a.co/d/00mPTRES",
      desc: "Navigating identity, race, and grace in a global context."
    },
    {
      title: "The Ultimate Love Challenge",
      src: "/jkc-devotion-app/images/books/book-love-challenge.jpg",
      link: "https://form.jotform.com/202568624678467",
      desc: "A guide to building radical and Christ-centered relationships."
    }
  ];

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--background)' }}>
      {/* 1. HERO: BOLD & EDITORIAL */}
      <section className="relative min-h-[60vh] md:h-[90vh] flex items-center overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute right-0 top-0 w-[40%] md:w-1/2 h-full opacity-40 md:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-950 md:via-transparent to-transparent z-10" />
            <img 
                src="/jkc-devotion-app/images/pastor/pastor-profile.png" 
                className="w-full h-full object-cover object-top grayscale-[0.2] contrast-125"
                alt="Pastor Marcel"
            />
        </div>

        <div className="max-w-screen-xl mx-auto px-6 w-full relative z-20 py-12">
          <div className="max-w-2xl space-y-4 md:space-y-8">
            <Link 
              href="/welcome/about" 
              className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase hover:translate-x-[-4px] transition-transform"
              style={{ color: 'var(--jkc-gold)' }}
            >
              <ChevronLeft className="w-4 h-4" /> Back to About
            </Link>
            
            <div className="space-y-2 md:space-y-4">
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] text-slate-900 dark:text-white">
                PASTOR <br/>
                <span style={{ color: 'var(--jkc-navy)' }}>MARCEL</span>
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl font-serif italic text-slate-500 dark:text-slate-400">
                Author, CEO, and Visionary Leader.
              </p>
            </div>

            <p className="text-base sm:text-xl md:text-2xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium max-w-sm sm:max-w-md md:max-w-none">
              A man with a mission to bridge cultures and transform lives through the power of purpose and Christ's love.
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE JOURNEY: MIXED LAYOUT */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-12">
                <div className="space-y-4">
                    <p className="text-[10px] font-black tracking-[0.5em] text-[var(--jkc-gold)] uppercase">THE ORIGIN STORY</p>
                    <h2 className="text-4xl md:text-6xl font-black italic text-slate-900 dark:text-white">From Germany to Tokyo.</h2>
                </div>
                
                <div className="space-y-6 text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    <p>
                        Born in Kamp Lintford, Germany, Marcel's life was defined by the movement and discipline of a military family. In 1999, he arrived in Japan as a "military brat," initially apprehensive about his place in such a vastly different culture.
                    </p>
                    <p>
                        Far from retreating, Marcel chose to immerse himself. He began working at a 7-Eleven in Tokyo—a humble start that became his greatest classroom. It was here he began to learn not just the language, but the heart of the Japanese people.
                    </p>
                </div>
            </div>

            <div className="lg:col-span-7 relative">
                <div className="rounded-[4rem] overflow-hidden rotate-2 shadow-2xl border-b-8 border-r-8 border-[var(--jkc-navy)]">
                   <img src="/jkc-devotion-app/images/pastor/pastor-event.jpg" className="w-full aspect-video object-cover" alt="Marcel Preaching" />
                </div>
                <div className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-xs space-y-4 border border-[var(--jkc-gold)]">
                   <Quote className="w-10 h-10 text-[var(--jkc-navy)]" />
                   <p className="text-lg font-bold italic leading-snug">"Purpose is the only thing that gives life its true north."</p>
                </div>
            </div>
        </div>
      </section>

      {/* 3. SHINJUKU STREETS & THE CALL */}
      <section className="py-32 px-6" style={{ background: 'var(--jkc-navy)' }}>
         <div className="max-w-screen-xl mx-auto space-y-16">
            <div className="text-center space-y-6">
                <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter">THE CALLING</h2>
                <div className="w-20 h-2 bg-[var(--jkc-gold)] mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 space-y-6">
                   <div className="w-12 h-12 rounded-full bg-[var(--jkc-gold)] flex items-center justify-center text-white font-black">1</div>
                   <h3 className="text-2xl font-black text-white italic">Street Evangelism</h3>
                   <p className="text-white/70 text-lg leading-relaxed">
                     Fluent in Japanese and fueled by faith, Marcel took to the streets of Shinjuku. His pulpit was the sidewalk, and his audience was the bustling world of Tokyo.
                   </p>
                </div>

                <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 space-y-6">
                   <div className="w-12 h-12 rounded-full bg-[var(--jkc-gold)] flex items-center justify-center text-white font-black">2</div>
                   <h3 className="text-2xl font-black text-white italic">Divine Partnership</h3>
                   <p className="text-white/70 text-lg leading-relaxed">
                     During his journey, he met Chiaki. Despite social and cultural hurdles, their love story became part of the foundation of what would become Japan Kingdom Church.
                   </p>
                </div>

                <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 space-y-6">
                   <div className="w-12 h-12 rounded-full bg-[var(--jkc-gold)] flex items-center justify-center text-white font-black">3</div>
                   <h3 className="text-2xl font-black text-white italic">Founding JKC</h3>
                   <p className="text-white/70 text-lg leading-relaxed">
                     At just 29, Marcel and Chiaki founded JKC in Fussa. Today, he leads a thriving international community and oversees numerous outreach programs.
                   </p>
                </div>
            </div>
         </div>
      </section>

      {/* 4. THE AUTHOR: LITERARY WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-screen-xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
               <p className="text-[10px] font-black tracking-[0.5em] text-[var(--jkc-navy)] uppercase">LITERARY LEGACY</p>
               <h2 className="text-5xl md:text-7xl font-black italic text-slate-900 dark:text-white leading-none">Books by Marcel.</h2>
            </div>
            <div className="max-w-md text-slate-500 font-medium">
               Pastor Marcel's wisdom extends beyond the pulpit. His books have reached thousands of readers around the globe seeking purpose and spiritual growth.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-6">
            {books.map((book, idx) => (
              <div key={idx} className="group space-y-4 max-w-[160px] mx-auto md:max-w-none">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl transition-all duration-700 group-hover:scale-105 group-hover:-rotate-2 border border-black/5 dark:border-white/5">
                   <img src={book.src} className="w-full h-full object-cover" alt={book.title} />
                </div>
                <div className="space-y-2 text-center md:text-left">
                   <h3 className="text-sm md:text-base font-black italic uppercase text-slate-900 dark:text-white leading-tight">{book.title}</h3>
                   <p className="text-slate-500 font-medium text-[10px] md:text-xs line-clamp-2 md:line-clamp-none">{book.desc}</p>
                   <a 
                     href={book.link}
                     target="_blank"
                     className="inline-flex items-center gap-1.5 text-[8px] md:text-[10px] font-black tracking-widest text-[var(--jkc-gold)] hover:text-[var(--jkc-navy)] uppercase transition-colors"
                   >
                     GET ON AMAZON <ArrowRight className="w-2.5 md:w-3 h-2.5 md:h-3" />
                   </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA: CONNECT */}
      <section className="py-24 px-6 md:px-0">
         <div className="max-w-screen-xl mx-auto h-[400px] rounded-[5rem] overflow-hidden relative group">
            <img 
               src="/jkc-devotion-app/images/church/building-banner.png" 
               className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 brightness-50 group-hover:scale-110 transition-transform duration-1000" 
               alt="Church"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--jkc-navy)]/80 to-[var(--jkc-navy)]/40 flex flex-col items-center justify-center text-center p-12 space-y-8">
               <h2 className="text-4xl md:text-7xl font-black italic text-white leading-tight">
                  Connect with Pastor Marcel.
               </h2>
               <div className="flex flex-wrap justify-center gap-6">
                 <Link href="/welcome/visit" className="px-12 py-5 bg-[var(--jkc-gold)] text-white font-black text-xs tracking-widest uppercase rounded-full hover:scale-105 transition-transform">
                    Visit JKC
                 </Link>
                 <Link href="/welcome/give" className="px-12 py-5 bg-white text-[var(--jkc-navy)] font-black text-xs tracking-widest uppercase rounded-full hover:scale-105 transition-transform">
                    Give to Ministry
                 </Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
