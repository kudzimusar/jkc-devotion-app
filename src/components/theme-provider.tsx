"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeContextType = {
    week: number;
    setWeek: (week: number) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [week, setWeek] = useState(1);
    const pathname = usePathname();

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
        // Update body class for styling
        document.body.className = `theme-week-${week}`;
    }, [week]);

    return (
        <ThemeContext.Provider value={{ week, setWeek }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
