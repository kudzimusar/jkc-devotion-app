'use client';
import { MapPin, Mail, Phone, Globe, Youtube, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { usePublicTheme } from './PublicThemeWrapper';
import { useChurch } from '@/lib/church-context';

export default function PublicFooter() {
  const { isDark } = usePublicTheme();
  const { org, slug } = useChurch();
  const currentYear = new Date().getFullYear();

  // ONLY use JKC details if explicitly identified as JKC. Otherwise, stay neutral.
  const isExplicitJKC = slug === 'jkc-devotion-app' || slug === 'jkc';
  const isJKC = isExplicitJKC; // Narrowed scope
  
  const churchName = org?.name ?? (isJKC ? 'Japan Kingdom Church' : 'Your Ministry Name');

  // Multi-tenant Contact Data RESOLUTION
  const contactData = {
    address: org?.address ?? (isJKC ? '〒196-0015 東京都昭島市昭和町2-1-6' : 'Organization Address'),
    addressSub: org?.address_sub ?? (isJKC ? 'TE Bldg. 3F, Akishima-shi, Tokyo' : 'Contact us for location details'),
    email: org?.contact_email ?? (isJKC ? 'jkc.contact@gmail.com' : 'contact@ministry.org'),
    phone: org?.contact_phone ?? (isJKC ? '042-519-4940' : 'Phone Number'),
    googleMapsUrl: org?.google_maps_url ?? (isJKC ? 'https://www.google.com/maps?q=Japan+Kingdom+Church+TE+Building+Akishima+Tokyo' : '#'),
    social: {
      youtube: org?.youtube_url ?? (isJKC ? 'https://www.youtube.com/@japankingdomchurch' : null),
      facebook: org?.facebook_url ?? (isJKC ? 'https://www.facebook.com/japankingdomchurch' : null),
      instagram: org?.instagram_url ?? (isJKC ? 'https://www.instagram.com/jkctokyo' : null),
      twitter: org?.twitter_url ?? (isJKC ? 'http://twitter.com/jkctokyo' : null),
    }
  };

  // Footer is a "Dark Island" — it follows high-inversion variables
  const footerBg = 'var(--footer-bg)';
  const textColor = 'var(--footer-fg)';
  const mutedText = 'var(--footer-muted)';
  const dimText = 'var(--footer-muted)';
  const borderColor = 'rgba(255, 255, 255, 0.1)';

  return (
    <footer
      className="w-full pt-20 pb-12 relative z-10"
      id="public-footer"
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
            <Link href="/">
              {org?.logo_url ? (
                <img src={org.logo_url} alt={churchName} className="h-8 w-auto block" />
              ) : isExplicitJKC ? (
                <img src="/jkc-devotion-app/images/logo-horizontal.png" alt="Japan Kingdom Church" className="h-8 w-auto block" />
              ) : (
                <span className="text-xl font-black uppercase tracking-widest" style={{ color: textColor }}>{churchName}</span>
              )}
            </Link>
            <div className="space-y-3">
              <h4 className="font-serif text-2xl font-black m-0" style={{ color: textColor }}>
                {churchName}
              </h4>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: mutedText }}>
                {org?.mission_statement ?? (isJKC
                  ? 'Equipping believers for transformation and raising disciples for Christ in Japan. Representing Christ to Japanese Society through spiritual excellence.'
                  : `Empowering our community through spiritual growth and service. Powered by Church OS.`)}
              </p>
            </div>
            
            <div className="flex gap-5 pt-2">
              {Object.entries(contactData.social).map(([key, href]) => {
                if (!href) return null;
                const Icon = key === 'youtube' ? Youtube : key === 'facebook' ? Facebook : key === 'instagram' ? Instagram : Twitter;
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    className="hover:scale-110 transition-transform" style={{ color: mutedText }}>
                    <Icon size={20} />
                  </a>
                );
              })}
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
                  href={contactData.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-sm hover:opacity-80 transition-opacity ${contactData.googleMapsUrl === '#' ? 'pointer-events-none' : ''}`}
                >
                  <p className="font-bold m-0" style={{ color: textColor }}>{contactData.address}</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>{contactData.addressSub}</p>
                </a>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: borderColor }}>
                  <Mail className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <div className="text-sm">
                  <p className="font-bold m-0" style={{ color: textColor }}>{contactData.email}</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>Get in touch for prayers or info</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: borderColor }}>
                  <Phone className="w-4 h-4" style={{ color: 'var(--jkc-gold)' }} />
                </div>
                <div className="text-sm">
                  <p className="font-bold m-0" style={{ color: textColor }}>{contactData.phone}</p>
                  <p className="m-0 mt-1" style={{ color: mutedText }}>Contact us directly</p>
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
                { label: 'Shop', href: '/merchandise' },
                { label: 'About', href: '/welcome/about' },
                { label: 'Pastor', href: '/welcome/our-pastor' },
                { label: 'Academy', href: '/welcome/ministries/language-school' },
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
                <Link href="/" className="text-sm font-bold flex items-center gap-2 hover:text-[var(--jkc-gold)] transition-colors"
                  style={{ color: mutedText }}>
                  <Globe className="w-4 h-4" />
                  {isExplicitJKC ? 'JKC Home' : 'Church Home'}
                </Link>
                <Link href="/welcome/devotion" className="text-sm font-bold hover:text-[var(--jkc-gold)] transition-colors" style={{ color: mutedText }}>
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
              © {currentYear} {churchName}
            </p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] m-0" style={{ color: dimText }}>
            {isExplicitJKC ? 'REPRESENTING CHRIST TO JAPANESE SOCIETY' : 'POWERED BY CHURCH OS'}
          </p>
        </div>
      </div>
    </footer>
  );
}
