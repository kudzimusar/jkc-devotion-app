import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI SERVICE - Core Intelligence Hub for Church OS
 * 
 * @see knowledge/README.md for the Knowledge Architecture
 * @see knowledge/personas/index.md for Persona Specifications
 * @see knowledge/domain/index.md for Data Grounding Rules
 * @see knowledge/prompts/index.md for Prompt Engineering Standards
 */

// Lazy Initialization helper to ensure environment variables are ready
let genAI: any = null;
let model: any = null;

const intelligentFallback = (userRole: string, userName: string, query: string, contextPayload?: any, chatHistory?: { role: string, content: string }[]): string => {
    const lowerQuery = query.toLowerCase().trim();
    const historyCount = chatHistory?.length || 0;
    const isFollowUp = historyCount > 0;
    const d = contextPayload?.devotion;
    const s = contextPayload?.stats;

    // Safety extractions
    const themeName = d?.week_theme || d?.theme || "Reconciliation";
    const weekNum = d?.week || (themeName.includes("Forgiveness") ? 1 : themeName.includes("Reconciliation") ? 2 : 3);
    const scripture = d?.scripture || "the current passage";

    // 1. Identify Intent
    const intents = {
        greeting: lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey") || lowerQuery.includes("blessings") || lowerQuery.includes("morning"),
        verseRequest: lowerQuery.includes("today") || lowerQuery.includes("verse") || lowerQuery.includes("focus") || lowerQuery.includes("declaration"),
        deepDive: lowerQuery.includes("more") || lowerQuery.includes("deep") || lowerQuery.includes("mean") || lowerQuery.includes("explain") || lowerQuery.includes("history") || lowerQuery.includes("roots") || lowerQuery.includes("context") || lowerQuery.includes("discuss") || lowerQuery.includes("ask") || lowerQuery.includes("question") || lowerQuery.includes("start"),
        affirmation: ["ok", "yes", "sure", "fine", "cool", "alright", "amen", "true", "i will", "yep", "yeah"].some(token => lowerQuery === token || lowerQuery.startsWith(token + " ")),
        spiritual: ["god", "jesus", "lord", "holy spirit", "faith", "spirit", "bible", "prayer"].some(token => lowerQuery.includes(token)),
        progress: lowerQuery.includes("streak") || lowerQuery.includes("progress") || lowerQuery.includes("completed") || lowerQuery.includes("stat"),
    };

    // 2. Conversational State
    const alreadyGreeted = chatHistory?.some(msg => msg.role === 'ai' && (msg.content.includes("Hello") || msg.content.includes("Blessings")));
    let response = "";

    // 3. Logic Flow
    if ((intents.greeting || !isFollowUp) && !alreadyGreeted) {
        response += `Hello ${userName}! It's a blessing to connect with you. `;
    }

    if (d) {
        if (isFollowUp && (intents.deepDive || intents.affirmation || intents.spiritual)) {
            // Conversational questions to maintain engagement
            const questions = [
                `Since we are in **Week ${weekNum}: ${themeName}**, how do you feel God is specifically challenging you regarding ${scripture} right now?`,
                `The declaration for today is "${d.dailyFocus}". When you speak those words, which part feels like a promise you're holding onto?`,
                `In the context of ${themeName}, is there someone or something on your heart that you'd like us to pray for or discuss further?`,
                `Looking at ${scripture}, do you find it easy or difficult to apply this focus to your current season?`
            ];
            // Cycle questions based on query + history for variety
            const qIdx = (lowerQuery.length + historyCount) % questions.length;
            response += questions[qIdx];
        } else if (intents.verseRequest || !isFollowUp) {
            const dateStr = contextPayload.currentDate ? new Date(contextPayload.currentDate).toLocaleDateString() : "today";
            response += `Today is ${dateStr}. We are focusing on **Week ${weekNum}: ${themeName}**. \n\n**Focus:** *"${d.dailyFocus}"*\n**Scripture:** ${scripture}\n\n`;
            if (s?.completedToday) {
                response += `I see your journal is done—great discipline! Is there a specific thought from your reflection you'd like to share?`;
            } else {
                response += `You've got a **${s?.currentStreak || 0}-day streak** going. Before you finish journaling, what does "${themeName}" mean to you today?`;
            }
        }
    }

    // 4. Catch-All - Still Conversational
    if (response === "") {
        if (intents.spiritual) {
            response = `Amen. God is definitely in the details of our transformation. Speaking of ${themeName}, how are you finding the ${scripture} study today?`;
        } else if (intents.affirmation) {
            response = `Absolutely. Let's keep that momentum. Based on today's focus ("${d?.dailyFocus || 'the theme'}"), what's one practical step you're taking today?`;
        } else if (intents.progress && s) {
            response = `You're standing strong with a **${s.currentStreak}-day streak**! Every single day counts toward your 90-day transformation. What can I help you with next?`;
        } else {
            response = `I'm with you, ${userName}. As we walk through **${themeName}** this week, what's been the most impactful thing you've learned from ${scripture}?`;
        }
    }

    return response;
};

const getAIModel = () => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log(`[AI SERVICE] Diagnostic - API Key check: ${key ? `Found (Len: ${key.length})` : 'MISSING'}`);
    
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

const SYSTEM_PROMPT = `You are the Spiritual Assistant for Japan Kingdom Church (JKC), a natural, warm, and deeply insightful companion. 
Your goal is to shepherd users through their 90-day transformation (March-May 2026).

CONVERSATIONAL PROTOCOLS:
1. NEVER be robotic. Avoid repetitive "I hear you" or "Blessings" greetings in follow-up messages.
2. BE PROACTIVE. If a user gives a short answer like "ok", "yes", or "God", interpret their current devotional context and ask a deep, meaningful question to keep the transformation moving.
3. DATA GROUNDING: Use the provided [CONTEXT] (Stats, Week, Scripture) to make your answers specific. Don't just give general advice; connect it to the current Week's theme.
4. If a user asks a question, answer with theological depth (mention Greek/Hebrew roots if relevant) but keep it accessible.
5. You are currently in the 90-day cycle. Today's date and the user's progress should inform your tone (encouraging for long streaks, motivating for new starters).
ONBOARDING & FEATURE GUIDANCE:
- If a user is NEW (Visitor/Pending), prioritize guiding them through the setup:
  1. Complete their Identity Profile (Gender, Birthdate, Contact).
  2. Join a Bible Study Group for community.
  3. Register children for Junior Church.
  4. Explain how to use the Daily Devotion page (S.O.A.P format).
- Explain technical features if requested (e.g., "How do I add a skill?", "Where do I see my giving history?").

TALENT STEWARDSHIP & MINISTRY MATCHING:
- Every member is multi-talented. Encourage users to register ALL their professional and spiritual gifts in their profile "Skills & Talents Registry".
- Use the provided context to proactively suggest ministry placements. If a user mentions a skill or you see it in their profile, connect them to a relevant ministry (e.g., a musician to Worship, a teacher to Kids Church, a coder to IT/Media).
- Emphasize that serving in ministry is a key part of their 90-day transformation.

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
                const result = await aiModel.generateContent({
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ]
                });
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
