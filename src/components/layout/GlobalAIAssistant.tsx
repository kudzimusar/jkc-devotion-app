"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Bot, BarChart } from "lucide-react";
import { AIService } from "@/lib/ai-service";
import { AIFeedback } from "@/components/AIFeedback";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";

import { getContextForPersona } from "@/lib/context-injections";

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
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string, logId?: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Internal state for self-sufficiency
    const [internalUser, setInternalUser] = useState<any>(propUser || null);
    const [internalRole, setInternalRole] = useState<string | null>(propUserRole || null);

    const user = propUser || internalUser;
    const userRole = propUserRole || internalRole;

    /**
     * @see knowledge/personas/index.md
     */
    const detectPersona = (pathName: string, role: string | null) => {
        const path = pathName || '';
        
        if (path.includes('/super-admin') || path.includes('/console')) return 'Sentinel';
        if (role === 'pastor' || role === 'admin' || path.includes('/pastor-hq')) return 'Strategist';
        if (role === 'shepherd' || path.includes('/shepherd')) return 'Shepherd';
        if (path.includes('/bible-study') || path.includes('/groups')) return 'Facilitator';
        if (path.includes('/devotion') || path.includes('/soap')) return 'Disciple';
        if (path.includes('/profile')) return 'Steward';
        if (path.includes('/onboarding') || path.includes('/welcome') || path === '/' || path === '') return 'Concierge';
        
        return 'Concierge';
    };

    const [currentPersona, setCurrentPersona] = useState(detectPersona(pathname, userRole));

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

    // Handle Persona Shift Notification
    useEffect(() => {
        const nextPersona = detectPersona(pathname, userRole);
        
        if (nextPersona !== currentPersona && chatHistory.length > 0) {
            const shiftMsg = `*I notice you've moved to the ${pathname} section. I'll shift focus to my ${nextPersona} persona to assist you better. ${getInitialMessageForPersona(nextPersona)}*`;
            setChatHistory(prev => [...prev, { role: 'ai', content: shiftMsg }]);
            setCurrentPersona(nextPersona);
        } else if (nextPersona !== currentPersona) {
            setCurrentPersona(nextPersona);
        }
    }, [pathname, userRole, currentPersona, chatHistory.length]);

    const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';

    const handleSend = async () => {
        if (!query.trim()) return;
        const newChat = [...chatHistory, { role: 'user' as const, content: query }];
        setChatHistory(newChat);
        setQuery("");
        setLoading(true);

        try {
            console.log(`[UI] Starting generation for ${currentPersona}...`);
            // Phase 3: RAG Context Injection
            const contextData = await getContextForPersona(
                currentPersona.toLowerCase(),
                user?.id || null, 
                userRole || 'visitor'
            );
            console.log(`[UI] Context retrieved:`, Object.keys(contextData));

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
                activePersona: currentPersona,
                ragContext: contextData // Pass new context to AI Service
            };

            console.log(`[UI] Calling AIService...`);
            const aiResponse = await AIService.chatWithGlobalAssistant(
                currentPersona, 
                user?.name || 'Guest', 
                user?.id || '', 
                query, 
                contextPayload, 
                chatHistory
            );
            
            const responseText = aiResponse?.text || "I'm sorry, I'm having trouble thinking of a response right now.";
            const logId = aiResponse?.logId || null;
            
            console.log(`[UI] Received response (${responseText.length} chars)`);
            setChatHistory([...newChat, { role: 'ai', content: responseText, logId }]);
        } catch (e: any) {
            console.error(`[UI] Generation error:`, e);
            setChatHistory([...newChat, { role: 'ai', content: "I'm sorry, I'm having trouble connecting right now." }]);
        } finally {
            console.log(`[UI] Resetting loading state.`);
            setLoading(false);
        }
    };

    const getInitialMessageForPersona = (persona: string) => {
        switch(persona) {
            case 'Shepherd':
                return "I am monitoring assigned members and prophetic alerts. How can I assist your pastoral care today?";
            case 'Strategist':
                return "I have analyzed church growth and ministry trends. What strategic insights do you need?";
            case 'Sentinel':
                return "Systems are nominal. How can I help you manage the platform architecture today?";
            case 'Steward':
                return "I am here to help you manage your profile, ministry gifts, and engagement records.";
            case 'Disciple':
                return "I am here to guide your daily devotion and answer context about scriptures.";
            case 'Facilitator':
                return "I'm here to help manage your Bible study groups and curriculum engagement.";
            case 'Concierge':
            default:
                return "I'll help you navigate the Church OS ecosystem. Where shall we start?";
        }
    };

    const getInitialMessage = () => {
        const persona = currentPersona;
        return `Welcome! ${getInitialMessageForPersona(persona)}`;
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
                        {chatHistory.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-amber-600 text-white ml-auto rounded-tr-none' 
                                            : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 mr-auto rounded-tl-none border border-zinc-100 dark:border-zinc-800'
                                    }`}>
                                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                        {msg.role === 'ai' && msg.logId && (
                                            <AIFeedback logId={msg.logId} />
                                        )}
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
