// Japan Kingdom Church Devotion App - Main JavaScript

// App State
let devotionData = null;
let currentDay = null;
let userProgress = {
    completedDays: [],
    bookmarkedDays: [],
    notes: {},
    theme: 'light'
};

// DOM Elements
const weeksContainer = document.getElementById('weeksContainer');
const progressFill = document.getElementById('progressFill');
const completedDaysEl = document.getElementById('completedDays');
const totalDaysEl = document.getElementById('totalDays');
const streakDaysEl = document.getElementById('streakDays');
const themeToggle = document.getElementById('themeToggle');
const devotionModal = document.getElementById('devotionModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDeclaration = document.getElementById('modalDeclaration');
const modalScripture = document.getElementById('modalScripture');
const modalNotesText = document.getElementById('modalNotesText');
const modalBookmark = document.getElementById('modalBookmark');
const modalComplete = document.getElementById('modalComplete');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadUserProgress();
    loadDevotionData();
    setupEventListeners();
    applyTheme();
});

// Load Devotion Data
async function loadDevotionData() {
    try {
        const response = await fetch('js/devotions.json');
        devotionData = await response.json();
        renderWeeks();
        updateProgress();
    } catch (error) {
        console.error('Error loading devotion data:', error);
        showError('Failed to load devotion content. Please refresh the page.');
    }
}

// Load User Progress from Local Storage
function loadUserProgress() {
    const saved = localStorage.getItem('jkcDevotionProgress');
    if (saved) {
        userProgress = JSON.parse(saved);
    }
}

// Save User Progress to Local Storage
function saveUserProgress() {
    localStorage.setItem('jkcDevotionProgress', JSON.stringify(userProgress));
}

// Setup Event Listeners
function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Settings Toggle
    const settingsToggle = document.getElementById('settingsToggle');
    if (settingsToggle) {
        settingsToggle.addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Modal Close
    modalClose.addEventListener('click', closeModal);
    devotionModal.addEventListener('click', (e) => {
        if (e.target === devotionModal) {
            closeModal();
        }
    });
    
    // Modal Actions
    modalBookmark.addEventListener('click', toggleBookmark);
    modalComplete.addEventListener('click', toggleComplete);
    
    // Share Button
    const modalShare = document.getElementById('modalShare');
    if (modalShare) {
        modalShare.addEventListener('click', () => {
            if (currentDay) {
                shareDevotion(currentDay);
            }
        });
    }
    
    // Save Notes on Input
    modalNotesText.addEventListener('input', saveNotes);
    
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (devotionModal.classList.contains('active')) {
                closeModal();
            }
            if (document.getElementById('settingsModal').classList.contains('active')) {
                document.getElementById('settingsModal').classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}

// Render Weeks
function renderWeeks() {
    if (!devotionData) return;
    
    weeksContainer.innerHTML = '';
    
    devotionData.weeks.forEach((week, weekIndex) => {
        const weekCard = createWeekCard(week, weekIndex);
        weeksContainer.appendChild(weekCard);
    });
}

// Create Week Card
function createWeekCard(week, weekIndex) {
    const card = document.createElement('div');
    card.className = 'week-card';
    card.style.setProperty('--primary-color', week.color.primary);
    card.style.setProperty('--secondary-color', week.color.secondary);
    card.style.setProperty('--accent-color', week.color.accent);
    
    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = `
        <div>
            <div class="week-title">Week ${week.week}: ${week.theme}</div>
            <div class="week-description">${week.description}</div>
        </div>
        <div class="week-theme" style="background: ${week.color.secondary}">
            ${week.theme}
        </div>
    `;
    
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    week.days.forEach(day => {
        const dayCard = createDayCard(day, week.color);
        daysGrid.appendChild(dayCard);
    });
    
    card.appendChild(header);
    card.appendChild(daysGrid);
    
    return card;
}

// Create Day Card
function createDayCard(day, weekColor) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.day = day.day;
    
    // Check if completed or bookmarked
    if (userProgress.completedDays.includes(day.day)) {
        card.classList.add('completed');
    }
    if (userProgress.bookmarkedDays.includes(day.day)) {
        card.classList.add('bookmarked');
    }
    
    card.innerHTML = `
        <div class="day-date">${day.date}</div>
        <div class="day-declaration">${day.declaration}</div>
        <div class="day-scripture">${day.scripture}</div>
        <div class="day-actions">
            <button class="day-action-btn ${userProgress.completedDays.includes(day.day) ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleDayComplete(${day.day})" 
                    title="Mark as complete">
                ✓
            </button>
            <button class="day-action-btn ${userProgress.bookmarkedDays.includes(day.day) ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleDayBookmark(${day.day})" 
                    title="Bookmark">
                📌
            </button>
        </div>
    `;
    
    card.addEventListener('click', () => openDevotionModal(day));
    
    return card;
}

