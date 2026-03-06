"use client";

import { Plus, Minus, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TapCounterProps {
    value: number;
    onChange: (val: number) => void;
    label: string;
}

export function TapCounter({ value, onChange, label }: TapCounterProps) {
    const increment = () => onChange(value + 1);
    const decrement = () => onChange(Math.max(0, value - 1));

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 shadow-xl active:scale-[0.98] transition-transform">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{label}</span>

            <div className="flex items-center gap-10">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={decrement}
                    className="h-16 w-16 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                >
                    <Minus className="w-8 h-8" />
                </Button>

                <div className="flex flex-col items-center">
                    <span className="text-5xl font-black text-white lining-nums tabular-nums">
                        {value}
                    </span>
                </div>

                <Button
                    type="button"
                    size="icon"
                    onClick={increment}
                    className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                >
                    <Plus className="w-8 h-8" />
                </Button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                <Hash className="w-3 h-3" />
                Live Attendance Counter
            </div>
        </div>
    );
}
