"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, X, ChevronRight, AlertTriangle, Users, Heart,
    TrendingUp, DollarSign, Sparkles, Flame, Brain, Clock,
    UserCheck, Zap, CheckCircle2
} from "lucide-react";

interface ManualStep {
    step: number;
    instruction: string;
}

interface LayerGuide {
    id: string;
    icon: any;
    color: string;
    badge: string;
    title: string;
    sourceView: string;
    what: string;
    triggers: string;
    steps: ManualStep[];
    expectedResult: string;
}

const LAYERS: LayerGuide[] = [
    {
        id: "crisis",
        icon: AlertTriangle,
        color: "text-red-500",
        badge: "bg-red-500/10 border-red-500/20",
        title: "Crisis Early Warning",
        sourceView: "vw_crisis_early_warning",
        what: "Detects members in spiritual or emotional crisis by cross-referencing devotion silence, urgent prayer requests, and negative SOAP sentiment.",
        triggers: "7+ days silence OR active crisis prayer OR SOAP sentiment with 'anxiety/despair'",
        steps: [
            { step: 1, instruction: "Log into a member account and submit a Prayer Request with urgency set to 'Crisis'" },
            { step: 2, instruction: "Return to Shepherd HQ → AI Command Center" },
            { step: 3, instruction: "Click 'Run Full Sweep' and wait 5–10 seconds" },
            { step: 4, instruction: "Look for a red card labelled 'Crisis Alert: [Member Name]'" },
            { step: 5, instruction: "Expand the card to see the crisis score (0–100) and recommended pastoral action" },
        ],
        expectedResult: "Red card with risk_level: critical or high, member name, and an immediate pastoral intervention recommendation."
    },
    {
        id: "retention",
        icon: UserCheck,
        color: "text-orange-500",
        badge: "bg-orange-500/10 border-orange-500/20",
        title: "90-Day Onboarding Health",
        sourceView: "vw_new_member_90day_health",
        what: "Tracks every new member's first 90 days. Zero connections within 30 days = high attrition risk.",
        triggers: "Joined < 90 days ago AND zero attendance + zero ministry + zero group",
        steps: [
            { step: 1, instruction: "In Supabase → profiles, find a user with joined_at within the last 90 days" },
            { step: 2, instruction: "Confirm they have no attendance_records, ministry_members, or bible_study_group_members" },
            { step: 3, instruction: "Run Full Sweep → look for 'Onboarding Risk: [Name]' (orange border)" },
        ],
        expectedResult: "Orange card showing health status 'At Risk', attrition risk score, and welcome buddy recommendation."
    },
    {
        id: "isolation",
        icon: Users,
        color: "text-violet-500",
        badge: "bg-violet-500/10 border-violet-500/20",
        title: "Community Isolation Risk",
        sourceView: "vw_community_isolation_risk",
        what: "Identifies established members with zero structural church connections — the #1 predictor of attrition.",
        triggers: "Joined 30+ days ago AND zero ministry memberships AND zero group memberships",
        steps: [
            { step: 1, instruction: "Find a member in Supabase with no ministry_members and no bible_study_group_members rows" },
            { step: 2, instruction: "Confirm their joined_at is at least 31 days ago" },
            { step: 3, instruction: "Run Full Sweep → look for 'Isolation Risk: [Name]' (violet border)" },
        ],
        expectedResult: "Violet card with ministry_count: 0 and group_count: 0, recommending a specific group invitation."
    },
    {
        id: "spiritual_climate",
        icon: Sparkles,
        color: "text-blue-500",
        badge: "bg-blue-500/10 border-blue-500/20",
        title: "Spiritual Climate Forecast",
        sourceView: "vw_spiritual_climate_forecast",
        what: "Detects emotional shifts across the whole congregation by aggregating sentiment from SOAP journals.",
        triggers: "Any negative sentiment ('anxiety/despair/broken') in SOAP entries in the last 7 days",
        steps: [
            { step: 1, instruction: "Log in as a member and submit a SOAP journal" },
            { step: 2, instruction: "In Supabase soap_entries, set sentiment = 'anxiety, despair' for a test entry" },
            { step: 3, instruction: "Run Full Sweep → look for 'Spiritual Climate: Shift Detected'" },
        ],
        expectedResult: "Org-level insight card with negative entry count and a recommended sermon theme for the upcoming Sunday."
    },
    {
        id: "pastoral_load",
        icon: Heart,
        color: "text-amber-500",
        badge: "bg-amber-500/10 border-amber-500/20",
        title: "Pastoral Care Load",
        sourceView: "vw_pastoral_care_load",
        what: "Measures the total shepherding burden and flags when the Pastor's care capacity is at risk of burnout.",
        triggers: "10+ active counseling cases OR any overdue pastoral follow-up",
        steps: [
            { step: 1, instruction: "In Supabase → pastoral_notes, insert a note with follow_up_date = yesterday and is_resolved = false" },
            { step: 2, instruction: "Run Full Sweep → look for 'Pastoral Load: Burnout Risk'" },
        ],
        expectedResult: "Amber card showing total active cases, overdue follow-ups, and a delegation recommendation to ministry leads."
    },
    {
        id: "stewardship",
        icon: DollarSign,
        color: "text-emerald-500",
        badge: "bg-emerald-500/10 border-emerald-500/20",
        title: "Giving Health Index",
        sourceView: "vw_giving_health_index",
        what: "Tracks giving loyalty, not amounts. Flags members who gave consistently but stopped — often a sign of personal struggle.",
        triggers: "Member gave 31–60 days ago but has NO giving record in the last 30 days",
        steps: [
            { step: 1, instruction: "In Supabase → financial_records, ensure a member has a record 31–60 days ago but none in the last 30 days" },
            { step: 2, instruction: "Run Full Sweep → look for 'Stewardship: Giving Consistency Drop'" },
        ],
        expectedResult: "Green/amber card showing active vs. lapsed giver counts with a recommended pastoral care outreach."
    },
    {
        id: "growth",
        icon: TrendingUp,
        color: "text-emerald-500",
        badge: "bg-emerald-500/10 border-emerald-500/20",
        title: "Evangelism ROI",
        sourceView: "vw_evangelism_roi",
        what: "Identifies your most effective soul-winners by measuring referral-to-conversion rates for every member.",
        triggers: "Any member with at least 1 person in the evangelism pipeline at a converted stage",
        steps: [
            { step: 1, instruction: "In Supabase → evangelism_pipeline, add a record with invited_by = [member_uuid] and stage = 'decision'" },
            { step: 2, instruction: "Run Full Sweep → look for 'Growth Catalyst: [Member Name]' (green border)" },
        ],
        expectedResult: "Green card showing referrer name, conversion count, and conversion rate % with a recognition/leadership recommendation."
    },
    {
        id: "content",
        icon: Zap,
        color: "text-blue-500",
        badge: "bg-blue-500/10 border-blue-500/20",
        title: "Sermon Impact Analytics",
        sourceView: "vw_sermon_impact_analytics",
        what: "Correlates sermon publication dates with SOAP journal spikes in the following week — revealing which topics truly move the congregation.",
        triggers: "Published sermon with SOAP journals submitted within 7 days after the sermon date",
        steps: [
            { step: 1, instruction: "Confirm a published sermon exists in public_sermons with a past date" },
            { step: 2, instruction: "Confirm SOAP entries from members were created within 7 days after that sermon" },
            { step: 3, instruction: "Run Full Sweep → look for 'High Impact Content: [Sermon Title]'" },
        ],
        expectedResult: "Blue card linking the sermon to journal count, showing which themes drive spiritual engagement."
    },
    {
        id: "burnout",
        icon: Flame,
        color: "text-orange-500",
        badge: "bg-orange-500/10 border-orange-500/20",
        title: "Volunteer Burnout Risk",
        sourceView: "vw_volunteer_burnout_risk",
        what: "Identifies over-serving members who are active in 3+ ministries but whose Sunday attendance is declining.",
        triggers: "3+ active ministry roles AND fewer than 3 attendances in the last 30 days",
        steps: [
            { step: 1, instruction: "Find a member with 3+ entries in ministry_members where is_active = true" },
            { step: 2, instruction: "Confirm their attendance_records shows < 3 events in the last 30 days" },
            { step: 3, instruction: "Run Full Sweep → look for 'Volunteer Burnout: [Name]' (orange border)" },
        ],
        expectedResult: "Orange card showing ministry load count, attendance drop, and a mandatory rest period recommendation."
    },
    {
        id: "ai",
        icon: Brain,
        color: "text-primary",
        badge: "bg-primary/10 border-primary/20",
        title: "Gemini AI Cross-Domain Insights",
        sourceView: "Gemini 2.5 Flash (all layers combined)",
        what: "Uses all 12 data layers as context to generate 3–5 high-level strategic insights that cross domains — e.g., correlating financial stress prayers with giving drops.",
        triggers: "Runs automatically at the end of every Full Sweep if GEMINI API KEY is configured",
        steps: [
            { step: 1, instruction: "Confirm NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local" },
            { step: 2, instruction: "Click 'Run Full Sweep' in AI Command Center" },
            { step: 3, instruction: "Open browser console to confirm: ✅ PIL Engine: Sweep Complete." },
            { step: 4, instruction: "Scroll to the 'Gemini AI Ministry Insights' panel at the top" },
            { step: 5, instruction: "Click 'Approve' to push an insight to member feeds, or 'Dismiss' to archive it" },
        ],
        expectedResult: "3–5 cross-domain insight cards, colour-coded by category, with urgency tags and recommended pastoral actions."
    },
];

