'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, Settings, LogOut, BookOpen,
         ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@/lib/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'sonner';

import { usePublicTheme } from './PublicThemeWrapper';

export default function PublicNav() {
  const { isDark } = usePublicTheme();
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
    { label: 'DEVOTION', href: '/' },
  ];

  const mobileNavLinks = [
    ...navLinks,
    { label: 'ABOUT', href: '/welcome/about' },
    { label: 'OUR PASTOR', href: '/welcome/our-pastor' },
    { label: 'STAFF', href: '/welcome/staff' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 h-16 transition-all"
           style={{ 
             background: 'var(--nav-bg)', 
             borderBottom: '1px solid var(--nav-border)' 
           }}>
        <div className="max-w-screen-xl mx-auto px-6 h-full flex
                        items-center justify-between">

          <Link href="/welcome" className="hover:opacity-80 transition-opacity">
            <img
              src="/jkc-devotion-app/images/logo-horizontal.png"
              alt="Japan Kingdom Church"
              className="h-8 w-auto"
              style={{ filter: isDark ? 'none' : 'brightness(0) saturate(100%) invert(18%) sepia(21%) font-black(33%)' }}
            />
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href}
                className="text-[10px] font-black tracking-[0.3em] hover:text-[var(--jkc-navy)] transition-colors flex items-center gap-1.5"
                style={{ color: link.label === 'DEVOTION' ? 'var(--jkc-gold)' : 'var(--foreground)' }}>
                {link.label === 'DEVOTION' && <BookOpen className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right — auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
                  style={{ 
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                       style={{ background: 'var(--jkc-navy)', color: 'var(--jkc-gold)' }}>
                    {getInitials(user.name || '')}
                  </div>
                  <span className="text-xs font-bold max-w-[100px] truncate"
                        style={{ color: 'var(--foreground)' }}>
                    {user.name?.split(' ')[0] || 'Member'}
                  </span>
                  <ChevronDown className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-2xl z-[200]"
                       style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-xl)' }}>
                    <Link href="/"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <BookOpen className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      Devotion App
                    </Link>
                    <Link href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <User className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      My Profile
                    </Link>
                    <Link href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <Settings className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      Settings
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-all border-t"
                      style={{ borderColor: 'var(--border)' }}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-full px-6 py-2 text-[10px] font-black tracking-widest transition-all"
                style={{
                  background: 'var(--jkc-navy)',
                  color: 'var(--primary-foreground)',
                  border: '1px solid var(--jkc-navy)'
                }}
              >
                SIGN IN
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 transition-colors"
            style={{ color: 'var(--foreground)' }}
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
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300"
             style={{ background: 'var(--footer-bg)' }}>
          <button className="absolute top-6 right-6"
            style={{ color: 'var(--footer-muted)' }}
            onClick={() => setIsMenuOpen(false)}>
            <X size={32} />
          </button>

          <img
            src="/jkc-devotion-app/images/logo-horizontal.png"
            alt="Japan Kingdom Church"
            className="h-10 w-auto mb-12"
            style={{ filter: 'brightness(10)' }}
          />

          {mobileNavLinks.map(link => (
            <Link key={link.label} href={link.href}
              className="text-2xl font-black tracking-[0.2em] transition-colors uppercase"
              style={{ color: link.label === 'DEVOTION' ? 'var(--jkc-gold)' : 'var(--footer-fg)' }}
              onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          ))}

          <div className="pt-12 w-full max-w-[280px]">
            {user ? (
              <div className="flex flex-col gap-6 items-center">
                <Link href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs font-black tracking-widest uppercase"
                  style={{ color: 'var(--footer-fg)' }}>
                  MY PROFILE
                </Link>
                <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  className="text-xs font-black tracking-widest uppercase text-red-400">
                  SIGN OUT
                </button>
              </div>
            ) : (
                <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full border rounded-full py-5 text-xs font-black tracking-widest transition-all"
                style={{ 
                  background: 'var(--muted)',
                  borderColor: 'var(--border)',
                  color: 'white'
                }}
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
