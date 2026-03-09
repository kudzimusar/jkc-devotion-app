"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeContextType = {
    week: number;
    mode: 'light' | 'dark';
    setWeek: (week: number) => void;
    toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [week, setWeek] = useState(1);
    const [mode, setMode] = useState<'light' | 'dark'>('dark');
    const pathname = usePathname();

    useEffect(() => {
        const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark';
        if (savedMode) setMode(savedMode);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
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
        const root = window.document.documentElement;

        // Remove old theme-week classes
        root.classList.forEach(className => {
            if (className.startsWith('theme-week-')) root.classList.remove(className);
        });
        root.classList.add(`theme-week-${week}`);

        if (mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme-mode', mode);
    }, [week, mode]);

    const toggleMode = () => setMode(m => m === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ week, mode, setWeek, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
