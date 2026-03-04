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
    }
};
