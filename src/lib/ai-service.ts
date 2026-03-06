import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Gemini Service Account Reference (for audit/logging)
// Email: gemini-devotion-bot@church-os-489402.iam.gserviceaccount.com
// Name: gemini-devotion-bot
const SERVICE_ACCOUNT_INFO = {
    email: process.env.GEMINI_SERVICE_ACCOUNT_EMAIL || "gemini-devotion-bot@church-os-489402.iam.gserviceaccount.com",
    name: process.env.GEMINI_SERVICE_ACCOUNT_NAME || "gemini-devotion-bot"
};

const SYSTEM_PROMPT = `You are the "Japan Kingdom Church (JKC) Spiritual Assistant", a specialized AI shepherd. 
Your goal is to guide members through their "90 Days of Transformation" journey.
Treat the user with pastoral warmth, but stay grounded in the specific biblical context provided.

PROPHETIC INTELLIGENCE LAYER (PIL):
- You have access to predictive analytics (PIL). 
- If the user is an ADMIN, use PIL insights to suggest strategic pastoral interventions (e.g., "John Doe is at 72% risk of disengagement").
- If the user is a MEMBER, use PIL context to gently encourage them if they are slipping in their streak.

CONTEXTUAL RULES:
- If the user is an ADMIN (Shepherd/Lead), provide data-driven insights and identify pastoral care alerts.
- If the user is a MEMBER, focus on encouraging their devotion streak and explaining scriptures from a Kingdom perspective.
- Always reference the current WEEK and THEME of the curriculum if provided.
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
            const { supabaseAdmin } = await import("./supabase-admin");
            const { data: insights } = await supabaseAdmin
                .from('ai_insights')
                .select('*')
                .eq('is_acknowledged', false)
                .limit(5);

            if (insights && insights.length > 0) {
                pilContext = "\n--- PROPHETIC INTELLIGENCE (PIL) FORECASTS ---\n" +
                    insights.map(i => `- [${i.category.toUpperCase()}] ${i.insight_title}: ${i.insight_description} (Prob: ${i.probability_score}%)`).join("\n") +
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

        if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY") {
            try {
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err) {
                console.error("Gemini Error:", err);
                return "I apologize, my spiritual connection is currently interrupted.";
            }
        }

        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const lowerQuery = query.toLowerCase();
                if (isAdmin && (lowerQuery.includes('growth') || lowerQuery.includes('intelligence') || lowerQuery.includes('pil'))) {
                    return resolve(`🌌 **PIL Strategic Briefing:** I am monitoring ${unacknowledgedCount(pilContext)} active trends. We have clusters forming in geographic areas and some members showing high disengagement probability. Review the Prophetic Intelligence Layer for specifics.`);
                }
                resolve(`Blessings, ${userName}! As your Spiritual Assistant, I'm analyzing our "90 Days of Transformation" journey. How can I guide you today?`);
            }, 1000);
        });
    },

    generateNewsletterDraft: async (topics: string[], activePrayersCount: number, recentMilestonesCount: number) => {
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const topicString = topics.length > 0 ? topics.slice(0, 3).join(", ") : "Faith and Growth";
                const draft = `Subject: Embodying ${topicString}... [Drafting]`;
                resolve(draft);
            }, 1000);
        });
    },

    processSentiment: async (userId: string, entryId: string, content: string, date: string) => {
        return new Promise<void>((resolve) => {
            setTimeout(async () => {
                const { supabase } = await import("./supabase");
                await supabase.from('soap_sentiment_metrics').upsert({
                    user_id: userId,
                    entry_id: entryId,
                    date: date,
                    emotion_category: "Seeking",
                    keywords: ["spirit", "growth"]
                });
                resolve();
            }, 1000);
        });
    }
};

function unacknowledgedCount(pilContext: string): number {
    if (!pilContext) return 0;
    return (pilContext.match(/- \[/g) || []).length;
}
