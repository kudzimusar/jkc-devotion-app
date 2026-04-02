import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiTools, executeToolCall } from "./ai-tools";
import { logAIConversation } from "./ai-logger";

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

const getAIModel = (tools?: any[]) => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key || key === "YOUR_GEMINI_API_KEY" || key.trim() === "") return null;
    
    // Using gemini-2.5-flash - stable production model as of April 2026 (1M context, native function calling)
    const ai = new GoogleGenerativeAI(key);
    return ai.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        tools: tools 
    });
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
- Keep responses concise but spiritually rich.

TOOL USAGE PROTOCOLS (STRICT ENFORCEMENT):
- ONLY call 'create_care_task' and 'mark_insight_visited' if Active Persona is 'Shepherd' or 'Strategist'.
- ONLY call 'update_profile_skill' if Active Persona is 'Steward' or 'Sentinel'.
- 'escalate_to_human', 'create_prayer_request', and 'schedule_reminder' are available to ALL personas.
- 'record_attendance' is for 'Shepherd' and 'Facilitator' personas only.
- ALWAYS confirm with the user before executing an irreversible tool like 'create_care_task' or 'escalate_to_human'.`;

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

    chatWithGlobalAssistant: async (userRole: string, userName: string, userId: string, query: string, contextPayload?: any, chatHistory?: { role: string, content: string }[]): Promise<{ text: string, logId: string | null }> => {
        const startTime = Date.now();
        let toolsCalled: any[] = [];
        let toolResults: any[] = [];
        let errorMsg: string | undefined;
        let finalResponse = "";
        let logId: string | null = null;
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';
        const isGuest = !userId || userId.trim() === "";

        console.log(`[AI SERVICE] [${isGuest ? 'GUEST' : 'USER'}] Request started for ${contextPayload?.activePersona || 'Church OS'} mode.`);

        let pilContext = "";
        try {
            // Only try to fetch PIL context if it's an admin/leader to avoid unauthorized RLS errors for guests
            if (isAdmin) {
                const { supabase: supabaseClient } = await import("./supabase");
                const insightsRes = await supabaseClient.from('prophetic_insights').select('*').eq('is_acknowledged', false).limit(5);
                const feedRes = await supabaseClient.from('vw_ministry_intelligence_feed').select('*').limit(10);

                const insights = insightsRes.data || [];
                const feed = feedRes.data || [];

                if (insights.length > 0 || feed.length > 0) {
                    pilContext = "\n--- PROPHETIC INTELLIGENCE (PIL) FORECASTS ---\n" +
                        insights.map((i: any) => `- [${i.category.toUpperCase()}] ${i.insight_title}: ${i.insight_description} (Prob: ${i.probability_score}%)`).join("\n") +
                        "\n\n--- OPERATIONAL INTELLIGENCE (MIL) FEED ---\n" +
                        feed.map((f: any) => `- ${f.metric_type}: ${f.detail} on ${f.event_date} (Val: ${f.value}) - ${f.context}`).join("\n") +
                        "\n--- END PIL ---";
                }
            }
        } catch (e) {
            console.warn("[AI SERVICE] PIL Context fetch failed", e);
        }

        // Format RAG Context for Persona Grounding
        let ragContextString = "";
        const r = contextPayload.ragContext;

        if (contextPayload.activePersona === 'Shepherd' && r?.shepherd) {
            const { prophetic_insights, assigned_members, recent_absences } = r.shepherd;
            ragContextString = `\n--- GROUNDED SHEPHERD DATA ---\n` +
                `- Active Prophetic Insights: ${prophetic_insights.length}\n` +
                prophetic_insights.map((i: any) => `  * ${i.member?.name || 'Member'}: ${i.insight_summary} (Severity: ${i.severity})`).join('\n') +
                `\n- Total Managed Members: ${assigned_members.length}\n` +
                `- Members Needing Care (Inactive 3+ Days): ${recent_absences.length}\n` +
                recent_absences.map((m: any) => `  * ${m.name || 'Member'} - Last: ${m.member_stats?.last_devotion_date || 'N/A'}`).join('\n') +
                `\n--- END GROUNDED DATA ---`;
        } else if (contextPayload.activePersona === 'Disciple' && r?.disciple) {
            const { streak, ninety_day_progress, todays_devotion, recent_soap_entries } = r.disciple;
            ragContextString = `\n--- GROUNDED DISCIPLE DATA ---\n` +
                `- Current Streak: ${streak} days\n` +
                `- 90-Day Challenge Progress: ${ninety_day_progress.completed}/90 days\n` +
                `- Today's Devotion: ${todays_devotion?.title || 'Not loaded'} (${todays_devotion?.scripture || 'N/A'})\n` +
                `- Recent Journals: ${recent_soap_entries.length} entries\n` +
                recent_soap_entries.map((e: any) => `  * ${new Date(e.created_at).toLocaleDateString()}: ${e.scripture}`).join('\n') +
                `\n--- END GROUNDED DATA ---`;
        } else if (contextPayload.activePersona === 'Strategist' && r?.strategist) {
            const { engagement_trends } = r.strategist;
            ragContextString = `\n--- GROUNDED STRATEGIC DATA ---\n` +
                `- Church Health Score: ${engagement_trends.score}/100\n` +
                `- Active Devoters (Last 7 Days): ${engagement_trends.active_devoters}\n` +
                `- Total Platform Members: ${engagement_trends.total_members}\n` +
                `--- END GROUNDED DATA ---`;
        } else if (contextPayload.activePersona === 'Concierge' && r?.concierge) {
            const { missing_fields, completion_percentage } = r.concierge;
            ragContextString = `\n--- GROUNDED CONCIERGE DATA ---\n` +
                `- User Profile Completion: ${Math.round(completion_percentage)}%\n` +
                `- Missing Critical Fields: ${missing_fields.join(', ') || 'None'}\n` +
                `--- END GROUNDED DATA ---`;
        }

        const contextStr = contextPayload ? `
        --- CURRENT USER STATE ---
        Name: ${userName}
        Role: ${userRole}
        Active Persona: ${contextPayload.activePersona}
        Current Page: ${contextPayload.currentPage}
        Date: ${contextPayload.currentDate}
        ${ragContextString}
        ${pilContext}
        --- END CONTEXT ---
        ` : "";

        const historyStr = chatHistory?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") || "";
        const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextStr}\n\nIMPORTANT: Ground your responses in the [GROUNDED DATA] provided above. If data is missing or N/A, guide the user on how to populate it.\n\nCONVERSATION HISTORY:\n${historyStr}\n\nUSER QUESTION: ${query}\n\nRESPONSE:`;

        console.log(`[AI SERVICE] Prompt size: ${fullPrompt.length} chars. Initializing model...`);
        const aiModel = getAIModel(aiTools);
        console.log(`[AI SERVICE] Model state: ${aiModel ? 'ACTIVE' : 'FALLBACK'}`);

        if (aiModel) {
            try {
                console.log(`[AI SERVICE] Starting main AI loop...`);
                
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000); // 15s timeout
                });

                const aiLogic = async () => {
                    const chat = aiModel.startChat({
                        history: chatHistory?.map(m => ({
                            role: m.role === 'ai' ? 'model' : 'user',
                            parts: [{ text: m.content }]
                        })) || [],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        }
                    });

                    const result = await chat.sendMessage(fullPrompt);
                    const response = result.response;
                    
                    const functionCalls = response.functionCalls();
                    if (functionCalls && functionCalls.length > 0) {
                        const call = functionCalls[0];
                        toolsCalled.push({ name: call.name, args: call.args });
                        const toolResult = await executeToolCall(call.name, call.args, userId, userRole);
                        toolResults.push(toolResult);
                        
                        const finalResult = await chat.sendMessage([{
                            functionResponse: {
                                name: call.name,
                                response: toolResult
                            }
                        }]);
                        
                        return finalResult.response.text();
                    } else {
                        return response.text();
                    }
                };

                // Race against timeout
                finalResponse = await Promise.race([aiLogic(), timeoutPromise]) as string;
                console.log(`[AI SERVICE] Finishing generation successfully.`);

            } catch (err: any) {
                console.error(`[AI SERVICE] ${err.message === 'AI_TIMEOUT' ? 'Timeout' : 'Real AI Failed'}. Reason:`, err.message);
                errorMsg = err.message;
                finalResponse = intelligentFallback(userRole, userName, query, contextPayload, chatHistory);
            }
        } else {
            console.log("[AI SERVICE] No API Key Found, Executing Contextual Fallback");
            finalResponse = intelligentFallback(userRole, userName, query, contextPayload, chatHistory);
        }

        // Final Logging Pass (Non-blocking)
        logAIConversation({
            userId: userId || null,
            organizationId: contextPayload?.ragContext?.user_profile?.org_id || null,
            persona: contextPayload.activePersona,
            path: contextPayload.currentPage,
            userQuery: query,
            aiResponse: finalResponse,
            responseTimeMs: Date.now() - startTime,
            toolsCalled,
            toolResults,
            errorMessage: errorMsg,
            modelUsed: 'gemini-2.5-flash'
        }).catch(logErr => console.error("[AI SERVICE] Logging failed", logErr));

        return { text: finalResponse, logId: null };
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
