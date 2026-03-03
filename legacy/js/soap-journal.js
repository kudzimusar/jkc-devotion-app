// SOAP Journaling System for JKC Devotion App

// SOAP Journal Data Structure
const SOAP_JOURNAL = {
    // Get all SOAP entries
    getAllEntries() {
        return JSON.parse(localStorage.getItem('jkcSoapJournal') || '{}');
    },
    
    // Get SOAP entry for a specific day
    getEntry(dayNumber) {
        const entries = this.getAllEntries();
        return entries[dayNumber] || {
            scripture: '',
            observation: '',
            application: '',
            prayer: '',
            lastModified: null
        };
    },
    
    // Save SOAP entry for a specific day
    saveEntry(dayNumber, entry) {
        const entries = this.getAllEntries();
        entries[dayNumber] = {
            ...entry,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem('jkcSoapJournal', JSON.stringify(entries));
    },
    
    // Delete SOAP entry
    deleteEntry(dayNumber) {
        const entries = this.getAllEntries();
        delete entries[dayNumber];
        localStorage.setItem('jkcSoapJournal', JSON.stringify(entries));
    },
    
    // Get statistics
    getStatistics() {
        const entries = this.getAllEntries();
        const completedEntries = Object.keys(entries).filter(
            key => entries[key].observation || entries[key].application || entries[key].prayer
        );
        
        return {
            totalEntries: Object.keys(entries).length,
            completedEntries: completedEntries.length,
            entriesWithPrayer: Object.keys(entries).filter(
                key => entries[key].prayer
            ).length,
            entriesWithApplication: Object.keys(entries).filter(
                key => entries[key].application
            ).length
        };
    },
    
    // Export all SOAP entries
    exportEntries() {
        const entries = this.getAllEntries();
        let exportText = 'JKC Devotion SOAP Journal Export\n';
        exportText += '===================================\n\n';
        exportText += `Export Date: ${new Date().toISOString()}\n\n`;
        
        Object.keys(entries).sort((a, b) => a - b).forEach(day => {
            const entry = entries[day];
            if (entry.scripture || entry.observation || entry.application || entry.prayer) {
                exportText += `Day ${day}\n`;
                exportText += '-------\n';
                if (entry.scripture) exportText += `Scripture: ${entry.scripture}\n\n`;
                if (entry.observation) exportText += `Observation:\n${entry.observation}\n\n`;
                if (entry.application) exportText += `Application:\n${entry.application}\n\n`;
                if (entry.prayer) exportText += `Prayer:\n${entry.prayer}\n\n`;
                exportText += '===================================\n\n';
            }
        });
        
        return exportText;
    },
    
    // Generate printable journal page
    generatePrintablePage(dayNumber, dayData) {
        const entry = this.getEntry(dayNumber);
        return `
            <div class="soap-print-page">
                <div class="soap-print-header">
                    <h2>JKC Devotion Journal - Day ${dayNumber}</h2>
                    <p>${dayData.date}</p>
                    <p class="soap-theme">${dayData.declaration}</p>
                </div>
                <div class="soap-print-section">
                    <h3>S - Scripture</h3>
                    <div class="soap-scripture-text">${entry.scripture || dayData.scripture}</div>
                </div>
                <div class="soap-print-section">
                    <h3>O - Observation</h3>
                    <div class="soap-lines">${entry.observation || ''}</div>
                    <p class="soap-note">Write your observations about the scripture</p>
                </div>
                <div class="soap-print-section">
                    <h3>A - Application</h3>
                    <div class="soap-lines">${entry.application || ''}</div>
                    <p class="soap-note">How will you apply this to your life?</p>
                </div>
                <div class="soap-print-section">
                    <h3>P - Prayer</h3>
                    <div class="soap-lines">${entry.prayer || ''}</div>
                    <p class="soap-note">Write your prayer</p>
                </div>
            </div>
        `;
    }
};

// Helper function to format SOAP explanation
function getSOAPExplanation() {
    return {
        S: {
            title: 'Scripture',
            description: 'Write down the Bible verse or passage you are studying.',
            prompt: 'What scripture speaks to you today?'
        },
        O: {
            title: 'Observation',
            description: 'Write what you observe in the scripture. What does it say? What do you notice?',
            prompt: 'What do you notice in this passage?'
        },
        A: {
            title: 'Application',
            description: 'Write how you will apply this scripture to your life today.',
            prompt: 'How will you apply this to your life?'
        },
        P: {
            title: 'Prayer',
            description: 'Write a prayer based on what you learned from the scripture.',
            prompt: 'What is your prayer response?'
        }
    };
}

// Export for use in app.js
window.SOAP_JOURNAL = SOAP_JOURNAL;
window.getSOAPExplanation = getSOAPExplanation;