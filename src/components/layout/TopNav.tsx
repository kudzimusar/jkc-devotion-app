"use client";

import Link from "next/link";
import { Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { basePath as BP } from "@/lib/utils";
import { GlobalAIAssistant } from "./GlobalAIAssistant";

interface TopNavProps {
    user: any;
    userRole?: string | null;
    stats?: any;
    devotion?: any;
    currentDate?: Date;
    onLoginClick?: () => void;
}

export function TopNav({ user, userRole, stats, devotion, currentDate, onLoginClick }: TopNavProps) {
    return (
        <>
            <nav className="sticky top-0 z-[100] w-full bg-[var(--background)] border-b border-foreground/10 shadow-sm">
                <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 md:w-10 md:h-10 relative">
                            <img src={`${BP}/church-logo.png`} alt="JKC Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80 leading-none">Japan Kingdom Church</span>
                            <span className="text-xs md:text-sm font-bold text-[var(--primary)] tracking-widest mt-0.5">ジャパン・キングダム・チャーチ</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 md:gap-4">
                        {user ? (
                            <Link href="/profile" className="hidden sm:flex flex-col items-end mr-2 hover:opacity-80 cursor-pointer">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Church Member</span>
                                <span className="text-xs font-black truncate max-w-[120px] text-[var(--primary)]">{user.name}</span>
                            </Link>
                        ) : (
                            <button onClick={onLoginClick} className="hidden sm:flex flex-col items-end mr-2 hover:opacity-80 cursor-pointer">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Guest Access</span>
                                <span className="text-xs font-black text-[var(--primary)]">Login</span>
                            </button>
                        )}
                        <div className="flex gap-1 items-center">
                            <Button variant="ghost" size="icon" className="glass rounded-full h-9 w-9 md:h-11 md:w-11 relative" onClick={() => toast.info("There are no new notifications at this time.")}>
                                <Bell className="w-4 h-4 md:w-5 md:h-5 text-[var(--primary)]" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="glass rounded-full h-9 w-9 md:h-11 md:w-11">
                                <Link href="/settings">
                                    <Settings className="w-4 h-4 md:w-5 md:h-5 text-[var(--primary)]" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
            {user && <GlobalAIAssistant user={user} userRole={userRole || null} stats={stats} devotion={devotion} currentDate={currentDate} />}
        </>
    );
}
