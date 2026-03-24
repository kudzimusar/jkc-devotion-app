"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Church, Gift, Star, Calendar, Bell, X } from 'lucide-react';

interface FeedItem {
    id: string;
    feed_type: string;
    title: string;
    body: string;
    cta_text?: string;
    cta_url?: string;
    published_at?: string;
    expires_at?: string;
    media_url?: string;
}

const FEED_TYPE_CONFIG: Record<string, {
    icon: any;
    accentColor: string;
    bgColor: string;
    borderColor: string;
    badgeLabel: string;
}> = {
    ministry_invitation: {
        icon: Church,
        accentColor: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30',
        badgeLabel: 'Ministry Invitation',
    },
    growth_nudge: {
        icon: Star,
        accentColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        badgeLabel: 'Growth',
    },
    achievement_badge: {
        icon: Gift,
        accentColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        badgeLabel: 'Achievement',
    },
    event_notification: {
        icon: Calendar,
        accentColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        badgeLabel: 'Event',
    },
    church_announcement: {
        icon: Bell,
        accentColor: 'var(--jkc-navy)',
        bgColor: 'var(--section-alt)',
        borderColor: 'var(--border)',
        badgeLabel: 'Announcement',
    },
    attendance_milestone: {
        icon: Star,
        accentColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        badgeLabel: 'Milestone',
    },
};

function FeedCard({ item, onDismiss }: { item: FeedItem; onDismiss: (id: string) => void }) {
    const cfg = FEED_TYPE_CONFIG[item.feed_type] || FEED_TYPE_CONFIG.church_announcement;
    const Icon = cfg.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-2xl border overflow-hidden group shadow-sm flex flex-col h-full bg-[var(--card)]"
            style={{ 
              borderColor: 'var(--border)',
              borderTop: `3px solid ${item.feed_type === 'church_announcement' ? 'var(--jkc-gold)' : 'currentColor'}`,
              color: 'var(--foreground)'
            }}
        >
            {item.media_url && (
                <div className="w-full h-32 md:h-40 bg-[var(--section-alt)] overflow-hidden shrink-0">
                    <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="p-5 flex-1 flex flex-col relative w-full items-start">
                <button
                    onClick={() => onDismiss(item.id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5 bg-[var(--section-alt)] border border-[var(--border)] z-10"
                    style={{ color: 'var(--muted-foreground)' }}
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                     <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1.5"
                           style={{ backgroundColor: 'var(--section-alt)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                         <Icon className="w-3 h-3" style={{ color: item.feed_type === 'church_announcement' ? 'var(--jkc-navy)' : 'var(--jkc-gold)' }} />
                         {cfg.badgeLabel}
                     </span>
                </div>
                
                <h4 className="text-base font-black leading-tight mb-2" style={{ color: 'var(--foreground)' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed mb-4 flex-1 overflow-y-auto" style={{ color: 'var(--muted-foreground)' }}>{item.body}</p>

                {item.cta_text && item.cta_url && (
                    <Link
                        href={item.cta_url}
                        className="inline-flex items-center gap-2 px-4 py-2 mt-auto rounded-full text-[10px] font-black tracking-widest uppercase transition-all hover:scale-105 active:scale-95 w-fit"
                        style={{ backgroundColor: 'var(--jkc-navy)', color: 'white' }}
                    >
                        {item.cta_text} →
                    </Link>
                )}
            </div>
        </motion.div>
    );
}

export function FeedSection() {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        supabase
            .from('member_feed_items')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(10)
            .then(({ data }) => {
                setItems(data || []);
            });
    }, []);

    const handleDismiss = (id: string) => {
        setDismissed(prev => new Set([...prev, id]));
    };

    const visibleItems = items.filter(i => !dismissed.has(i.id));

    if (visibleItems.length === 0) return null;

    return (
        <section className="w-full max-w-screen-xl mx-auto px-6 pb-8 pt-4">
            <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--muted-foreground)' }}>
                    From Your Church
                </p>
            </div>
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar webkit-scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    <AnimatePresence mode="popLayout">
                        {visibleItems.map(item => (
                            <div key={item.id} className="snap-start shrink-0 w-[85%] sm:w-[350px] min-h-[180px]">
                                <FeedCard item={item} onDismiss={handleDismiss} />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
