"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { usePathname } from "next/navigation";

type ThemeContextType = {
    week: number;
    mode: 'light' | 'dark';
    setWeek: (week: number) => void;
    toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  ...props 
}: { 
  children: React.ReactNode
} & React.ComponentProps<typeof NextThemesProvider>) {
    const [week, setWeek] = useState(1);
    const { theme, setTheme, resolvedTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);
    
    // Bridge next-themes 'theme' to internal 'mode'
    const mode = (resolvedTheme || theme || 'light') as 'light' | 'dark';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Determine week from current date (March 2026)
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth(); // 2 is March
        const year = now.getFullYear();

        if (year === 2026 && month === 2) {
            if (day <= 7) setWeek(1);
            else if (day <= 14) setWeek(2);
            else if (day <= 21) setWeek(3);
            else if (day <= 28) setWeek(4);
            else setWeek(5);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = window.document.documentElement;

        // Apply week theme class
        root.classList.forEach(className => {
            if (className.startsWith('theme-week-')) root.classList.remove(className);
        });
        root.classList.add(`theme-week-${week}`);
    }, [week, mounted]);

    const toggleMode = () => {
        setTheme(mode === 'light' ? 'dark' : 'light');
    };

    return (
        <NextThemesProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          {...props}
        >
            <ThemeContext.Provider value={{ week, mode, setWeek, toggleMode }}>
                {children}
            </ThemeContext.Provider>
        </NextThemesProvider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
