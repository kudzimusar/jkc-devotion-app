"use client";

/**
 * COCE Hub — Communications Engine
 * Replaces: src/app/shepherd/dashboard/newsletters/page.tsx
 *
 * Key fixes from audit:
 *   1. 'news_feed' table reference → 'member_feed_items' (correct table)
 *   2. 'newsletters' table now exists after 20260406000000_coce_foundation.sql
 *   3. AI Composer calls coce-compose Edge Function
 *   4. org_id sourced from useAdminCtx() — never hardcoded
 *   5. supabase anon client used (Mission Control uses supabaseAdmin
 *      via useAdminCtx context which handles auth — page-level reads
 *      use the standard client per project architecture)
 */

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, Plus, Trash2, Sparkles, TrendingUp, Trophy,
  Activity, FileText, X, Loader2, Megaphone,
  Mail, MessageSquare, Zap, Clock, CheckCircle,
  AlertTriangle, Globe
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminCtx } from "../Context";

// ============================================================
// Types
// ============================================================

interface Campaign {
  id: string;
  title: string;
  campaign_type: string;
  status: string;
  channels: string[];
  subject_en: string;
  ai_drafted: boolean;
  total_sent: number;
  total_opened: number;
  total_failed: number;
  created_at: string;
  sent_at: string | null;
  author?: { name: string }[] | null;
}

interface Newsletter {
  id: string;
  title: string;
  content: { message: string; impact_metrics: { salvations: number; growth: number; mission_progress: number } };
  published_at: string;
}

interface AiDraft {
  subject_en: string;
  subject_ja: string;
  body_en: string;
  body_ja: string;
  line_message_en?: string;
  line_message_ja?: string;
  sms_message_en?: string;
  sms_message_ja?: string;
  send_time_suggestion?: string;
}

const CAMPAIGN_TYPES = [
  { value: "newsletter", label: "Weekly Newsletter" },
  { value: "event", label: "Event Announcement" },
  { value: "sermon_followup", label: "Sermon Follow-up" },
  { value: "ministry_update", label: "Ministry Update" },
  { value: "emergency", label: "Emergency Alert" },
  { value: "devotion_reminder", label: "Devotion Reminder" },
  { value: "giving", label: "Giving Campaign" },
  { value: "welcome_sequence", label: "Welcome Sequence" },
  { value: "children_safety", label: "Children Safety Alert" },
  { value: "re_engagement", label: "Re-engagement" },
];

const AUDIENCE_SCOPES = [
  { value: "org_wide", label: "Entire Church" },
  { value: "ministry", label: "Specific Ministry" },
  { value: "small_group", label: "Small Group / Cell" },
  { value: "role", label: "By Role" },
  { value: "segment", label: "By Engagement Level" },
  { value: "individual", label: "Individual Member" },
];

