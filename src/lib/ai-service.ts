import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy Initialization helper to ensure environment variables are ready
let genAI: any = null;
let model: any = null;

const getAIModel = () => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key || key === "YOUR_GEMINI_API_KEY" || key.trim() === "") return null;
    if (!model) {
        genAI = new GoogleGenerativeAI(key);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    return model;
};

// Gemini Service Account Reference (for audit/logging)
// Email: gemini-devotion-bot@church-os-489402.iam.gserviceaccount.com
// Name: gemini-devotion-bot
const SERVICE_ACCOUNT_INFO = {
    email: process.env.GEMINI_SERVICE_ACCOUNT_EMAIL || "gemini-devotion-bot@church-os-489402.iam.gserviceaccount.com",
    name: process.env.GEMINI_SERVICE_ACCOUNT_NAME || "gemini-devotion-bot"
};

const SYSTEM_PROMPT = `You are the "Japan Kingdom Church (JKC) Spiritual Assistant", a specialized AI shepherd. 
Your goal is to guide members through their "90 Days of Transformation" journey and onboard them to the Church OS platform.

ONBOARDING & FEATURE GUIDANCE:
- If a user is NEW (Visitor/Pending), prioritize guiding them through the setup:
  1. Complete their Identity Profile (Gender, Birthdate, Contact).
  2. Join a Fellowship Circle for community.
  3. Register children for Junior Church.
  4. Explain how to use the Daily Devotion page (S.O.A.P format).
- Explain technical features if requested (e.g., "How do I add a skill?", "Where do I see my giving history?").

PROPHETIC INTELLIGENCE LAYER (PIL):
- You have access to predictive analytics (PIL). 
- If the user is an ADMIN, use PIL insights to suggest strategic pastoral interventions (e.g., "John Doe is at 72% risk of disengagement").
- If the user is a MEMBER, use PIL context to gently encourage them if they are slipping in their streak.

STYLING & PERSONALIZATION:
- Treat the user with pastoral warmth, but stay grounded in the specific biblical context provided.
- Use the user's name and stats (streak/completion) to personalize the response.
- Keep responses concise but spiritually rich.`;

