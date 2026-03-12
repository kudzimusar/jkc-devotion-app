import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy Initialization helper to ensure environment variables are ready
let genAI: any = null;
let model: any = null;

const intelligentFallback = (userRole: string, userName: string, query: string, contextPayload?: any, chatHistory?: { role: string, content: string }[]): string => {
    const lowerQuery = query.toLowerCase();
    const historyCount = chatHistory?.length || 0;
    const isFollowUp = historyCount > 0;
    const d = contextPayload?.devotion;
    const s = contextPayload?.stats;

    // 1. Identify Intent
    const intents = {
        greeting: lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey") || lowerQuery.includes("blessings"),
        verseRequest: lowerQuery.includes("today") || lowerQuery.includes("verse") || lowerQuery.includes("focus") || lowerQuery.includes("declaration"),
        deepDive: lowerQuery.includes("more") || lowerQuery.includes("deep") || lowerQuery.includes("mean") || lowerQuery.includes("explain") || lowerQuery.includes("history") || lowerQuery.includes("roots") || lowerQuery.includes("context") || lowerQuery.includes("discuss") || lowerQuery.includes("ask") || lowerQuery.includes("question") || lowerQuery.includes("start"),
        progress: lowerQuery.includes("streak") || lowerQuery.includes("progress") || lowerQuery.includes("completed") || lowerQuery.includes("stat"),
        churchInfo: lowerQuery.includes("location") || lowerQuery.includes("time") || lowerQuery.includes("website") || lowerQuery.includes("contact")
    };

    // 2. Conversational State
    const alreadyGreeted = chatHistory?.some(msg => msg.role === 'ai' && msg.content.includes("Hello") || msg.content.includes("Blessings"));
    let response = "";

    // 3. Generation Logic
    if ((intents.greeting || !isFollowUp) && !alreadyGreeted) {
        response += `Hello ${userName}! It's a blessing to walk with you today. `;
    }

    if (d) {
        if (isFollowUp && intents.deepDive) {
            // Contextual discussion logic
            if (lowerQuery.includes("ask") || lowerQuery.includes("discuss") || lowerQuery.includes("question")) {
                const questions = [
                    `Based on today's focus ("${d.dailyFocus}"), what is one area of your life where you feel reconciliation is hardest right now?`,
                    `The scripture ${d.scripture} tells us to be reconciled. When you think about this passage, which specific word or phrase stands out to you as a challenge?`,
                    `In the context of ${d.theme}, how do you think God is inviting you to change your perspective on a relationship you're currently praying about?`,
                    `Reflecting on "${d.text?.trim()?.substring(0, 50)}...", which part of this promise feels most urgent for your soul today?`
                ];
                // Select a question based on query length/content for pseudo-randomness
                const qIdx = (lowerQuery.length + historyCount) % questions.length;
                response += questions[qIdx];
            } else if (d.scripture?.includes("6:37") || d.scripture?.includes("5:23")) {
                if (d.scripture.includes("6:37")) {
                    response += `Looking deeper into ${d.scripture}, the word "pardon" (apolyete) implies untying a knot. Imagine resentment as a tight knot in your heart—forgiveness is the act of unraveling it. Since we are in **Week ${d.week}: ${d.theme}**, how does this "untying" change your outlook today?`;
                } else {
                    response += `In Matthew 5:23-24, Jesus emphasizes that spiritual offerings are secondary to relational peace. The word "first" (proton) suggests that reconciliation is the prerequisite for true worship. How does this priority shift your focus for this week's theme of **${d.theme}**?`;
                }
            } else {
                response += `That's a great desire for depth. In ${d.scripture}, we are exploring **${d.theme}**. This passage reminds us that our faith is our strength. Based on your ${s?.currentStreak || 0}-day momentum, you are building the exact habits needed for this transformation. What specific part of this passage stands out to you?`;
            }
        } else if (intents.verseRequest || !isFollowUp) {
            const dateStr = contextPayload.currentDate ? new Date(contextPayload.currentDate).toLocaleDateString() : "today";
            response += `Today is ${dateStr}, and we are centering our hearts on **Week ${d.week}: ${d.theme}**. \n\n**The Focus:** *"${d.dailyFocus}"*\n**Scripture:** ${d.scripture}\n\n`;
            if (s?.completedToday) {
                response += `I see you've already completed your journal—wonderful discipline! Is there a specific part of this verse you'd like to dive deeper into?`;
            } else {
                response += `You're on a **${s?.currentStreak || 0}-day streak**. Before you complete your journal, would you like to discuss what "${d.theme}" looks like in your life right now?`;
            }
        }
    }

    // Capture diagnostic mode info but make it specific
    if (response === "") {
        if (intents.progress && s) {
            response = `You are doing great! You have a **${s.currentStreak}-day streak**. Every day in the Word is a step toward transformation. Keep standing on the promises!`;
        } else {
            response = `I hear you, ${userName}. As your Spiritual Assistant, I'm here to help you navigate this week's theme${d ? ` of **${d.theme}**` : ''}. \n\nWhether you want to discuss a verse, check your progress, or need prayer, just ask. What's on your heart right now?`;
        }
    }

    return response;
};

const getAIModel = () => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key || key === "YOUR_GEMINI_API_KEY" || key.trim() === "") return null;
    if (!model) {
        genAI = new GoogleGenerativeAI(key);
        model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
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
            const insightsRes = await supabase.from('prophetic_insights').select('*').eq('is_acknowledged', false).limit(5);
            const feedRes = await supabase.from('vw_ministry_intelligence_feed').select('*').limit(10);

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
            // Silently fail PIL context if schema is not fully applied
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
        console.log(`[AI SERVICE] Initializing with: ${aiModel ? 'GEMINI_REAL' : 'INTELLIGENT_FALLBACK'}`);

        if (aiModel) {
            try {
                const result = await aiModel.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();
                if (text && text.length > 5) {
                    console.log("[AI SERVICE] Real AI Response Successful");
                    return text;
                }
                throw new Error("Empty AI response");
            } catch (err: any) {
                console.warn("[AI SERVICE] Real AI Failed, Using Fallback. Reason:", err.message);
                return intelligentFallback(userRole, userName, query, contextPayload, chatHistory);
            }
        }

        // Diagnostic Fallback for lack of API Key
        console.log("[AI SERVICE] No API Key Found, Executing Contextual Fallback");
        const fallbackValue = intelligentFallback(userRole, userName, query, contextPayload, chatHistory);

        return new Promise<string>((resolve) => {
            setTimeout(() => resolve(fallbackValue), 800);
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
