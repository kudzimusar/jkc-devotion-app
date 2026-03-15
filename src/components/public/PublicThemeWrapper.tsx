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
      style={{
        '--primary': isDark
          ? 'oklch(0.65 0.25 260)'
          : 'oklch(0.45 0.20 245)',
        '--primary-foreground': 'oklch(0.98 0 0)',
        background: isDark ? 'oklch(0.08 0.04 255)' : '#f0f4ff',
        color: isDark ? 'white' : '#0a1628',
      } as React.CSSProperties}
      className="min-h-screen transition-colors duration-300"
    >
      {/* Theme toggle button */}
      <button
        onClick={toggle}
        className={`fixed bottom-20 right-6 z-[9998] w-10 h-10
                   rounded-full flex items-center justify-center
                   shadow-xl transition-all hover:scale-110
                   border ${isDark
                     ? 'bg-white/10 border-white/20 text-white'
                     : 'bg-black/10 border-black/20 text-black'
                   }`}
        aria-label="Toggle theme"
      >
        {isDark
          ? <Sun className="w-4 h-4" />
          : <Moon className="w-4 h-4" />
        }
      </button>

      {children}
    </div>
  );
}