export const AIService = {
    generateHeroMessage: (streak: number, completed: number, total: number = 90) => {
        const percentage = Math.round((completed / total) * 100) || 0;
        let message = "Welcome! Let's begin your 90 Days of Transformation today.";
        if (streak > 0) {
            if (streak >= 7) {
                message = `Incredible focus! You are on a ${streak}-day streak. The Spirit is moving.`;
            } else if (streak >= 3) {
                message = `Welcome back! A solid ${streak}-day streak. Let's build on this momentum.`;
            } else {
                message = `Welcome back! You're on a ${streak}-day streak. Let's focus on today's declaration.`;
            }
        } else if (completed > 0) {
            message = "Welcome back! Let's restart your streak today and dive into the Word.";
        }
        if (percentage >= 10 && percentage < 100) {
            message += ` You are ${percentage}% through the journey.`;
        } else if (percentage === 100) {
            message = "Congratulations! You have completed the 90 Days of Transformation.";
        }
        return message;
    },

    askBibleChat: async (scripture: string, question: string) => {
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                resolve(`Regarding "${scripture}": Here is an AI-generated reflection exploring the context of your question: "${question}".\n\nThe passage emphasizes God's enduring faithfulness.`);
            }, 1000);
        });
    },

    chatWithGlobalAssistant: async (userRole: string, userName: string, query: string, contextPayload?: any, chatHistory?: { role: string, content: string }[]) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';

        let pilContext = "";
        try {
            const { supabase } = await import("./supabase");
            const [insightsRes, feedRes] = await Promise.all([
                supabase.from('prophetic_insights').select('*').eq('is_acknowledged', false).limit(5),
                supabase.from('vw_ministry_intelligence_feed').select('*').limit(10)
            ]);

            const insights = insightsRes.data || [];
            const feed = feedRes.data || [];

            if (insights.length > 0 || feed.length > 0) {
                pilContext = "\n--- PROPHETIC INTELLIGENCE (PIL) FORECASTS ---\n" +
                    insights.map((i: any) => `- [${i.category.toUpperCase()}] ${i.insight_title}: ${i.insight_description} (Prob: ${i.probability_score}%)`).join("\n") +
                    "\n\n--- OPERATIONAL INTELLIGENCE (MIL) FEED ---\n" +
                    feed.map((f: any) => `- ${f.metric_type}: ${f.detail} on ${f.event_date} (Val: ${f.value}) - ${f.context}`).join("\n") +
                    "\n--- END PIL ---";
            }
        } catch (e) {
            console.error("PIL Context Fetch Error:", e);
        }

        const contextStr = contextPayload ? `
        --- CURRENT USER STATE ---
        Name: ${userName}
        Role: ${userRole}
        Stats: ${JSON.stringify(contextPayload.stats)}
        Active Devotion: ${JSON.stringify(contextPayload.devotion)}
        Date: ${contextPayload.currentDate}
        ${pilContext}
        --- END CONTEXT ---
        ` : "";

        const historyStr = chatHistory?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") || "";
        const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextStr}\n\nCONVERSATION HISTORY:\n${historyStr}\n\nUSER QUESTION: ${query}\n\nRESPONSE:`;

        const aiModel = getAIModel();

        if (aiModel) {
            try {
                const result = await aiModel.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();
                if (text && text.length > 5) return text;
                throw new Error("Empty AI response");
            } catch (err) {
                console.error("Gemini Production Error:", err);
                // Graceful degradation with contextual intelligent fallback
                if (query.toLowerCase().includes("profile")) return "Your profile is the 'Digital Heart' of your ministry. You can update your Identity, add Skills for the gap analysis, and link your family in the 'Family & Households' section.";
                if (query.toLowerCase().includes("membership")) return "To submit a Membership Request, use the 'Request Membership' button on your profile card. This alerts our leadership team to begin your official discipleship onboarding.";
                return "I apologize, my spiritual connection is temporarily interrupted. I am here to guide you through your Devotions and Profile setup. What can I assist with specifically?";
            }
        }

        // Diagnostic Fallback for lack of API Key
        const fallbackResponse = `Blessings, ${userName}! (Note: AI reasoning is currently in diagnostic mode). I see you are ${userRole || 'exploring'} the platform. 
        You can complete your profile identity to helps us understand your gifts, join a Fellowship Circle for midweek connection, or link your children for Junior Church check-ins. 
        How can I guide your transformation today?`;

        return new Promise<string>((resolve) => {
            setTimeout(() => resolve(fallbackResponse), 800);
        });
    },

    generateNewsletterDraft: async (topics: string[], activePrayersCount: number, recentMilestonesCount: number) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY") {
            try {
                const prompt = `Draft a church newsletter covering: ${topics.join(", ")}. Mention we have ${activePrayersCount} active prayers and ${recentMilestonesCount} new milestones. Use a warm, visionary tone.`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (e) {
                return `Subject: Weekly Kingdom Briefing\n\nWe are celebrating ${recentMilestonesCount} breakthroughs this week! Join us as we focus on ${topics[0] || 'Faith'}.`;
            }
        }
        return `Subject: Weekly Kingdom Briefing\n\nWe are celebrating ${recentMilestonesCount} breakthroughs this week! Join us as we focus on ${topics[0] || 'Faith'}.`;
    },

    processSentiment: async (userId: string, entryId: string, content: string, date: string) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        let category = "Seeking";
        let keywords = ["Growth"];

        if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY") {
            try {
                const prompt = `Analyze the sentiment and key spiritual themes of this devotion entry: "${content}". Return JSON: {category: string, keywords: string[]}`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const data = JSON.parse(response.text().replace(/```json|```/g, ""));
                category = data.category;
                keywords = data.keywords;
            } catch (e) {
                console.error("Sentiment AI error", e);
            }
        }

        const { supabase } = await import("./supabase");
        await supabase.from('soap_sentiment_metrics').upsert({
            user_id: userId,
            entry_id: entryId,
            date: date,
            emotion_category: category,
            keywords: keywords
        }, { onConflict: 'entry_id' });
    }
};

function unacknowledgedCount(pilContext: string): number {
    if (!pilContext) return 0;
    return (pilContext.match(/- \[/g) || []).length;
}
