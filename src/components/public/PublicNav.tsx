'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, Settings, LogOut, BookOpen,
         ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@/lib/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'sonner';

export default function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsDropdownOpen(false);
    toast.success('Signed out successfully');
  };

  const getInitials = (name: string) => {
    if (!name) return 'JK';
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  };

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
      <nav className="fixed top-0 w-full z-50 h-16 bg-black/80
                      backdrop-blur-xl border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 h-full flex
                        items-center justify-between">

          {/* Logo */}
          <Link href="/welcome">
            <img
              src="/jkc-devotion-app/images/logo-horizontal.png"
              alt="Japan Kingdom Church"
              className="h-8 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href}
                className="text-xs font-black tracking-[0.2em]
                           text-white/70 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            {user && (
              <Link href="/"
                className="text-xs font-black tracking-[0.2em]
                           text-[var(--primary)] hover:text-white
                           transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                DEVOTION
              </Link>
            )}
          </div>

          {/* Desktop right — auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center gap-2 glass rounded-full
                             px-3 py-1.5 border border-white/20
                             hover:border-white/40 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)]
                                  flex items-center justify-center
                                  text-white text-[10px] font-black">
                    {getInitials(user.name || '')}
                  </div>
                  <span className="text-xs font-bold text-white/80
                                   max-w-[100px] truncate">
                    {user.name?.split(' ')[0] || 'Member'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48
                                  bg-black/90 backdrop-blur-xl border
                                  border-white/10 rounded-2xl overflow-hidden
                                  shadow-2xl z-[200]">
                    <Link href="/"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3
                                 text-xs font-bold text-white/70
                                 hover:text-white hover:bg-white/5
                                 transition-all">
                      <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                      Devotion App
                    </Link>
                    <Link href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3
                                 text-xs font-bold text-white/70
                                 hover:text-white hover:bg-white/5
                                 transition-all">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      My Profile
                    </Link>
                    <Link href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3
                                 text-xs font-bold text-white/70
                                 hover:text-white hover:bg-white/5
                                 transition-all">
                      <Settings className="w-4 h-4 text-[var(--primary)]" />
                      Settings
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 text-xs font-bold text-red-400
                                 hover:bg-red-500/10 transition-all
                                 border-t border-white/5">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="border border-white/30 text-white/70
                           hover:text-white hover:border-white/60
                           rounded-full px-5 py-1.5 text-xs font-black
                           tracking-widest transition-all">
                SIGN IN
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white/70 hover:text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Auth Modal — opens on /welcome without redirect */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          setIsAuthModalOpen(false);
        }}
        onEmailNotConfirmed={() => {}}
      />

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col
                        items-center justify-center space-y-6
                        animate-in fade-in zoom-in duration-300">
          <button className="absolute top-6 right-6 text-white/70
                             hover:text-white"
            onClick={() => setIsMenuOpen(false)}>
            <X size={32} />
          </button>

          <img
            src="/jkc-devotion-app/images/logo-horizontal.png"
            alt="Japan Kingdom Church"
            className="h-10 w-auto mb-4"
          />

          {mobileNavLinks.map(link => (
            <Link key={link.label} href={link.href}
              className="text-2xl font-black tracking-[0.2em]
                         text-white/70 hover:text-white transition-colors
                         uppercase"
              onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link href="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-black tracking-widest
                           text-[var(--primary)] uppercase flex
                           items-center gap-2">
                <BookOpen className="w-5 h-5" /> DEVOTION
              </Link>
              <Link href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-black tracking-widest
                           text-white/70 uppercase">
                MY PROFILE
              </Link>
              <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="text-xl font-black tracking-widest
                           text-red-400 uppercase">
                SIGN OUT
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="border border-white/30 text-white/70
                         hover:text-white rounded-full px-8 py-3
                         text-sm font-black tracking-widest
                         transition-all mt-4">
              SIGN IN
            </button>
          )}
        </div>
      )}
    </>
  );
}
