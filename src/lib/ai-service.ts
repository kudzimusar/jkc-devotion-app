import { formatInTimeZone } from "date-fns-tz";

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
        // [FUTURE AI INTEGRATION NOTE]
        // When real Gemini API is integrated, if userRole === 'admin', query the `member_analytics`, 
        // `soap_entries`, and `prayer_requests` tables first. Serialize that data into a hidden 
        // prompt context (e.g., "Here is the church data: ... Analyze and respond to: query").
        // This will allow true real-time detection of dwindles, growth, and discrepancies.

        return new Promise<string>((resolve) => {
            setTimeout(() => {
                const isAdmin = userRole === 'admin' || userRole === 'leader' || userRole === 'pastor';
                const lowerQuery = query.toLowerCase();

                if (isAdmin) {
                    if (lowerQuery.includes('growth') || lowerQuery.includes('attendance') || lowerQuery.includes('analytics') || lowerQuery.includes('summary')) {
                        resolve(`📊 Hello ${userName}. Based on 30-day cross-referenced analytics:\n\n📈 +15% engagement in daily devotions.\n👥 Small Group sign-ups grew by 8 members.\n⚠️ Discrepancy Alert: 12 active app users show irregular physical Sunday attendance.\n\nRecommended Action:\nReach out to the 12 irregular attendees directly from the Pastoral Care Hub on your dashboard. Use their devotion activity as a warm touchpoint.`);
                    } else if (lowerQuery.includes('prayer') || lowerQuery.includes('care') || lowerQuery.includes('alerts')) {
                        resolve(`🚨 Pastoral Care Status:\n\n🙏 5 Unresolved prayer requests in the last 48 hours.\n💬 2 members flagged by the system for counseling follow-ups based on significant "Stewardship Log" changes.\n📉 Ministry Roles: Currently short 3 volunteers for "Children's Ministry".\n\nWould you like me to aggregate these into a Care Team email draft?`);
                    } else {
                        resolve(`Hello ${userName}. As an Admin Assistant, I am constantly monitoring church health.\n\nRegarding: "${query}"\nNo severe discrepancies found right now. What specific data slice (growth, programs, user roles, due dates) would you like me to aggregate for you?`);
                    }
                } else {
                    const isFollowUp = chatHistory && chatHistory.length > 0;

                    if (isFollowUp) {
                        if (lowerQuery.includes("more") || lowerQuery.includes("say") || lowerQuery.includes("else") || lowerQuery.includes("deep") || lowerQuery.includes("mean")) {
                            if (contextPayload?.devotion) {
                                const d = contextPayload.devotion;
                                const s = contextPayload.stats;

                                let response = `That's a great question. In the original text, the themes around ${d.theme} carry deep historical and theological weight. Specifically, when we look at the idea of it, it implies an active decision rather than just a passive feeling. `;

                                if (s?.currentStreak > 0) {
                                    response += `\n\nBased on your ${s.currentStreak}-day streak, I can see you're taking this journey seriously! How do you think this biblical principle applies to your current situation?`;
                                } else {
                                    response += `\n\nHow do you think this biblical principle applies to your current situation?`;
                                }

                                resolve(response);
                                return;
                            }
                        }
                    }

                    if (!isFollowUp && (lowerQuery.includes("today") || lowerQuery.includes("verse") || lowerQuery.includes("theme"))) {
                        if (contextPayload?.devotion) {
                            const d = contextPayload.devotion;
                            const s = contextPayload.stats;
                            const dateObj = contextPayload.currentDate ? new Date(contextPayload.currentDate) : new Date();
                            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

                            let response = `Hello ${userName}! It's ${dateStr}, and we are in **${d.weekTheme}**.\nToday's daily focus is: *'${d.dailyFocus}'*\nYour scripture is **${d.scripture}**: *'${d.text.trim()}'*\n\n`;

                            if (s?.currentStreak > 0) {
                                response += `You're on a great ${s.currentStreak}-day streak! `;
                            }

                            if (!s?.completedToday) {
                                response += `Once you've meditated on this, don't forget to mark your SOAP journal as 'Complete' to keep your momentum going. How does this verse speak to your heart today?`;
                            } else {
                                response += `Great job completing your devotion today! How did ${d.scripture} speak to your heart?`;
                            }

                            resolve(response);
                            return;
                        }
                    }
                    resolve(`Hello ${userName}. I am your Spiritual Assistant.\n\nRegarding: "${query}"\n\n${isFollowUp ? "Let's explore that deeper together." : "The Word tells us to continually seek wisdom. If you have questions about specific verses, want to know how to connect with the church, or need me to check your recent devotion streak, just ask!"} Keep building healthy habits!`);
                }
            }, 1500);
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
    }
};