const CHANNELS = [
  { value: "email", label: "Email", icon: "✉️" },
  { value: "line", label: "LINE", icon: "💬" },
  { value: "sms", label: "SMS", icon: "📱" },
  { value: "whatsapp", label: "WhatsApp", icon: "📲" },
  { value: "in_app", label: "In-App Feed", icon: "🔔" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  sending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

// ============================================================
// Component
// ============================================================

export default function COCEHub() {
  const { orgId } = useAdminCtx();

  // Tab state
  const [activeTab, setActiveTab] = useState<"compose" | "campaigns" | "feed" | "newsletters">("compose");

  // AI Composer state
  const [intent, setIntent] = useState("");
  const [campaignType, setCampaignType] = useState("newsletter");
  const [audienceScope, setAudienceScope] = useState("org_wide");
  const [targetId, setTargetId] = useState(""); // Stores specific ministry or member details
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email", "line"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "ja">("en");

  // Autocomplete targeting
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<"all" | "drafts" | "sent">("all");

  // Member Feed state (fixed: member_feed_items not news_feed)
  const [feedData, setFeedData] = useState({
    feed_type: "church_announcement",
    title: "",
    body: "",
    cta_text: "",
    cta_url: "",
    expires_at: "",
  });
  const [isPostingFeed, setIsPostingFeed] = useState(false);

  // Legacy newsletters
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loadingNewsletters, setLoadingNewsletters] = useState(false);
  const [isCreatingNewsletter, setIsCreatingNewsletter] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({
    title: "", message: "", salvations: 0, growth: 0, mission_progress: 0,
  });

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchCampaigns = async () => {
    if (!orgId) return;
    setLoadingCampaigns(true);
    try {
      const { data, error } = await supabase
        .from("communication_campaigns")
        .select("id, title, campaign_type, status, channels, subject_en, ai_drafted, total_sent, total_opened, total_failed, created_at, sent_at, author:profiles!created_by(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setCampaigns(data || []);
    } catch (e: any) {
      toast.error("Failed to load campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchNewsletters = async () => {
    if (!orgId) return;
    setLoadingNewsletters(true);
    try {
      const { data } = await supabase
        .from("newsletters")
        .select("*")
        .eq("org_id", orgId)
        .order("published_at", { ascending: false });
      setNewsletters(data || []);
    } finally {
      setLoadingNewsletters(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    fetchCampaigns();
    fetchNewsletters();
  }, [orgId]);

  // ============================================================
  // AI Composer
  // ============================================================

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleCompose = async () => {
    if (!intent.trim()) {
      toast.error("Describe what you want to communicate");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    if (!orgId) {
      toast.error("No organization context");
      return;
    }

    setIsComposing(true);
    setAiDraft(null);
    setDraftCampaignId(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coce-compose`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            org_id: orgId,
            intent,
            campaign_type: campaignType,
            audience_scope: audienceScope,
            target_id: targetId,
            channels: selectedChannels,
            scheduled_at: scheduledAt || undefined,
            created_by: user.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to generate draft");
      }

      setAiDraft(result.draft);
      setDraftCampaignId(result.campaign_id);
      
      // Instantly refetch campaigns so the newly saved draft is instantly visible in the Campaigns tab
      await fetchCampaigns();
      
      toast.success("Draft ready — review and send");
    } catch (e: any) {
      console.error("[coce-compose]", e);
      toast.error(e.message || "Failed to generate draft");
    } finally {
      setIsComposing(false);
    }
  };

  const handleSendDraft = async () => {
    if (!draftCampaignId) return;
    
    // First, update the campaign with any manual edits the user made
    try {
      const { error: updateError } = await supabase
        .from("communication_campaigns")
        .update({
          subject_en: aiDraft?.subject_en || null,
          subject_ja: aiDraft?.subject_ja || null,
          body_en: aiDraft?.body_en || null,
          body_ja: aiDraft?.body_ja || null,
          status: scheduledAt && new Date(scheduledAt) > new Date() ? "scheduled" : "sending",
        })
        .eq("id", draftCampaignId);

      if (updateError) throw updateError;

      // If scheduled in the future, we just leave it. If sending now, call the dispatch endpoint
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        toast.info("Sending message via dispatch...");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coce-dispatch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              campaign_id: draftCampaignId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Dispatch function failed to start");
        }
        toast.success("Message has been dispatched successfully!");
      } else {
        toast.success("Message scheduled successfully!");
      }
      
      // Clean up UI and fetch to reflect new status
      setAiDraft(null);
      setDraftCampaignId(null);
      fetchCampaigns();
    } catch (e: any) {
      console.error("[coce-send-draft]", e);
      toast.error(e.message || "Failed to send message");
    }
  };

  // Search logic for specific target
  useEffect(() => {
    if (!targetId || targetId.length < 2 || audienceScope === "org_wide" || audienceScope === "segment") {
      setFoundUsers([]);
      return;
    }
    const searchMembers = async () => {
      setIsSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, name")
          .eq("org_id", orgId)
          .or(`email.ilike.%${targetId}%,name.ilike.%${targetId}%`)
          .limit(5);
        if (data) setFoundUsers(data);
      } finally {
        setIsSearchingUsers(false);
      }
    };
    const timer = setTimeout(searchMembers, 400);
    return () => clearTimeout(timer);
  }, [targetId, orgId, audienceScope]);

  const loadDraft = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("communication_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      
      if (error) throw error;

      setCampaignType(data.campaign_type);
      setAudienceScope(data.audience_scope);
      setSelectedChannels(data.channels);
      setTargetId(data.audience_filter?.target_id || "");
      setIntent(data.ai_prompt_used || "Loaded from explicit draft.");
      
      setDraftCampaignId(data.id);
      setAiDraft({
        subject_en: data.subject_en,
        subject_ja: data.subject_ja,
        body_en: data.body_en,
        body_ja: data.body_ja,
        line_message_en: data.line_message_en || "",
        line_message_ja: data.line_message_ja || "",
        sms_message_en: "",
        sms_message_ja: "",
        send_time_suggestion: "Ready to send"
      });
      setActiveTab("compose");
    } catch (e: any) {
      toast.error("Failed to load draft");
    }
  };

  // ============================================================
  // Member Feed (fixed table name)
  // ============================================================

  const handlePostFeed = async () => {
    if (!feedData.title || !feedData.body) {
      toast.error("Title and message are required");
      return;
    }
    if (!orgId) return;

    setIsPostingFeed(true);
    try {
      // FIXED: was 'news_feed' (doesn't exist) → now 'member_feed_items'
      const { error } = await supabase.from("member_feed_items").insert({
        org_id: orgId,
        feed_type: feedData.feed_type,
        title: feedData.title,
        body: feedData.body,
        cta_text: feedData.cta_text || null,
        cta_url: feedData.cta_url || null,
        expires_at: feedData.expires_at || null,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Posted to member feed");
      setFeedData({ feed_type: "church_announcement", title: "", body: "", cta_text: "", cta_url: "", expires_at: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to post to feed");
    } finally {
      setIsPostingFeed(false);
    }
  };

  // ============================================================
  // Legacy Newsletter
  // ============================================================

  const handleCreateNewsletter = async () => {
    if (!newsletterForm.title || !newsletterForm.message) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orgId) return;
      const { error } = await supabase.from("newsletters").insert({
        org_id: orgId,
        title: newsletterForm.title,
        content: {
          message: newsletterForm.message,
          impact_metrics: {
            salvations: Number(newsletterForm.salvations),
            growth: Number(newsletterForm.growth),
            mission_progress: Number(newsletterForm.mission_progress),
          },
        },
        author_id: user.id,
        is_published: true,
      });
      if (error) throw error;
      toast.success("Newsletter published");
      setIsCreatingNewsletter(false);
      setNewsletterForm({ title: "", message: "", salvations: 0, growth: 0, mission_progress: 0 });
      fetchNewsletters();
    } catch (e: any) {
      toast.error("Failed to publish newsletter");
    }
  };

  const handleDeleteNewsletter = async (id: string) => {
    if (!confirm("Delete this newsletter?")) return;
    try {
      const { error } = await supabase.from("newsletters").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      fetchNewsletters();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ============================================================
  // Render
  // ============================================================

  const tabs = [
    { id: "compose", label: "AI Composer", icon: <Sparkles className="w-4 h-4" /> },
    { id: "campaigns", label: "Campaigns", icon: <Send className="w-4 h-4" /> },
    { id: "feed", label: "Member Feed", icon: <Megaphone className="w-4 h-4" /> },
    { id: "newsletters", label: "Newsletters", icon: <FileText className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto min-h-screen">

      {/* Header */}
      <header>
        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Communications</h1>
        <p className="text-muted-foreground font-medium mt-1">
          COCE — Church OS Comms Engine. AI-drafted, multi-channel, pastorally intelligent.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== AI COMPOSER TAB ===== */}
      {activeTab === "compose" && (
        <div className="space-y-6">

          {/* Intent input */}
          <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">AI Composer</h2>
                <p className="text-xs text-muted-foreground">Describe your message — AI drafts it in English and Japanese across all selected channels.</p>
              </div>
            </div>

            <Textarea
              placeholder={`Describe what you want to communicate...\n\nExamples:\n• "Encourage the worship team about last Sunday and remind them about Thursday rehearsal"\n• "Send a warm welcome to members who joined this month"\n• "Alert parents about the children's ministry schedule change on Sunday"`}
              value={intent}
              onChange={e => setIntent(e.target.value)}
              className="bg-muted border-border rounded-2xl min-h-[140px] text-foreground text-sm"
            />

            {/* Config row */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Message Type</label>
                <select
                  value={campaignType}
                  onChange={e => setCampaignType(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl h-11 px-3 text-sm text-foreground focus:border-primary outline-none"
                >
                  {CAMPAIGN_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Audience</label>
                <select
                  value={audienceScope}
                  onChange={e => {
                    setAudienceScope(e.target.value);
                    setTargetId(""); // Reset target id when scope changes
                  }}
                  className="w-full bg-muted border border-border rounded-xl h-11 px-3 text-sm text-foreground focus:border-primary outline-none"
                >
                  {AUDIENCE_SCOPES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="bg-muted border-border rounded-xl h-11 text-foreground text-sm"
                />
              </div>
            </div>

            {/* Sub-target selector ONLY IF specific targeting is requested */}
            <AnimatePresence>
              {(audienceScope !== "org_wide" && audienceScope !== "segment") && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">
                    Target {audienceScope.replace("_", " ")} Name or ID
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={`Enter ${audienceScope.replace("_", " ")} email specifically...`}
                      value={targetId}
                      onChange={e => setTargetId(e.target.value)}
                      className="bg-emerald-500/5 border-emerald-500/20 rounded-xl h-11 text-foreground text-sm focus:border-emerald-500"
                    />
                    {isSearchingUsers && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-emerald-500" />}
                  </div>
                  {foundUsers.length > 0 && targetId.length >= 2 && (
                    <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                      {foundUsers.map(u => (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted font-medium transition-colors border-b last:border-b-0 border-border truncate"
                          onClick={() => {
                            setTargetId(u.email);
                            setFoundUsers([]);
                          }}
                        >
                          <span className="text-foreground">{u.name || "Unnamed"} ({u.email})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Specify who exactly you are targeting (e.g. "John Doe" or "Youth Minstry").
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Channel toggles */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Channels</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.value}
                    onClick={() => toggleChannel(ch.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedChannels.includes(ch.value)
                        ? "bg-primary text-white border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    <span>{ch.icon}</span> {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCompose}
              disabled={isComposing || !intent.trim()}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl text-base shadow-lg"
            >
              {isComposing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Drafting with AI...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Draft with AI</>
              )}
            </Button>
          </div>

          {/* AI Draft Preview */}
          <AnimatePresence>
            {aiDraft && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="bg-card border border-primary/30 rounded-[2rem] p-6 md:p-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-black uppercase tracking-tight text-foreground">AI Draft Ready</h3>
                    {draftCampaignId && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[9px] font-black uppercase tracking-widest">
                        Saved as Draft
                      </Badge>
                    )}
                  </div>
                  {/* Language toggle */}
                  <div className="flex gap-1 bg-muted rounded-xl p-1">
                    <button
                      onClick={() => setPreviewLang("en")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${previewLang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setPreviewLang("ja")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${previewLang === "ja" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      日本語
                    </button>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                    <span className="font-extrabold text-foreground">Sender Note:</span> This message will be sent through <strong className="text-foreground">coce-dispatch</strong>. The system will automatically check each targeted member's <code className="text-[10px] text-primary">preferred_language</code> on their communication profile to decide whether to send the English or Japanese draft. The language toggle above is just to preview the generated drafts.
                  </p>
                </div>

                {/* Email preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Email</span>
                  </div>
                  <div className="bg-muted rounded-2xl p-4 space-y-2">
                    <Input
                      className="text-sm font-black text-foreground bg-transparent border-0 px-0 focus-visible:ring-0 shadow-none -ml-1 uppercase w-full"
                      value={previewLang === "en" ? aiDraft.subject_en : aiDraft.subject_ja}
                      onChange={e => {
                        const v = e.target.value;
                        setAiDraft(prev => prev ? (previewLang === "en" ? { ...prev, subject_en: v } : { ...prev, subject_ja: v }) : prev);
                      }}
                    />
                    <Textarea
                      className="text-sm text-foreground bg-transparent border-0 px-0 focus-visible:ring-0 shadow-none leading-relaxed resize-none min-h-[140px] w-full"
                      value={previewLang === "en" ? aiDraft.body_en : aiDraft.body_ja}
                      onChange={e => {
                        const v = e.target.value;
                        setAiDraft(prev => prev ? (previewLang === "en" ? { ...prev, body_en: v } : { ...prev, body_ja: v }) : prev);
                      }}
                    />
                  </div>
                </div>

                {/* LINE preview */}
                {(aiDraft.line_message_en || aiDraft.line_message_ja) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">LINE</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                      <Textarea
                        className="text-sm text-foreground bg-transparent border-0 px-0 focus-visible:ring-0 shadow-none leading-relaxed resize-none min-h-[60px] w-full"
                        value={previewLang === "en" ? aiDraft.line_message_en : aiDraft.line_message_ja}
                        onChange={e => {
                          const v = e.target.value;
                          setAiDraft(prev => prev ? (previewLang === "en" ? { ...prev, line_message_en: v } : { ...prev, line_message_ja: v }) : prev);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SMS preview */}
                {(aiDraft.sms_message_en || aiDraft.sms_message_ja) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">SMS</span>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                      <p className="text-sm text-foreground leading-relaxed">
                        {previewLang === "en" ? aiDraft.sms_message_en : aiDraft.sms_message_ja}
                      </p>
                    </div>
                  </div>
                )}

                {/* Send time suggestion */}
                {aiDraft.send_time_suggestion && (
                  <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{aiDraft.send_time_suggestion}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSendDraft}
                    className="flex-1 h-12 bg-primary text-white font-black rounded-2xl"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setAiDraft(null); setDraftCampaignId(null); }}
                    className="h-12 px-6 rounded-2xl font-black"
                  >
                    <X className="w-4 h-4 mr-2" /> Discard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ===== CAMPAIGNS TAB ===== */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[
              { id: "all", label: "All Campaigns" },
              { id: "drafts", label: "Drafts & Scheduled" },
              { id: "sent", label: "Sent out" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCampaignFilter(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                  campaignFilter === f.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingCampaigns ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-32 bg-card border border-dashed border-border rounded-[3rem]">
              <Send className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No campaigns yet — use AI Composer to draft your first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns
                .filter(c => {
                  if (campaignFilter === "drafts") return c.status === "draft" || c.status === "scheduled";
                  if (campaignFilter === "sent") return c.status === "sent" || c.status === "sending";
                  return true;
                })
                .map(c => (
                <div key={c.id} className="bg-card hover:bg-muted/50 border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    {c.ai_drafted ? (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="font-black text-foreground truncate text-base">{c.title || c.subject_en || "Untitled Campaign"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2 truncate">
                        Created by <span className="font-bold text-foreground">{c.author?.[0]?.name || "System Base"}</span>
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>
                          {c.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {c.campaign_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {c.channels.join(" · ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0 md:justify-end pt-4 md:pt-0 border-t border-border md:border-0">
                    <div className="flex gap-4">
                      {c.status === "sent" && (
                        <>
                          <div className="flex flex-col text-center">
                            <span className="text-sm font-black text-foreground">{c.total_sent}</span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Sent</span>
                          </div>
                          <div className="flex flex-col text-center">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{c.total_opened}</span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Opened</span>
                          </div>
                          {c.total_failed > 0 && (
                            <div className="flex flex-col text-center">
                              <span className="text-sm font-black text-red-600 dark:text-red-400">{c.total_failed}</span>
                              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Failed</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {(c.status === "draft" || c.status === "scheduled") ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => loadDraft(c.id)}
                            className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-4 rounded-xl text-xs font-black transition-all"
                          >
                            Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 hover:text-red-500 rounded-xl"
                            onClick={async () => {
                              if(confirm('Delete draft completely?')) {
                                await supabase.from('communication_campaigns').delete().eq('id', c.id);
                                fetchCampaigns();
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-2 border-l border-border pl-4">
                           <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toast.info('Preview currently disabled for sent messages')}
                            className="h-9 px-4 rounded-xl text-xs font-black transition-all"
                           >
                            View
                           </Button>
                           <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 hover:text-red-500 rounded-xl"
                            onClick={async () => {
                              if(confirm('Archive message? It will be preserved for history.')) {
                                toast.success('Message Archived');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MEMBER FEED TAB ===== */}
      {activeTab === "feed" && (
        <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Post to Member Feed</h2>
              <p className="text-xs text-muted-foreground">Appears on the member dashboard for logged-in members</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Feed Type</label>
                <select
                  value={feedData.feed_type}
                  onChange={e => setFeedData({ ...feedData, feed_type: e.target.value })}
                  className="w-full bg-muted border border-border rounded-xl h-11 px-3 text-sm text-foreground focus:border-primary outline-none"
                >
                  <option value="church_announcement">Church Announcement</option>
                  <option value="event_notification">Event Notification</option>
                  <option value="growth_nudge">Growth Nudge</option>
                  <option value="ministry_invitation">Ministry Invitation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Title *</label>
                <Input
                  placeholder="e.g. Prayer Night this Friday"
                  value={feedData.title}
                  onChange={e => setFeedData({ ...feedData, title: e.target.value })}
                  className="bg-muted border-border rounded-xl h-11"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Message *</label>
                <Textarea
                  placeholder="What's happening?"
                  value={feedData.body}
                  onChange={e => setFeedData({ ...feedData, body: e.target.value })}
                  className="bg-muted border-border rounded-2xl min-h-[100px]"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">CTA Text</label>
                  <Input
                    placeholder="LEARN MORE"
                    value={feedData.cta_text}
                    onChange={e => setFeedData({ ...feedData, cta_text: e.target.value })}
                    className="bg-muted border-border rounded-xl h-11"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">CTA URL</label>
                  <Input
                    placeholder="https://..."
                    value={feedData.cta_url}
                    onChange={e => setFeedData({ ...feedData, cta_url: e.target.value })}
                    className="bg-muted border-border rounded-xl h-11"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Expires At (Optional)</label>
                <Input
                  type="date"
                  value={feedData.expires_at}
                  onChange={e => setFeedData({ ...feedData, expires_at: e.target.value })}
                  className="bg-muted border-border rounded-xl h-11"
                />
              </div>
              <Button
                onClick={handlePostFeed}
                disabled={isPostingFeed}
                className="w-full h-12 bg-primary text-white font-black rounded-2xl mt-4"
              >
                {isPostingFeed ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Post to Member Feed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NEWSLETTERS TAB ===== */}
      {activeTab === "newsletters" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCreatingNewsletter(true)}
              className="bg-primary text-white font-black rounded-2xl h-11 px-6"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Weekly Update
            </Button>
          </div>

          <AnimatePresence>
            {isCreatingNewsletter && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="bg-card border border-border rounded-[2rem] p-6 md:p-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> New Weekly Victory
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsCreatingNewsletter(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="e.g. The Wind of Grace: Week 24"
                      value={newsletterForm.title}
                      onChange={e => setNewsletterForm({ ...newsletterForm, title: e.target.value })}
                      className="bg-muted border-border rounded-xl h-11"
                    />
                    <Textarea
                      placeholder="Share the word, the vision, and the thanks..."
                      value={newsletterForm.message}
                      onChange={e => setNewsletterForm({ ...newsletterForm, message: e.target.value })}
                      className="bg-muted border-border rounded-2xl min-h-[160px]"
                    />
                  </div>
                  <div className="bg-muted rounded-[1.5rem] p-5 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Impact Metrics</p>
                    {[
                      { key: "salvations", label: "Salvations This Quarter", icon: <Trophy className="w-3.5 h-3.5 text-emerald-500" /> },
                      { key: "growth", label: "New Members", icon: <TrendingUp className="w-3.5 h-3.5 text-primary" /> },
                      { key: "mission_progress", label: "Mission Progress %", icon: <Activity className="w-3.5 h-3.5 text-blue-500" /> },
                    ].map(f => (
                      <div key={f.key}>
                        <div className="flex items-center gap-2 mb-1">
                          {f.icon}
                          <label className="text-[10px] font-black text-muted-foreground uppercase">{f.label}</label>
                        </div>
                        <Input
                          type="number"
                          value={(newsletterForm as any)[f.key]}
                          onChange={e => setNewsletterForm({ ...newsletterForm, [f.key]: parseInt(e.target.value) || 0 })}
                          className="bg-card border-border rounded-xl h-10"
                        />
                      </div>
                    ))}
                    <Button onClick={handleCreateNewsletter} className="w-full h-12 bg-primary text-white font-black rounded-2xl mt-2">
                      Publish to All Profiles
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingNewsletters ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-32 bg-card border border-dashed border-border rounded-[3rem]">
              <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No newsletters published yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {newsletters.map(n => (
                <Card key={n.id} className="bg-card border-border rounded-[2rem] overflow-hidden group hover:bg-muted transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-primary/10 text-primary border-0 text-[9px] font-black uppercase tracking-widest">
                        {new Date(n.published_at).toLocaleDateString()}
                      </Badge>
                      <button onClick={() => handleDeleteNewsletter(n.id)} className="text-muted-foreground/30 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <CardTitle className="text-foreground font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors text-base">
                      {n.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {n.content?.message}
                    </p>
                    <div className="flex items-center gap-4 pt-3 border-t border-border">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">+{n.content?.impact_metrics?.growth}</span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase">Growth</span>
                      </div>
                      <div className="flex flex-col border-l border-border pl-4">
                        <span className="text-[10px] font-black text-primary">{n.content?.impact_metrics?.salvations}</span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase">Souls</span>
                      </div>
                      <div className="flex flex-col border-l border-border pl-4">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{n.content?.impact_metrics?.mission_progress}%</span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase">Mission</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
