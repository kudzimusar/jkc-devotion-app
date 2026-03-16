'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeContext = createContext({ isDark: true });

export const usePublicTheme = () => useContext(ThemeContext);

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
    <ThemeContext.Provider value={{ isDark }}>
      <div
        data-theme={isDark ? 'dark' : 'light'}
        className={isDark ? 'jkc-dark' : 'jkc-light'}
        style={{
          '--primary': isDark ? '#3b82f6' : '#1b3a6b',
          '--gold': '#f5a623',
        } as React.CSSProperties}
      >
        <style>{`
          .jkc-dark {
            background: #0d1b2e;
            color: white;
          }
          .jkc-light {
            background: #fdfaf3;
            color: #1b3a6b;
          }
          /* Core transition */
          .jkc-dark, .jkc-light {
            transition: background-color 0.3s ease, color 0.3s ease;
            min-height: 100vh;
          }
          
          /* Nav adjustments — minimal to avoid logo regression */
          .jkc-light nav {
            background: rgba(255,255,255,0.95) !important;
            border-bottom: 2px solid rgba(27,58,107,0.1) !important;
          }
          .jkc-light nav a {
            color: #1b3a6b !important;
          }
          .jkc-light nav .text-white {
            color: #1b3a6b !important;
          }
          .jkc-light nav .border-white\\/20 {
            border-color: rgba(27,58,107,0.3) !important;
          }

          /* Global background helpers — only for light mode, minimal */
          .jkc-light .glass-card, 
          .jkc-light .glass {
            background: rgba(255,255,255,0.8) !important;
            border-color: rgba(27,58,107,0.1) !important;
            color: #1b3a6b !important;
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
            color: isDark ? 'white' : '#1b3a6b',
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
    </ThemeContext.Provider>
  );
}
