'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false });

export const usePublicTheme = () => useContext(ThemeContext);

export function PublicThemeWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mode === 'dark';

  if (!mounted) {
    // Initial SSR render or pre-hydration
    return (
      <div style={{ minHeight: '100vh', background: 'var(--jkc-ivory)', color: 'var(--jkc-navy)' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark }}>
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleMode}
          className="fixed bottom-20 right-6 z-[9998] w-10 h-10 rounded-full flex items-center justify-center border shadow-xl transition-all hover:scale-110 active:scale-95"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)'
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
