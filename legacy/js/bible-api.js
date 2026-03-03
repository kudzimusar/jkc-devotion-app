// Bible API Integration for JKC Devotion App

const BIBLE_API = {
    // Using Bible API Public API
    baseUrl: 'https://bible-api.com',
    
    // Parse scripture reference and fetch text
    async getScripture(reference) {
        try {
            const url = `${this.baseUrl}/${encodeURIComponent(reference)}?translation=kjv`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch scripture');
            }
            
            const data = await response.json();
            return {
                reference: data.reference,
                text: data.text,
                verses: data.verses,
                translation: data.translation_name
            };
        } catch (error) {
            console.error('Error fetching scripture:', error);
            return null;
        }
    },
    
    // Get scripture for a specific day
    async getDailyScripture(dayData) {
        if (!dayData || !dayData.scripture) {
            return null;
        }
        
        return await this.getScripture(dayData.scripture);
    },
    
    // Search scriptures (optional enhancement)
    async searchScripture(query) {
        try {
            const url = `${this.baseUrl}/${encodeURIComponent(query)}?translation=kjv`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching scripture:', error);
            return null;
        }
    }
};

// Export for use in app.js
window.BIBLE_API = BIBLE_API;