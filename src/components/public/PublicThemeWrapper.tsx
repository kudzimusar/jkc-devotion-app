'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function PublicThemeWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('jkc-public-theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('jkc-public-theme', next ? 'dark' : 'light');
  };

  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        '--primary': isDark
          ? 'oklch(0.65 0.25 260)'
          : 'oklch(0.35 0.20 245)',
        '--primary-foreground': 'oklch(0.98 0 0)',
      } as React.CSSProperties}
      className={isDark ? 'jkc-dark' : 'jkc-light'}
    >
      <style>{`
        /* ── DARK MODE (default) ── */
        .jkc-dark {
          background: oklch(0.08 0.04 255);
          color: white;
          min-height: 100vh;
        }
        .jkc-dark nav {
          background: rgba(0,0,0,0.85) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .jkc-dark footer {
          background: rgba(0,0,0,0.4) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: white;
        }
        .jkc-dark footer p,
        .jkc-dark footer a,
        .jkc-dark footer h4,
        .jkc-dark footer h5 {
          color: inherit;
        }

        /* ── LIGHT MODE ── */
        .jkc-light {
          background: #f0f4ff;
          color: #0f172a;
          min-height: 100vh;
        }
        /* Nav */
        .jkc-light nav {
          background: rgba(255,255,255,0.95) !important;
          border-color: rgba(0,0,0,0.08) !important;
        }
        .jkc-light nav a,
        .jkc-light nav button,
        .jkc-light nav span {
          color: #0f172a !important;
        }
        .jkc-light nav a:hover {
          color: var(--primary) !important;
        }
        .jkc-light nav .border-white\\/30 {
          border-color: rgba(0,0,0,0.2) !important;
        }
        /* All sections */
        .jkc-light section {
          background: transparent;
        }
        .jkc-light h1, .jkc-light h2, .jkc-light h3,
        .jkc-light h4, .jkc-light h5, .jkc-light h6 {
          color: #0f172a !important;
        }
        .jkc-light p {
          color: #334155 !important;
        }
        /* Glass cards */
        .jkc-light .glass {
          background: rgba(255,255,255,0.8) !important;
          border-color: rgba(0,0,0,0.1) !important;
          backdrop-filter: blur(12px);
        }
        /* White/opacity text overrides */
        .jkc-light [class*="text-white"] {
          color: #0f172a !important;
        }
        .jkc-light [class*="text-white\\/60"],
        .jkc-light [class*="text-white\\/50"],
        .jkc-light [class*="text-white\\/40"] {
          color: #475569 !important;
        }
        .jkc-light [class*="text-white\\/30"],
        .jkc-light [class*="text-white\\/20"] {
          color: #94a3b8 !important;
        }
        /* Borders */
        .jkc-light [class*="border-white\\/10"],
        .jkc-light [class*="border-white\\/5"] {
          border-color: rgba(0,0,0,0.08) !important;
        }
        .jkc-light [class*="border-white\\/20"] {
          border-color: rgba(0,0,0,0.12) !important;
        }
        /* Backgrounds */
        .jkc-light [class*="bg-black\\/"] {
          background: rgba(255,255,255,0.6) !important;
        }
        .jkc-light [class*="bg-white\\/5"],
        .jkc-light [class*="bg-white\\/10"] {
          background: rgba(0,0,0,0.04) !important;
        }
        /* Hero section special */
        .jkc-light section[class*="min-h-screen"] {
          background: linear-gradient(135deg, #e0e8ff 0%, #f0f4ff 50%, #e8f0ff 100%);
        }
        /* Footer */
        .jkc-light footer {
          background: #1e3a8a !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: white !important;
        }
        .jkc-light footer p,
        .jkc-light footer a,
        .jkc-light footer h4,
        .jkc-light footer h5,
        .jkc-light footer span {
          color: rgba(255,255,255,0.8) !important;
        }
        .jkc-light footer a:hover {
          color: white !important;
        }
        /* Cards on light mode */
        .jkc-light .rounded-\\[2rem\\],
        .jkc-light .rounded-\\[2\\.5rem\\],
        .jkc-light .rounded-\\[3rem\\] {
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        /* Input fields */
        .jkc-light input,
        .jkc-light textarea {
          background: white !important;
          color: #0f172a !important;
          border-color: rgba(0,0,0,0.12) !important;
        }
        .jkc-light input::placeholder,
        .jkc-light textarea::placeholder {
          color: #94a3b8 !important;
        }
        /* Legal pages */
        .jkc-light .pt-24 {
          color: #0f172a;
        }
        /* Primary colored text stays primary */
        .jkc-light [class*="text-\\[var\\(--primary\\)\\]"] {
          color: var(--primary) !important;
        }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1.5rem',
          zIndex: 9998,
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
          background: isDark ? 'rgba(255,255,255,0.1)' : 'white',
          color: isDark ? 'white' : '#0f172a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {children}
    </div>
  );
}
