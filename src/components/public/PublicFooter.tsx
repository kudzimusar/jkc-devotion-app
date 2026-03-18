'use client';
import { MapPin, Mail, Phone, Globe, Youtube, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';

export default function PublicFooter() {
  const { isDark } = usePublicTheme();
  const currentYear = new Date().getFullYear();

  // Footer is a "Dark Island" — it follows high-inversion variables
  const footerBg = 'var(--footer-bg)';
  const textColor = 'var(--footer-fg)';
  const mutedText = 'var(--footer-muted)';
  const dimText = 'var(--footer-muted)';
  const borderColor = 'rgba(255, 255, 255, 0.1)';

  return (
    <footer
      className="w-full pt-20 pb-12 relative z-10"
      style={{
        backgroundColor: footerBg,
        borderTop: `1px solid ${borderColor}`,
        color: textColor
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">

          {/* Column 1: Brand */}
          <div className="flex flex-col gap-6">
            <Link href="/welcome">
              <img
                src="/jkc-devotion-app/images/logo-horizontal.png"
                alt="Japan Kingdom Church"
                className="h-8 w-auto block"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <div className="space-y-3">
              <h4 className="font-serif text-2xl font-black m-0" style={{ color: textColor }}>
                Japan Kingdom Church
              </h4>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: mutedText }}>
                Equipping believers for transformation and raising disciples for Christ in Japan. Representing Christ to Japanese Society through spiritual excellence.
              </p>
            </div>
            <div className="flex gap-5 pt-2">
              {[
                { Icon: Youtube, href: "https://www.youtube.com/@japankingdomchurch" },
                { Icon: Facebook, href: "https://www.facebook.com/japankingdomchurch" },
                { Icon: Instagram, href: "https://www.instagram.com/jkctokyo" },
                { Icon: Twitter, href: "http://twitter.com/jkctokyo" }
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform"
                  style={{ color: mutedText }}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div className="flex flex-col gap-8">
            <h5 className="font-black uppercase tracking-[0.3em] text-[10px]" style={{ color: dimText }}>
              Contact & Location
            </h5>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: borderColor }}>
                  <MapPin className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <a 
                  href="https://www.google.com/maps?q=Japan+Kingdom+Church+TE+Building+Akishima+Tokyo" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm hover:opacity-80 transition-opacity"
                >
                  <p className="font-bold m-0" style={{ color: textColor }}>〒196-0015 東京都昭島市昭和町2-1-6</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>TE Bldg. 3F, Akishima-shi, Tokyo</p>
                </a>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: borderColor }}>
                  <Mail className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <div className="text-sm">
                  <p className="font-bold m-0" style={{ color: textColor }}>jkc.contact@gmail.com</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>Get in touch for prayers or info</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: borderColor }}>
                  <Phone className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <div className="text-sm">
                  <p className="font-bold m-0" style={{ color: textColor }}>042-519-4940</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>Church Office: Tue-Sun</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Navigation */}
          <div className="flex flex-col gap-8">
            <h5 className="font-black uppercase tracking-[0.3em] text-[10px]" style={{ color: dimText }}>
              Navigation
            </h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                { label: 'Watch', href: '/welcome/watch' },
                { label: 'Visit', href: '/welcome/visit' },
                { label: 'Outreach', href: '/welcome/outreach' },
                { label: 'Ministries', href: '/welcome/ministries' },
                { label: 'Give', href: '/welcome/give' },
                { label: 'About', href: '/welcome/about' },
                { label: 'Pastor', href: '/welcome/our-pastor' },
                { label: 'Staff', href: '/welcome/staff' },
              ].map(link => (
                <Link key={link.label} href={link.href}
                  className="text-sm font-bold hover:text-[var(--jkc-gold)] transition-colors"
                  style={{ color: mutedText }}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest m-0" style={{ color: dimText }}>
                  Partners & Links
                </p>
                <Link href="/welcome" className="text-sm font-bold flex items-center gap-2 hover:text-[var(--jkc-gold)] transition-colors"
                  style={{ color: mutedText }}>
                  <Globe className="w-4 h-4" />
                  JKC Home
                </Link>
                <Link href="/" className="text-sm font-bold hover:text-[var(--jkc-gold)] transition-colors" style={{ color: mutedText }}>
                  Internal Login
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--jkc-gold)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] m-0" style={{ color: dimText }}>
              © {currentYear} Japan Kingdom Builders, Inc.
            </p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] m-0" style={{ color: dimText }}>
            REPRESENTING CHRIST TO JAPANESE SOCIETY
          </p>
        </div>
      </div>
    </footer>
  );
}
