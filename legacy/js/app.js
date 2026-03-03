// JKC Devotion App - Enhanced with SOAP Journaling and Account Management

// App State
let devotionData = null;
let currentDay = null;
let currentTab = 'basic';

// User Progress
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

// SOAP Elements
const soapScripture = document.getElementById('soapScripture');
const soapObservation = document.getElementById('soapObservation');
const soapApplication = document.getElementById('soapApplication');
const soapPrayer = document.getElementById('soapPrayer');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadUserProgress();
    updateAccountUI();
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

// Load User Progress
function loadUserProgress() {
    const saved = localStorage.getItem('jkcDevotionProgress');
    if (saved) {
        userProgress = JSON.parse(saved);
    }
}

// Save User Progress
function saveUserProgress() {
    localStorage.setItem('jkcDevotionProgress', JSON.stringify(userProgress));
}

// Update Account UI
function updateAccountUI() {
    const loggedInAccount = document.getElementById('loggedInAccount');
    const loggedOutAccount = document.getElementById('loggedOutAccount');
    const userName = document.getElementById('userName');
    
    if (AUTH.isLoggedIn()) {
        const user = AUTH.getCurrentUser();
        loggedInAccount.classList.add('active');
        loggedOutAccount.classList.remove('active');
        userName.textContent = user.name;
    } else {
        loggedInAccount.classList.remove('active');
        loggedOutAccount.classList.add('active');
    }
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
    
    // Journal Tabs
    document.querySelectorAll('.journal-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchJournalTab(tabName);
        });
    });
    
    // SOAP Actions
    document.getElementById('fetchScripture')?.addEventListener('click', fetchFullScripture);
    document.getElementById('copyScriptureFromRef')?.addEventListener('click', copyScriptureReference);
    document.getElementById('printSOAP')?.addEventListener('click', printSOAPJournal);
    document.getElementById('exportSOAP')?.addEventListener('click', exportSOAPEntry);
    
    // Save Notes on Input
    modalNotesText.addEventListener('input', saveNotes);
    soapScripture.addEventListener('input', saveSOAPEntry);
    soapObservation.addEventListener('input', saveSOAPEntry);
    soapApplication.addEventListener('input', saveSOAPEntry);
    soapPrayer.addEventListener('input', saveSOAPEntry);
    
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Switch Journal Tab
function switchJournalTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.journal-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.journal-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'basic') {
        document.getElementById('basicTab').classList.add('active');
    } else {
        document.getElementById('soapTab').classList.add('active');
    }
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
    
    // Check if SOAP entry exists
    const soapEntry = SOAP_JOURNAL.getEntry(day.day);
    if (soapEntry.observation || soapEntry.application || soapEntry.prayer) {
        card.classList.add('has-soap');
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
    currentTab = 'basic';
    
    modalTitle.textContent = `Day ${day.day} Devotion`;
    modalDate.textContent = day.date;
    modalDeclaration.textContent = day.declaration;
    modalScripture.innerHTML = `<strong>${day.scripture}</strong>`;
    
    // Show fetch scripture button
    const fetchButton = document.getElementById('fetchScripture');
    if (fetchButton) {
        fetchButton.style.display = 'inline-block';
    }
    
    // Load basic notes
    modalNotesText.value = userProgress.notes[day.day] || '';
    
    // Load SOAP entry
    const soapEntry = SOAP_JOURNAL.getEntry(day.day);
    soapScripture.value = soapEntry.scripture || '';
    soapObservation.value = soapEntry.observation || '';
    soapApplication.value = soapEntry.application || '';
    soapPrayer.value = soapEntry.prayer || '';
    
    // Reset to basic tab
    switchJournalTab('basic');
    
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

// Close All Modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Fetch Full Scripture
async function fetchFullScripture() {
    if (!currentDay) return;
    
    const button = document.getElementById('fetchScripture');
    button.textContent = '⏳ Loading...';
    button.disabled = true;
    
    try {
        const scriptureData = await BIBLE_API.getDailyScripture(currentDay);
        if (scriptureData) {
            modalScripture.innerHTML = `
                <strong>${scriptureData.reference}</strong><br>
                <div style="margin-top: 0.5rem; line-height: 1.8;">${scriptureData.text}</div>
            `;
        } else {
            alert('Failed to fetch scripture. Please try again.');
        }
    } catch (error) {
        alert('Error fetching scripture. Please check your internet connection.');
    }
    
    button.textContent = '📖 Read Full Scripture';
    button.disabled = false;
}

// Copy Scripture Reference
function copyScriptureReference() {
    if (!currentDay) return;
    
    soapScripture.value = currentDay.scripture;
    saveSOAPEntry();
}

// Save Notes
function saveNotes() {
    if (!currentDay) return;
    
    userProgress.notes[currentDay.day] = modalNotesText.value;
    saveUserProgress();
}

// Save SOAP Entry
function saveSOAPEntry() {
    if (!currentDay) return;
    
    SOAP_JOURNAL.saveEntry(currentDay.day, {
        scripture: soapScripture.value,
        observation: soapObservation.value,
        application: soapApplication.value,
        prayer: soapPrayer.value
    });
    
    renderWeeks();
}

// Print SOAP Journal
function printSOAPEntry() {
    if (!currentDay) return;
    
    const printContent = SOAP_JOURNAL.generatePrintablePage(currentDay.day, currentDay);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>JKC Journal - Day ${currentDay.day}</title>
            <style>
                body {
                    font-family: Georgia, serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                .soap-print-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #333;
                    padding-bottom: 1rem;
                }
                .soap-theme {
                    font-style: italic;
                    color: #666;
                }
                .soap-print-section {
                    margin: 1.5rem 0;
                }
                h3 {
                    color: #00bcd4;
                }
                .soap-lines {
                    min-height: 150px;
                    border: 1px solid #ccc;
                    padding: 0.5rem;
                    margin-bottom: 0.5rem;
                    background: #f9f9f9;
                }
                .soap-note {
                    font-size: 11pt;
                    color: #666;
                    font-style: italic;
                }
                .soap-scripture-text {
                    font-style: italic;
                    margin: 1rem 0;
                }
                @media print {
                    body { font-size: 12pt; }
                }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export SOAP Entry
function exportSOAPEntry() {
    if (!currentDay) return;
    
    const soapEntry = SOAP_JOURNAL.getEntry(currentDay.day);
    let exportText = `JKC Devotion SOAP Journal - Day ${currentDay.day}\n`;
    exportText += `===================================\n\n`;
    exportText += `Date: ${currentDay.date}\n`;
    exportText += `Theme: ${currentDay.declaration}\n\n`;
    exportText += `Scripture Reference: ${currentDay.scripture}\n\n`;
    
    if (soapEntry.scripture) {
        exportText += `S - Scripture:\n${soapEntry.scripture}\n\n`;
    }
    if (soapEntry.observation) {
        exportText += `O - Observation:\n${soapEntry.observation}\n\n`;
    }
    if (soapEntry.application) {
        exportText += `A - Application:\n${soapEntry.application}\n\n`;
    }
    if (soapEntry.prayer) {
        exportText += `P - Prayer:\n${soapEntry.prayer}\n\n`;
    }
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jkc-soap-day-${currentDay.day}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}

// Toggle Bookmark
function toggleBookmark() {
    if (!currentDay) return;
    
    toggleDayBookmark(currentDay.day);
    updateBookmarkButton();
}

// Toggle Complete
function toggleComplete() {
    if (!currentDay) return;
    
    toggleDayComplete(currentDay.day);
    updateCompleteButton();
}

// Toggle Day Complete
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

// Toggle Day Bookmark
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

// Auth Functions
function showAuthModal(mode) {
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('authTitle').textContent = mode === 'login' ? 'Login' : 'Create Account';
}

function showProfileModal() {
    const user = AUTH.getCurrentUser();
    if (user) {
        document.getElementById('profileName').value = user.name;
        document.getElementById('profileModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const result = AUTH.login(email, password);
        if (result.success) {
            closeAllModals();
            updateAccountUI();
            alert(`Welcome back, ${result.user.name}!`);
        }
    } catch (error) {
        alert(error.message);
    }
}

function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const result = AUTH.createAccount(email, password, name);
        if (result.success) {
            closeAllModals();
            updateAccountUI();
            alert(`Welcome to JKC Devotion, ${result.user.name}!`);
        }
    } catch (error) {
        alert(error.message);
    }
}

function handleUpdateProfile() {
    const name = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;
    
    try {
        const updates = { name };
        if (password) {
            updates.password = password;
        }
        
        AUTH.updateProfile(updates);
        closeAllModals();
        updateAccountUI();
        alert('Profile updated successfully!');
    } catch (error) {
        alert(error.message);
    }
}

function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone and all your data will be lost.')) {
        try {
            AUTH.deleteAccount();
            closeAllModals();
            updateAccountUI();
            alert('Account deleted successfully.');
            renderWeeks();
            updateProgress();
        } catch (error) {
            alert(error.message);
        }
    }
}

function logout() {
    AUTH.logout();
    closeAllModals();
    updateAccountUI();
    alert('You have been logged out.');
}

// Export SOAP Journal
function exportSOAPJournal() {
    const exportText = SOAP_JOURNAL.exportEntries();
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jkc-soap-journal-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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

// Make functions globally available
window.switchJournalTab = switchJournalTab;
window.fetchFullScripture = fetchFullScripture;
window.copyScriptureReference = copyScriptureReference;
window.printSOAPEntry = printSOAPEntry;
window.exportSOAPEntry = exportSOAPEntry;
window.showAuthModal = showAuthModal;
window.showProfileModal = showProfileModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleUpdateProfile = handleUpdateProfile;
window.handleDeleteAccount = handleDeleteAccount;
window.logout = logout;
window.exportSOAPJournal = exportSOAPJournal;
window.toggleDayComplete = toggleDayComplete;
window.toggleDayBookmark = toggleDayBookmark;
window.closeAllModals = closeAllModals;

// Register Service Worker
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