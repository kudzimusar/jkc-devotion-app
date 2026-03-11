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
        accentColor: 'text-white/70',
        bgColor: 'bg-white/5',
        borderColor: 'border-white/10',
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`relative rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} p-4 overflow-hidden`}
        >
            {/* Subtle glow */}
            <div className={`absolute inset-0 opacity-[0.03] ${cfg.bgColor} pointer-events-none`} />

            <div className="relative flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${cfg.bgColor} border ${cfg.borderColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${cfg.accentColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${cfg.accentColor}`}>
                            {cfg.badgeLabel}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-white leading-snug">{item.title}</p>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.body}</p>

                    {item.cta_text && item.cta_url && (
                        <Link
                            href={item.cta_url}
                            className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[10px] font-black 
                                ${cfg.bgColor} border ${cfg.borderColor} ${cfg.accentColor} hover:brightness-110 transition-all`}
                        >
                            {item.cta_text} →
                        </Link>
                    )}
                </div>

                <button
                    onClick={() => onDismiss(item.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors flex-shrink-0"
                >
                    <X className="w-3 h-3" />
                </button>
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
        <section className="w-full max-w-xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-white/30" />
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">
                    From Your Church
                </p>
            </div>
            <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                    {visibleItems.map(item => (
                        <FeedCard key={item.id} item={item} onDismiss={handleDismiss} />
                    ))}
                </div>
            </AnimatePresence>
        </section>
    );
}