export function IntelligenceManualPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const [activeLayer, setActiveLayer] = useState<string | null>(null);

    const active = LAYERS.find(l => l.id === activeLayer);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all text-[10px] font-black text-primary uppercase tracking-widest"
            >
                <BookOpen className="w-3.5 h-3.5" />
                Intelligence Guide
            </button>

            {/* Modal */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-foreground">Intelligence Layer Guide</h2>
                                        <p className="text-[10px] text-muted-foreground">How to test and understand each AI insight</p>
                                    </div>
                                </div>
                                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Layer List */}
                                <div className="w-64 border-r border-border flex-shrink-0 overflow-y-auto p-3 space-y-1">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-3">
                                        {LAYERS.length} Intelligence Layers
                                    </p>
                                    {LAYERS.map(layer => {
                                        const Icon = layer.icon;
                                        const isActive = activeLayer === layer.id;
                                        return (
                                            <button
                                                key={layer.id}
                                                onClick={() => setActiveLayer(isActive ? null : layer.id)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                                                    isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
                                                }`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-primary' : layer.color}`} />
                                                <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                                    {layer.title}
                                                </span>
                                                <ChevronRight className={`w-3 h-3 ml-auto flex-shrink-0 transition-transform text-muted-foreground/30 ${isActive ? 'rotate-90' : ''}`} />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Detail Panel */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {!active ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-primary/30" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground">Select an Intelligence Layer</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">Pick a layer from the list to see how to test it and what it means</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            key={active.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-5"
                                        >
                                            {/* Title */}
                                            <div className={`p-4 rounded-2xl border ${active.badge} flex items-center gap-3`}>
                                                {(() => { const Icon = active.icon; return <Icon className={`w-5 h-5 ${active.color} flex-shrink-0`} />; })()}
                                                <div>
                                                    <h3 className="text-sm font-black text-foreground">{active.title}</h3>
                                                    <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{active.sourceView}</p>
                                                </div>
                                            </div>

                                            {/* What it does */}
                                            <div>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">What It Does</p>
                                                <p className="text-xs text-foreground leading-relaxed">{active.what}</p>
                                            </div>

                                            {/* Trigger */}
                                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                                <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Trigger Condition</p>
                                                <p className="text-xs text-foreground">{active.triggers}</p>
                                            </div>

                                            {/* Steps */}
                                            <div>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">How To Test</p>
                                                <div className="space-y-2">
                                                    {active.steps.map(s => (
                                                        <div key={s.step} className="flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                {s.step}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">{s.instruction}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Expected Result */}
                                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expected Result</p>
                                                </div>
                                                <p className="text-xs text-foreground">{active.expectedResult}</p>
                                            </div>

                                            {/* Where to find it */}
                                            <div className="p-3 bg-muted/50 border border-border rounded-xl">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Where to Find It</p>
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="font-bold text-foreground">Shepherd HQ → AI Command Center</span> → Run Full Sweep → look in the Rule-Based Forecasts panel or Gemini AI Insights panel above.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-border flex-shrink-0 flex items-center justify-between">
                                <p className="text-[9px] text-muted-foreground">Church OS · Prophetic Intelligence Layer · 13 Active Models</p>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-muted-foreground/30" />
                                    <p className="text-[9px] text-muted-foreground/30">Auto-sweeps every 4 hours</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
