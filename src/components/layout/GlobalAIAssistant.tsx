"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Bot, BarChart } from "lucide-react";
import { AIService } from "@/lib/ai-service";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalAIAssistant({ user, userRole, stats, devotion, currentDate }: { user: any; userRole: string | null; stats?: any; devotion?: any; currentDate?: Date }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';

    const handleSend = async () => {
        if (!query.trim()) return;
        const newChat = [...chatHistory, { role: 'user' as const, content: query }];
        setChatHistory(newChat);
        setQuery("");
        setLoading(true);

        try {
            const isCompletedToday = devotion && stats?.completedDays?.includes(devotion.id);

            const contextPayload = {
                stats: stats ? { currentStreak: stats.streak, completedToday: isCompletedToday } : null,
                devotion: devotion ? { weekTheme: `Week ${devotion.week}: ${devotion.week_theme}`, dailyFocus: devotion.declaration, scripture: devotion.scripture, text: devotion.fullScriptureText || devotion.scripture, theme: devotion.theme } : null,
                currentDate: currentDate?.toISOString()
            };

            const response = await AIService.chatWithGlobalAssistant(userRole || 'member', user?.name || 'Guest', query, contextPayload, chatHistory);
            setChatHistory([...newChat, { role: 'ai', content: response }]);
        } catch (e) {
            setChatHistory([...newChat, { role: 'ai', content: "I'm sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="glass rounded-full h-9 px-4 md:h-11 flex items-center gap-2 group border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all mr-2">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary group-hover:animate-pulse" />
                    <span className="hidden md:inline font-bold text-xs uppercase tracking-widest text-primary">Ask AI</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md border-l border-foreground/10 bg-background/95 backdrop-blur-3xl p-6 flex flex-col z-[300]">
                <SheetHeader className="pb-6 border-b border-foreground/10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <SheetTitle className="text-xl font-serif text-primary">Spiritual Assistant</SheetTitle>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                                {isAdmin ? "Church Leadership Analytics Mode" : "Personal Devotion Mode"}
                            </span>
                        </div>
                    </div>
                </SheetHeader>

                {isAdmin && chatHistory.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 glass rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-foreground/80 space-y-3">
                        <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest">
                            <BarChart className="w-4 h-4" /> Admin Data Active
                        </div>
                        <p className="leading-relaxed">I am monitoring real-time church analytics. You can ask me to analyze church growth, identify dwindling attendance, review prayer requests, or suggest discrepancies based on member data.</p>
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-2 custom-scrollbar">
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-[10px] h-7 rounded-full border-foreground/20" onClick={() => setQuery("Summarize this week's church growth and attendance.")}>Weekly Growth</Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap text-[10px] h-7 rounded-full border-foreground/20" onClick={() => setQuery("Are there any unhandled prayer requests or pastoral care alerts?")}>Care Alerts</Button>
                        </div>
                    </motion.div>
                )}

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6">
                    {chatHistory.length === 0 && (!isAdmin) && (
                        <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-4 px-8">
                            <Sparkles className="w-12 h-12 text-primary" />
                            <p className="text-sm font-medium">Hello {user?.name || 'Friend'}. I am here to guide your daily devotion, answer context about scriptures, and encourage your personal growth.</p>
                        </div>
                    )}

                    <AnimatePresence>
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
                            placeholder="Ask the Spirit..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
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