// Open Devotion Modal
function openDevotionModal(day) {
    currentDay = day;
    
    modalTitle.textContent = `Day ${day.day} Devotion`;
    modalDate.textContent = day.date;
    modalDeclaration.textContent = day.declaration;
    modalScripture.textContent = day.scripture;
    modalNotesText.value = userProgress.notes[day.day] || '';
    
    // Update bookmark button
    updateBookmarkButton();
    
    // Update complete button
    updateCompleteButton();
    
    devotionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal() {
    devotionModal.classList.remove('active');
    document.body.style.overflow = '';
    currentDay = null;
}

// Toggle Bookmark
function toggleBookmark() {
    if (!currentDay) return;
    
    const dayNum = currentDay.day;
    const index = userProgress.bookmarkedDays.indexOf(dayNum);
    
    if (index > -1) {
        userProgress.bookmarkedDays.splice(index, 1);
    } else {
        userProgress.bookmarkedDays.push(dayNum);
    }
    
    saveUserProgress();
    updateBookmarkButton();
    renderWeeks();
}

// Toggle Complete
function toggleComplete() {
    if (!currentDay) return;
    
    toggleDayComplete(currentDay.day);
    updateCompleteButton();
}

// Toggle Day Complete (from card)
function toggleDayComplete(dayNum) {
    const index = userProgress.completedDays.indexOf(dayNum);
    
    if (index > -1) {
        userProgress.completedDays.splice(index, 1);
    } else {
        userProgress.completedDays.push(dayNum);
    }
    
    saveUserProgress();
    updateProgress();
    renderWeeks();
}

// Toggle Day Bookmark (from card)
function toggleDayBookmark(dayNum) {
    const index = userProgress.bookmarkedDays.indexOf(dayNum);
    
    if (index > -1) {
        userProgress.bookmarkedDays.splice(index, 1);
    } else {
        userProgress.bookmarkedDays.push(dayNum);
    }
    
    saveUserProgress();
    renderWeeks();
}

// Save Notes
function saveNotes() {
    if (!currentDay) return;
    
    userProgress.notes[currentDay.day] = modalNotesText.value;
    saveUserProgress();
}

// Update Bookmark Button
function updateBookmarkButton() {
    if (!currentDay) return;
    
    const isBookmarked = userProgress.bookmarkedDays.includes(currentDay.day);
    modalBookmark.textContent = isBookmarked ? '📌 Bookmarked' : '📌 Bookmark';
    modalBookmark.classList.toggle('active', isBookmarked);
}

// Update Complete Button
function updateCompleteButton() {
    if (!currentDay) return;
    
    const isCompleted = userProgress.completedDays.includes(currentDay.day);
    modalComplete.textContent = isCompleted ? '✓ Completed' : '✓ Mark Complete';
    modalComplete.classList.toggle('active', isCompleted);
}

// Update Progress
function updateProgress() {
    const completed = userProgress.completedDays.length;
    const total = devotionData ? devotionData.program.totalDays : 31;
    const percentage = (completed / total) * 100;
    
    progressFill.style.width = `${percentage}%`;
    completedDaysEl.textContent = completed;
    totalDaysEl.textContent = total;
    
    // Calculate streak
    const streak = calculateStreak();
    streakDaysEl.textContent = streak;
}

// Calculate Streak
function calculateStreak() {
    if (userProgress.completedDays.length === 0) return 0;
    
    const sortedDays = [...userProgress.completedDays].sort((a, b) => a - b);
    let streak = 1;
    
    for (let i = sortedDays.length - 1; i > 0; i--) {
        if (sortedDays[i] - sortedDays[i - 1] === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Toggle Theme
function toggleTheme() {
    userProgress.theme = userProgress.theme === 'light' ? 'dark' : 'light';
    saveUserProgress();
    applyTheme();
}

// Apply Theme
function applyTheme() {
    if (userProgress.theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #ffebee;
        color: #c62828;
        padding: 1rem;
        margin: 1rem;
        border-radius: 8px;
        text-align: center;
    `;
    errorDiv.textContent = message;
    weeksContainer.appendChild(errorDiv);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Handle PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button if desired
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'btn btn-primary';
    installBtn.style.cssText = 'margin: 1rem auto; display: block;';
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.remove();
        }
    });
    
    document.querySelector('.header-actions').appendChild(installBtn);
});