import devotions from "./devotions.json";

export type Devotion = {
    id: number;
    date: string;
    week: number;
    theme: string;
    title: string;
    scripture: string;
    declaration: string;
    week_theme: string;
};

export function getDevotionForDate(dateStr: string): Devotion | undefined {
    return (devotions as Devotion[]).find(d => d.date === dateStr);
}

export function getWeekForDate(dateStr: string): number {
    const d = new Date(dateStr);
    const day = d.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
}
