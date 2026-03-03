// Additional Features for JKC Devotion App

// Export/Import Progress
function exportProgress() {
    const progress = {
        completedDays: userProgress.completedDays,
        bookmarkedDays: userProgress.bookmarkedDays,
        notes: userProgress.notes,
        theme: userProgress.theme,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(progress, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jkc-devotion-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Validate imported data
            if (imported.completedDays && Array.isArray(imported.completedDays)) {
                userProgress.completedDays = imported.completedDays;
            }
            if (imported.bookmarkedDays && Array.isArray(imported.bookmarkedDays)) {
                userProgress.bookmarkedDays = imported.bookmarkedDays;
            }
            if (imported.notes && typeof imported.notes === 'object') {
                userProgress.notes = imported.notes;
            }
            if (imported.theme) {
                userProgress.theme = imported.theme;
            }
            
            saveUserProgress();
            renderWeeks();
            updateProgress();
            applyTheme();
            
            alert('Progress imported successfully!');
        } catch (error) {
            alert('Error importing progress. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Share Devotion
async function shareDevotion(day) {
    const shareData = {
        title: `JKC Devotion - Day ${day.day}`,
        text: `${day.declaration}\n\nScripture: ${day.scripture}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.log('Share cancelled');
        }
    } else {
        // Fallback: copy to clipboard
        const text = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Devotion copied to clipboard!');
        });
    }
}

// Request Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Notifications Enabled', 'You will receive daily devotion reminders!');
            }
        });
    }
}

// Show Notification
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png'
        });
    }
}

// Schedule Daily Reminder
function scheduleReminder() {
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(9, 0, 0, 0); // 9 AM
    
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeout = reminderTime - now;
    setTimeout(() => {
        showNotification(
            'Daily Devotion Reminder',
            'Time for your daily devotion with JKC!'
        );
        scheduleReminder(); // Schedule next day
    }, timeout);
}

// Statistics
function getStatistics() {
    const totalDays = devotionData ? devotionData.program.totalDays : 31;
    const completed = userProgress.completedDays.length;
    const bookmarked = userProgress.bookmarkedDays.length;
    const notesCount = Object.keys(userProgress.notes).length;
    const streak = calculateStreak();
    const completionRate = ((completed / totalDays) * 100).toFixed(1);
    
    return {
        totalDays,
        completed,
        bookmarked,
        notesCount,
        streak,
        completionRate
    };
}

// Show Statistics Modal
function showStatistics() {
    const stats = getStatistics();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">📊 Your Progress Statistics</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.completed}/${stats.totalDays}</div>
                        <div class="stat-label">Days Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completionRate}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.streak}</div>
                        <div class="stat-label">Day Streak 🔥</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.bookmarked}</div>
                        <div class="stat-label">Bookmarked</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.notesCount}</div>
                        <div class="stat-label">Notes Written</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Reset Progress
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        userProgress = {
            completedDays: [],
            bookmarkedDays: [],
            notes: {},
            theme: 'light'
        };
        saveUserProgress();
        renderWeeks();
        updateProgress();
        applyTheme();
        alert('Progress has been reset.');
    }
}

// Add to main app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission();
    }
    
    // Schedule daily reminder
    scheduleReminder();
});

// Export functions for use in app.js
window.exportProgress = exportProgress;
window.importProgress = importProgress;
window.shareDevotion = shareDevotion;
window.showStatistics = showStatistics;
window.resetProgress = resetProgress;