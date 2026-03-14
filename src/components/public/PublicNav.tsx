'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'WATCH', href: '/welcome/watch' },
    { label: 'VISIT', href: '/welcome/visit' },
    { label: 'GIVE', href: '/welcome/give' },
  ];

  const mobileNavLinks = [
    ...navLinks,
    { label: 'ABOUT', href: '/welcome/about' },
    { label: 'OUR PASTOR', href: '/welcome/our-pastor' },
    { label: 'STAFF', href: '/welcome/staff' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Left side: Logo */}
          <Link href="/welcome">
            <img 
              src="/jkc-devotion-app/church-logo.png" 
              alt="JKC" 
              className="h-8 w-auto hover:opacity-80 transition-opacity" 
            />
          </Link>

          {/* Center (desktop only) */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="text-xs font-black tracking-[0.2em] text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side (desktop) */}
          <div className="hidden md:block">
            <Link 
              href="/"
              className="border border-white/30 text-white/70 hover:text-white hover:border-white/60 rounded-full px-5 py-1.5 text-xs font-black tracking-widest transition-all"
            >
              SIGN IN
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white/70 hover:text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={32} />
          </button>
          
          <img 
            src="/jkc-devotion-app/church-logo.png" 
            alt="JKC" 
            className="h-12 w-auto mb-8" 
          />

          {mobileNavLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href}
              className="text-2xl font-black tracking-[0.2em] text-white/70 hover:text-white transition-colors uppercase"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          <Link 
            href="/"
            className="border border-white/30 text-white/70 hover:text-white hover:border-white/60 rounded-full px-8 py-3 text-sm font-black tracking-widest transition-all mt-4"
            onClick={() => setIsMenuOpen(false)}
          >
            SIGN IN
          </Link>
        </div>
      )}
    </>
  );
}
