"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Bot, BarChart } from "lucide-react";
import { AIService } from "@/lib/ai-service";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";

export function GlobalAIAssistant({ 
    user: propUser, 
    userRole: propUserRole, 
    stats: propStats, 
    devotion: propDevotion, 
    currentDate: propCurrentDate, 
    currentPage: propCurrentPage 
}: {
    user?: any;
    userRole?: string | null;
    stats?: any;
    devotion?: any;
    currentDate?: Date;
    currentPage?: string;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Internal state for self-sufficiency
    const [internalUser, setInternalUser] = useState<any>(propUser || null);
    const [internalRole, setInternalRole] = useState<string | null>(propUserRole || null);

    const user = propUser || internalUser;
    const userRole = propUserRole || internalRole;

    useEffect(() => {
        if (!propUser || !propUserRole) {
            const fetchUser = async () => {
                const u = await Auth.getCurrentUser();
                setInternalUser(u);
                
                if (u) {
                    const { data: member } = await supabase
                        .from("org_members")
                        .select("role")
                        .eq("user_id", u.id)
                        .single();
                    setInternalRole(member?.role || 'member');
                }
            };
            fetchUser();
        }
    }, [propUser, propUserRole, pathname]);

    const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';

    /**
     * @see knowledge/personas/index.md
     * @see knowledge/prompts/index.md
     */
    const detectPersona = () => {
        const path = pathname || '';
        
        // Priority 1: Super Admin / Console
        if (path.includes('/super-admin') || path.includes('/console')) return 'Sentinel';
        
        // Priority 2: Staff Roles
        if (userRole === 'pastor' || userRole === 'admin' || path.includes('/pastor-hq')) return 'Strategist';
        if (userRole === 'shepherd' || path.includes('/shepherd')) return 'Shepherd';
        
        // Priority 3: Specialized Features
        if (path.includes('/bible-study') || path.includes('/groups')) return 'Facilitator';
        if (path.includes('/devotion') || path.includes('/soap')) return 'Disciple';
        if (path.includes('/profile')) return 'Steward';
        
        // Priority 4: Entry / Public
        if (path.includes('/onboarding') || path.includes('/welcome') || path === '/' || path === '') return 'Concierge';
        
        return 'Concierge';
    };

    const handleSend = async () => {
        if (!query.trim()) return;
        const newChat = [...chatHistory, { role: 'user' as const, content: query }];
        setChatHistory(newChat);
        setQuery("");
        setLoading(true);

        const currentPersona = detectPersona();

        try {
            const isCompletedToday = propDevotion && propStats?.completedDays?.includes(propDevotion.id);

            const contextPayload = {
                stats: propStats ? { currentStreak: propStats.streak, completedToday: isCompletedToday } : null,
                devotion: propDevotion ? { 
                    ...propDevotion, 
                    weekTheme: `Week ${propDevotion.week}: ${propDevotion.week_theme}`,
                    dailyFocus: propDevotion.declaration, 
                    text: propDevotion.fullScriptureText || propDevotion.scripture
                } : null,
                currentDate: (propCurrentDate || new Date()).toISOString(),
                currentPage: propCurrentPage || pathname,
                membershipStatus: userRole || ' visitor',
                activePersona: currentPersona
            };

            const response = await AIService.chatWithGlobalAssistant(currentPersona, user?.name || 'Guest', query, contextPayload, chatHistory);
            setChatHistory([...newChat, { role: 'ai', content: response }]);
        } catch (e) {
            setChatHistory([...newChat, { role: 'ai', content: "I'm sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    // Determine initial message based on persona path
    const getInitialMessage = () => {
        const persona = detectPersona();
        
        switch(persona) {
            case 'Shepherd':
                return "I am the Church OS Shepherd. I am monitoring your assigned members and prophetic alerts. How can I assist your pastoral care today?";
            case 'Strategist':
                return "I am the Church OS Strategist. I have analyzed church growth and ministry trends. What strategic insights do you need?";
            case 'Sentinel':
                return "Systems are nominal. I am the Sentinel. How can I help you manage the platform architecture today?";
            case 'Steward':
                return "I am the Steward. I am here to help you manage your profile, ministry gifts, and engagement records.";
            case 'Disciple':
                return "I am here to guide your daily devotion, answer context about scriptures, and encourage your personal growth.";
            case 'Facilitator':
                return "I am the Facilitator. I'm here to help manage your Bible study groups and curriculum engagement.";
            case 'Concierge':
            default:
                return "Welcome! I'm your Concierge. I'll help you navigate the Church OS ecosystem. Where shall we start?";
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all z-[9999] flex items-center justify-center p-0 group border-4 border-background focus:ring-0">
                    <Sparkles className="w-7 h-7 group-hover:animate-pulse" />
                    <span className="sr-only">Ask AI Assistant</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md border-l border-foreground/10 bg-background/95 backdrop-blur-3xl p-6 flex flex-col z-[10000]">
                <SheetHeader className="pb-6 border-b border-foreground/10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <SheetTitle className="text-xl font-serif text-primary">Church OS Assistant</SheetTitle>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                {isAdmin ? "Leadership Analytics Mode" : "Personal Devotion Mode"}
                            </span>
                        </div>
                    </div>
                </SheetHeader>

                {isAdmin && chatHistory.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 glass rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-foreground/80 space-y-3">
                        <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest">
                            <BarChart className="w-4 h-4" /> Admin Data Active
                        </div>
                        <p className="leading-relaxed">Accessing real-time church intelligence. You can ask for growth analysis, care alerts, or strategic forecasts.</p>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-2 custom-scrollbar">
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-[10px] h-7 rounded-full border-foreground/20" onClick={() => setQuery("Analyze church health and recent alerts.")}>Analyze Health</Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-[10px] h-7 rounded-full border-foreground/20" onClick={() => setQuery("Any pastoral care alerts for me?")}>Care Alerts</Button>
                        </div>
                    </motion.div>
                )}

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6">
                    {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-4 px-8">
                            <Sparkles className="w-12 h-12 text-primary" />
                            <p className="text-sm font-medium leading-relaxed">
                                {getInitialMessage()}
                            </p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {chatHistory.map((chat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${chat.role === 'user'
                                    ? 'bg-primary text-white rounded-br-sm shadow-xl shadow-primary/20'
                                    : 'glass bg-foreground/5 border border-foreground/10 rounded-bl-sm prose prose-sm dark:prose-invert font-serif whitespace-pre-wrap'
                                    }`}>
                                    {chat.content}
                                </div>
                            </motion.div>
                        ))}
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="glass bg-foreground/5 border border-foreground/10 rounded-3xl rounded-bl-sm p-4 w-20 flex justify-center gap-1.5 items-center h-12">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                                    <span className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                                    <span className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-4 border-t border-foreground/10 pb-4 shrink-0">
                    <div className="relative flex items-center">
                        <Textarea
                            placeholder="Message Assistant..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { 
                                if (e.key === 'Enter' && !e.shiftKey) { 
                                    e.preventDefault(); 
                                    handleSend(); 
                                } 
                            }}
                            className="w-full min-h-[52px] max-h-[120px] rounded-3xl bg-foreground/5 border-foreground/10 pr-14 py-4 text-sm resize-none focus:ring-1 focus:ring-primary/50 custom-scrollbar"
                            rows={1}
                        />
                        <Button
                            disabled={!query.trim() || loading}
                            onClick={handleSend}
                            size="icon"
                            className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
