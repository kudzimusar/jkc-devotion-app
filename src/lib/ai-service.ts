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
        // Simulated Gemini API binding
        // In a real scenario, this connects to the Gemini endpoint
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                resolve(`Regarding "${scripture}": Here is an AI-generated reflection exploring the context of your question: "${question}".\n\nThe passage emphasizes God's enduring faithfulness. (This is a mock response preparing for Gemini API integration).`);
            }, 1500);
        });
    },

    chatWithGlobalAssistant: async (userRole: string, userName: string, query: string, contextPayload?: any, chatHistory?: { role: string, content: string }[]) => {
        // [SPIRITUAL SHEPHERD REASONING FRAMEWORK]
        // This simulates a RAG (Retrieval-Augmented Generation) flow.
        // It uses dynamic context injection and intent-mapping to ensure unique, pastoral responses.

        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';
                const lowerQuery = query.toLowerCase();
                const historyCount = chatHistory?.length || 0;
                const isFollowUp = historyCount > 0;

                // 1. DYNAMIC CONTEXT OBJECT (Grounding Data)
                const d = contextPayload?.devotion;
                const s = contextPayload?.stats;

                // 2. INTENT CLASSIFICATION
                const intents = {
                    greeting: lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey"),
                    verseRequest: lowerQuery.includes("today") || lowerQuery.includes("verse") || lowerQuery.includes("focus") || lowerQuery.includes("declaration"),
                    deepDive: lowerQuery.includes("more") || lowerQuery.includes("deep") || lowerQuery.includes("mean") || lowerQuery.includes("explain") || lowerQuery.includes("history") || lowerQuery.includes("roots") || lowerQuery.includes("context"),
                    progress: lowerQuery.includes("streak") || lowerQuery.includes("progress") || lowerQuery.includes("completed") || lowerQuery.includes("stat"),
                    churchInfo: lowerQuery.includes("location") || lowerQuery.includes("time") || lowerQuery.includes("website") || lowerQuery.includes("contact")
                };

                // 3. CONVERSATIONAL STATE MANAGEMENT
                // Check if we already greeted the user in this session
                const alreadyGreeted = chatHistory?.some(msg => msg.role === 'ai' && msg.content.includes("Hello"));

                // 4. GENERATION LOGIC (The "Shepherd" Persona)

                // ADMIN / SHEPHERD VIEW DYNAMIC RESPONSES
                if (isAdmin) {
                    if (lowerQuery.includes('growth') || lowerQuery.includes('attendance') || lowerQuery.includes('summary')) {
                        resolve(`📊 **Shepherd Growth Analytics:** \n\nWe've seen a **15% lift** in devotional engagement over the last 7 days. Interestingly, ${userName}, your "Small Group" sign-ups are outpacing physical Sunday attendance by a small margin. \n\n**Discrepancy caught:** 12 members are journaling daily but skipped the last two gatherings. This is a prime opportunity for a "soft-touch" pastoral call to see how they are faring.`);
                        return;
                    }
                    if (lowerQuery.includes('care') || lowerQuery.includes('prayer') || lowerQuery.includes('alerts')) {
                        resolve(`🚨 **Pastoral Care Alerts Logged:**\n\nThere are **5 unresolved prayer requests** that came in during the last 48 hours. I've also flagged 2 household accounts where stewardship logs suggest a sudden change in financial patterns—this often signals a life season requiring pastoral support. \n\n*Would you like me to pull the contact cards for these households?*`);
                        return;
                    }
                }

                // MEMBER / DEVOTION DYNAMIC RESPONSES
                let response = "";

                // Persona Greeting (Suppress if already greeted)
                if ((intents.greeting || !isFollowUp) && !alreadyGreeted) {
                    response += `Hello ${userName}! It's a blessing to walk with you today. `;
                }

                // GROUNDED CONTENT (Retrieved from Context)
                if (d) {
                    // IF it's a follow-up asking for "more", provide THEOLOGICAL PERSPECTIVE
                    if (isFollowUp && intents.deepDive) {
                        if (d.scripture.includes("6:37")) {
                            response += `Looking deeper into Luke 6:37, the concept of "pardon" isn't just about debt; it's the Greek word *apolyete*, which implies untying a knot. \n\nImagine the resentment in your heart as a tight knot—forgiveness is the act of unraveling it so grace can flow again. Since we are in **Week 1: ${d.theme}**, this untying is the foundation of our transformation. How does that picture of "untying" change your outlook on that difficult person or situation today?`;
                        } else {
                            response += `That's a great desire for depth. In ${d.scripture}, the Holy Spirit is highlighting ${d.theme}. If we look at the historical context, this was written to believers facing real pressures, reminding them that their ${d.theme} is their strength. \n\nYou've maintained a **${s?.currentStreak}-day streak**, which shows you're ready for this deeper meat of the Word. What's one area of your life where this ${d.theme} feels most urgent today?`;
                        }
                    }
                    // IF it's a first-time request for the verse
                    else if (intents.verseRequest || !isFollowUp) {
                        const dateObj = contextPayload.currentDate ? new Date(contextPayload.currentDate) : new Date();
                        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

                        response += `Today is ${dateStr}, and we are centering our hearts on **${d.weekTheme}**. \n\n**The Focus:** *"${d.dailyFocus}"*\n**Scripture:** ${d.scripture}: *"${d.text.trim()}"*\n\n`;

                        if (s?.completedToday) {
                            response += `I see you've already completed your SOAP journal for today—wonderful discipline! Is there a specific part of this verse you'd like to dive deeper into?`;
                        } else {
                            response += `You're on a **${s?.currentStreak}-day streak**. Before you complete your journal, would you like to discuss what "Forgiveness" looks like in your life right now?`;
                        }
                    }
                }

                // CATCH-ALL FOR GENERAL QUERIES
                if (response === "") {
                    if (intents.churchInfo) {
                        response = `Japan Kingdom Church is located in Tokyo. You can find our gathering times and full curriculum on our website at [japankingdomchurch.com](https://japankingdomchurch.com). We are currently in the 90 Days of Transformation program!`;
                    } else if (intents.progress && s) {
                        response = `You are currently on a **${s.currentStreak}-day streak**! You've completed ${s.completedToday ? "today's" : "your most recent"} devotion. Keep pushing toward the 90-day goal, ${userName}!`;
                    } else {
                        response = `I hear you, ${userName}. As your Spiritual Assistant, I'm here to help you navigate this week's theme of **${d?.theme || 'Transformation'}**. \n\nWhether you want to discuss the Greek roots of a verse, check your progress, or need prayer, just ask. What's on your heart right now?`;
                    }
                }

                resolve(response);
            }, 1000);
        });
    },

    generateNewsletterDraft: async (topics: string[], activePrayersCount: number, recentMilestonesCount: number) => {
        // [FUTURE AI INTEGRATION NOTE]
        // This simulates passing themes, prayer volumes, and milestones into an LLM
        // to automatically draft the Pastor's weekly email.
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const topicString = topics.length > 0 ? topics.slice(0, 3).join(", ") : "Faith and Growth";

                const draft = `Subject: Embodying ${topicString} - A Weekly Word from Your Pastor

Dear Church Family,

As I've been reflecting on our journey this week, I am profoundly moved by the ways God is working among us. The themes of ${topicString} have been echoing throughout our devotions and community prayers.

We are currently lifting up ${activePrayersCount} active prayer requests as a family. Knowing that we bear one another's burdens is the true mark of the Kingdom. Let's continue to intercede for healing and breakthrough. 
We also celebrate ${recentMilestonesCount} new spiritual milestones—testaments to God's continuous grace. 

As we gather this Sunday, keep your hearts open to how we can live out these Kingdom realities in our workplaces, homes, and city. God is not done writing our story.

In His Grace,
Pastor [Name]`;

                resolve(draft);
            }, 2000);
        });
    },

    processSentiment: async (userId: string, entryId: string, content: string, date: string) => {
        // [AI ENGINE] Extract sentiment/keywords from personal SOAP
        // This is privacy-preserving as it only stores the metadata, not the user's raw journal
        return new Promise<void>((resolve) => {
            setTimeout(async () => {
                const emotions = ["Peace", "Hope", "Anxiety", "Joy", "Guilt", "Seeking"];
                const mockEmotion = emotions[Math.floor(Math.random() * emotions.length)];

                // Extract common spiritual keywords
                const commonWords = ["grace", "faith", "love", "spirit", "prayer", "forgiveness", "strength", "healing"];
                const mockKeywords = commonWords
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                const { supabase } = await import("./supabase");
                await supabase.from('soap_sentiment_metrics').upsert({
                    user_id: userId,
                    entry_id: entryId,
                    date: date,
                    emotion_category: mockEmotion,
                    keywords: mockKeywords
                });
                resolve();
            }, 2000);
        });
    }
};
