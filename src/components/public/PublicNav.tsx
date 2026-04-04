'use client';
/**
 * CRITICAL COMPONENT: Navigation Bar
 * DO NOT modify the 'fixed' positioning, height (h-16), or the transparency/scrolled logic
 * without explicit testing in BOTH Dark and Light modes. This component is locked to
 * ensure layout stability for the Home page hero section.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, User, Settings, LogOut, BookOpen,
         ChevronDown, ShoppingCart, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Auth } from '@/lib/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from 'sonner';

import { usePublicTheme } from './PublicThemeWrapper';
import { ShopService } from '@/lib/shop-service';

export default function PublicNav() {
  const { isDark } = usePublicTheme();
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/jkc-devotion-app/' || pathname === '/jkc-devotion-app';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Poll for live events every 60 seconds
  useEffect(() => {
    const checkLive = async () => {
      try {
        const { data } = await supabase
          .from('live_streams')
          .select('id')
          .eq('status', 'live')
          .limit(1);
        setIsLive(!!(data && data.length > 0));
      } catch {
        // silently ignore
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  useEffect(() => {
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Custom event for same-window updates
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  const updateCartCount = async () => {
    const currentUser = await Auth.getCurrentUser();
    if (currentUser) {
        try {
            const dbCart = await ShopService.getCart(currentUser.id);
            setCartCount(dbCart.reduce((acc: number, item: any) => acc + item.quantity, 0));
        } catch (e: any) {
            console.error("Nav cart fetch error:", e.message || e);
        }
    } else {
        const cart = JSON.parse(localStorage.getItem('merchandise_cart') || '[]');
        setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    }
  };

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

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setHoveredLink(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 150);
  };

  const navLinks = [
    { label: 'WATCH', href: '/welcome/watch' },
    { label: 'VISIT', href: '/welcome/visit' },
    { 
      label: 'ABOUT', 
      href: '/welcome/about',
      subLinks: [
        { label: 'OUR PASTOR', href: '/welcome/our-pastor' },
        { label: 'STATEMENT OF FAITH', href: '/welcome/about#faith' },
        { label: 'CHURCH HISTORY', href: '/welcome/about#history' },
        { label: 'CHURCH STAFF', href: '/welcome/staff' },
        { label: 'CHRISTIANITY IN JAPAN', href: '/welcome/about#japan' },
        { label: 'BAPTISM IN JAPAN', href: '/welcome/about#baptism' },
        { label: 'DIRECTIONS AND PARKING', href: '/welcome/visit#directions' },
      ]
    },
    { 
      label: 'GIVE', 
      href: '/welcome/give',
      subLinks: [
        { label: 'GIVING OPTIONS', href: '/welcome/give' },
        { label: 'OUTREACH DONATIONS', href: '/welcome/give#outreach' },
        { label: 'MISSIONARY SUPPORT', href: '/welcome/give#missionary' },
      ]
    },
    { label: 'SHOP', href: '/merchandise' },
    { label: 'ACADEMY', href: '/welcome/ministries/language-school' },
    { label: 'DEVOTION', href: '/welcome/devotion' },
  ];

  const LIVE_URL = 'https://www.youtube.com/@JapanKingdomChurch/streams';

  const mobileNavLinks = [
    { label: 'WATCH', href: '/welcome/watch' },
    { label: 'VISIT', href: '/welcome/visit' },
    { label: 'GIVE', href: '/welcome/give' },
    { label: 'SHOP', href: '/merchandise' },
    { label: 'ACADEMY', href: '/welcome/ministries/language-school' },
    { label: 'DEVOTION', href: '/welcome/devotion' },
    { label: 'ABOUT', href: '/welcome/about' },
    { label: 'OUR PASTOR', href: '/welcome/our-pastor' },
    { label: 'STAFF', href: '/welcome/staff' },
    { label: 'MINISTRIES', href: '/welcome/ministries' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 h-16 transition-all duration-300"
        style={{
          background: scrolled ? 'var(--nav-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent',
          boxShadow: scrolled ? 'var(--nav-shadow)' : 'none',
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6 h-full flex
                        items-center justify-between">

          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img
              src="/jkc-devotion-app/images/logo-horizontal.png"
              alt="Japan Kingdom Church"
              className="h-8 w-auto"
              style={{ filter: (isDark || !scrolled) ? 'brightness(1.5)' : 'none' }}
            />
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <div 
                key={link.label} 
                className="relative h-16 flex items-center"
                onMouseEnter={() => link.subLinks && handleMouseEnter(link.label)}
                onMouseLeave={link.subLinks ? handleMouseLeave : undefined}
              >
                <Link href={link.href}
                  className="text-[10px] font-black tracking-[0.3em] transition-all flex items-center gap-1.5 py-2"
                  style={{ 
                    color: link.label === 'DEVOTION' 
                      ? 'var(--jkc-gold)' 
                      : (scrolled ? 'var(--nav-link)' : (isDark || isHomePage ? 'rgba(255,255,255,0.9)' : 'var(--nav-link)'))
                  }}>
                  {link.label === 'DEVOTION' && <BookOpen className="w-3.5 h-3.5" />}
                  {link.label}
                  {link.subLinks && (
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${hoveredLink === link.label ? 'rotate-180' : ''}`} />
                  )}
                </Link>

                {/* Dropdown Panel */}
                {link.subLinks && hoveredLink === link.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[320px] pt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="glass rounded-[2rem] border border-[var(--nav-border)] shadow-2xl overflow-hidden" 
                         style={{ background: 'var(--card)' }}>
                      <div className="px-8 py-5" style={{ background: 'var(--jkc-navy)' }}>
                         <span className="text-[10px] font-black tracking-[0.4em] text-white uppercase italic">
                           {link.label}
                         </span>
                      </div>
                      <div className="p-4 flex flex-col gap-1">
                        {link.subLinks.map((sub: any) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="px-6 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase hover:scale-[1.02] active:scale-95"
                            style={{ 
                              color: 'var(--foreground)',
                              background: 'transparent'
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'var(--jkc-navy)';
                              (e.currentTarget as HTMLElement).style.color = 'white';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
                            }}
                            onClick={() => setHoveredLink(null)}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop right — LIVE badge + auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLive && (
              <a
                href={LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all hover:opacity-90"
                style={{ background: '#ef4444', color: '#ffffff' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#fca5a5' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#ffffff' }} />
                </span>
                LIVE
              </a>
            )}

            <Link href="/merchandise/cart" className="relative p-2 hover:opacity-80 transition-opacity">
              <ShoppingCart size={18} style={{ color: (scrolled || (!isDark && !isHomePage)) ? 'var(--foreground)' : 'white' }} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--jkc-gold)] text-[var(--jkc-navy)] text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </Link>

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
                    <Link href="/welcome/devotion"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <BookOpen className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      Devotion App
                    </Link>
                    <Link href="/merchandise/wishlist"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <Heart className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      Liked Products
                    </Link>
                    <Link href="/merchandise/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      Purchase History
                    </Link>
                    <Link href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-bold hover:bg-[var(--muted)] transition-all"
                      style={{ color: 'var(--foreground)' }}>
                      <User className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                      My Profile
                    </Link>
                    <Link href="/profile/settings"
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
                className="btn-navy rounded-full px-6 py-2 text-[10px] font-black tracking-widest"
              >
                SIGN IN
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/merchandise/cart" className="relative p-2">
              <ShoppingCart size={22} style={{ color: (scrolled || (!isDark && !isHomePage)) ? 'var(--foreground)' : 'white' }} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--jkc-gold)] text-[var(--jkc-navy)] text-[8px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 transition-colors"
              style={{ color: (scrolled || (!isDark && !isHomePage)) ? 'var(--foreground)' : 'white' }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-start overflow-y-auto py-12 px-6 space-y-4 animate-in fade-in zoom-in duration-300 hide-scrollbar"
             style={{ background: 'var(--footer-bg)' }}>
          <button className="absolute top-6 right-6"
            style={{ color: 'var(--footer-muted)' }}
            onClick={() => setIsMenuOpen(false)}>
            <X size={32} />
          </button>

              <img
                src="/jkc-devotion-app/images/logo-horizontal.png"
                alt="Japan Kingdom Church"
                className="h-8 w-auto block brightness-110"
              />

          {mobileNavLinks.map(link => (
            <Link key={link.label} href={link.href}
              className="text-base sm:text-lg font-black tracking-[0.2em] transition-colors uppercase shrink-0"
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
