'use client';

import { MapPin, Mail, Phone, Globe, Youtube, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { basePath as BP } from '@/lib/utils';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black/40 border-t border-white/10 pt-20 pb-12 relative z-10 backdrop-blur-xl">
      <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
        {/* Column 1: Brand */}
        <div className="space-y-6">
          <img 
            src="/jkc-devotion-app/church-logo.png" 
            alt="JKC Logo" 
            className="h-12 w-auto opacity-80" 
          />
          <div className="space-y-2">
            <h4 className="font-serif text-2xl font-black">Japan Kingdom Church</h4>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed font-medium">
              Equipping believers for transformation and raising disciples for Christ in Japan.
            </p>
          </div>
          <div className="flex gap-4 pt-2">
            <a href="https://www.youtube.com/@japankingdomchurch" target="_blank" className="text-white/40 hover:text-[var(--primary)] transition-colors">
              <Youtube size={20} />
            </a>
            <a href="https://www.facebook.com/japankingdomchurch" target="_blank" className="text-white/40 hover:text-[var(--primary)] transition-colors">
              <Facebook size={20} />
            </a>
            <a href="https://www.instagram.com/jkctokyo" target="_blank" className="text-white/40 hover:text-[var(--primary)] transition-colors">
              <Instagram size={20} />
            </a>
            <a href="http://twitter.com/jkctokyo" target="_blank" className="text-white/40 hover:text-[var(--primary)] transition-colors">
              <Twitter size={20} />
            </a>
            <a href="http://tiktok.com/@jkctokyo" target="_blank" className="text-white/40 hover:text-[var(--primary)] transition-colors flex items-center">
              <span className="text-[10px] font-black">TIKTOK</span>
            </a>
          </div>
        </div>

        {/* Column 2: Contact & Location */}
        <div className="space-y-8">
          <h5 className="font-black uppercase tracking-[0.2em] text-[10px] text-white/40">Contact & Location</h5>
          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[var(--primary)]/30 transition-colors">
                <MapPin className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="text-sm space-y-1">
                <p className="text-white/90 font-bold">〒196-0015 東京都昭島市昭和町2-1-6</p>
                <p className="text-white/60">TE Bldg. 3F, Akishima-shi, Tokyo</p>
              </div>
            </div>
            
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[var(--primary)]/30 transition-colors">
                <Mail className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="text-sm space-y-1">
                <p className="text-white/90 font-bold">jkc.contact@gmail.com</p>
                <p className="text-white/60">Email us anytime</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[var(--primary)]/30 transition-colors">
                <Phone className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="text-sm space-y-1">
                <p className="text-white/90 font-bold">042-519-4940</p>
                <p className="text-white/60">Office Hours: Tue-Sun</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Quick Links */}
        <div className="space-y-8">
          <h5 className="font-black uppercase tracking-[0.2em] text-[10px] text-white/40">Quick Links</h5>
          <div className="flex flex-col gap-4 text-sm font-bold">
            <a href="https://japankingdomchurch.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[var(--primary)] transition-colors flex items-center justify-between group">
              <span>Church Website</span>
              <Globe className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <Link href={`${BP}/welcome/about`} className="text-white/60 hover:text-[var(--primary)] transition-colors">About Us</Link>
            <Link href={`${BP}/welcome/our-pastor`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Our Pastor</Link>
            <Link href={`${BP}/welcome/staff`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Leadership & Staff</Link>
            <Link href={`${BP}/welcome/watch`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Watch</Link>
            <Link href={`${BP}/welcome/visit`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Visit</Link>
            <Link href={`${BP}/welcome/give`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Give</Link>
            
            <a href="#" className="text-white/60 hover:text-[var(--primary)] transition-colors pt-2 border-t border-white/5 opacity-40">Privacy Policy</a>
            <a href="#" className="text-white/60 hover:text-[var(--primary)] transition-colors opacity-40">Terms of Service</a>
            
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Internal</p>
              <Link href={`${BP}/`} className="text-white/60 hover:text-[var(--primary)] transition-colors">Client Login</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
        <p>© {currentYear} Japan Kingdom Builders, Inc.</p>
        <p>REPRESENTING CHRIST TO JAPANESE SOCIETY</p>
      </div>
    </footer>
  );
}
