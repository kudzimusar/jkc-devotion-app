"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquareText, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    CheckCircle2, 
    Clock, 
    Mail,
    ChevronRight,
    SearchX,
    ShieldCheck,
    Send,
    Sparkles
} from "lucide-react";
import { useAdminCtx } from "../Context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PastoralMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
    receiver?: {
        name: string;
        email: string;
        avatar_url: string;
    };
    sender?: {
        name: string;
    };
}

export default function CommunicationsLogPage() {
    const [messages, setMessages] = useState<PastoralMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedMessage, setSelectedMessage] = useState<PastoralMessage | null>(null);

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (orgId) fetchMessages();
    }, [orgId]);

    async function fetchMessages() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pastoral_messages')
                .select(`
                    *,
                    receiver:profiles!receiver_id (name, email, avatar_url),
                    sender:profiles!sender_id (name)
                `)
                .eq('org_id', orgId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = messages.filter(m => {
        const q = search.toLowerCase();
        const matchesSearch = !q || 
            m.receiver?.name.toLowerCase().includes(q) || 
            m.body.toLowerCase().includes(q) || 
            m.subject?.toLowerCase().includes(q);
        
        if (filter === 'unread') return matchesSearch && !m.is_read;
        if (filter === 'read') return matchesSearch && m.is_read;
        return matchesSearch;
    });

    return (
        <div className="p-6 xl:p-8 min-h-screen bg-background">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <MessageSquareText className="w-6 h-6 text-primary" />
                        Communications Log
                    </h1>
                    <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                        Archive of Leadership Guidance & Pastoral Correspondence
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search correspondence..."
                            className="h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 w-64 shadow-sm"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="h-10 px-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-sm transition-all hover:bg-muted"
                    >
                        <option value="all">All Logs</option>
                        <option value="unread">Unread</option>
                        <option value="read">Archived</option>
                    </select>
                    <Button 
                        onClick={fetchMessages}
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 border-border bg-card hover:bg-muted rounded-xl transition-all"
                    >
                        <Clock className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5 min-h-[600px] flex flex-col">
                <div className="grid grid-cols-[1.5fr_1fr_2fr_1fr] bg-muted/40 px-6 py-3 border-b border-border">
                    {['Recipient', 'Messenger', 'Preview', 'Timestamp'].map(h => (
                        <span key={h} className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">{h}</span>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Retrieving Secure Archives...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <SearchX className="w-8 h-8 text-muted-foreground/20" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No correspondence found</h3>
                                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters to find specific guidance logs.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {filtered.map((msg, idx) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        onClick={() => setSelectedMessage(msg)}
                                        className="grid grid-cols-[1.5fr_1fr_2fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/30 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/10">
                                                {msg.receiver?.name?.[0] || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{msg.receiver?.name || 'Unknown Member'}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-2.5 h-2.5 text-muted-foreground/30" />
                                                    <p className="text-[9px] text-muted-foreground truncate">{msg.receiver?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                            <p className="text-[11px] font-bold text-muted-foreground/70">{msg.sender?.name || 'Admin'}</p>
                                        </div>
                                        <div className="min-w-0 pr-8">
                                            <p className="text-xs text-muted-foreground truncate leading-relaxed">
                                                <span className="font-bold text-foreground/60 mr-2">{msg.subject}:</span>
                                                {msg.body}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-muted-foreground/40">
                                                <Calendar className="w-3 h-3" />
                                                <p className="text-[10px] font-medium">
                                                    {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Stats */}
                {!loading && (
                    <div className="px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {filtered.length} entries matching current protocol
                        </p>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600/60 uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Encrypted
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-black text-primary/60 uppercase">
                                <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Detail Modal */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden shadow-primary/10"
                        >
                            <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-br from-primary/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary border border-primary/20">
                                        {selectedMessage.receiver?.name?.[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-foreground">{selectedMessage.receiver?.name}</h2>
                                        <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase">Secure Log</Badge>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedMessage(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <Clock className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        <span>Official Subject</span>
                                        <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-foreground">{selectedMessage.subject || 'Pastoral Guidance'}</p>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 underline decoration-primary/30 underline-offset-4">Message Body</p>
                                    <div className="bg-muted/30 border border-border rounded-2xl p-6">
                                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {selectedMessage.body}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 bg-muted/40 rounded-2xl border border-border">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Delivered By</p>
                                        <p className="text-[10px] font-bold text-foreground flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> {selectedMessage.sender?.name || 'Admin Console'}</p>
                                    </div>
                                    <div className="p-4 bg-muted/40 rounded-2xl border border-border text-right">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Status</p>
                                        <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5 justify-end">Verified Delivery <CheckCircle2 className="w-3 h-3" /></p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 border-t border-border bg-muted/30 flex gap-3">
                                <Button variant="outline" onClick={() => setSelectedMessage(null)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Close Log</Button>
                                <Button className="flex-1 h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2">
                                    Resend Message <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
