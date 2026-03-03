// Simple Account Management System for JKC Devotion App

const AUTH = {
    currentUser: null,
    
    // Initialize authentication
    init() {
        const savedUser = localStorage.getItem('jkcCurrentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    },
    
    // Create new account
    createAccount(email, password, name) {
        // Validate input
        if (!email || !password || !name) {
            throw new Error('All fields are required');
        }
        
        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Check if user already exists
        const users = this.getAllUsers();
        if (users[email]) {
            throw new Error('An account with this email already exists');
        }
        
        // Create user account
        const user = {
            email,
            password: this.hashPassword(password),
            name,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        users[email] = user;
        this.saveUsers(users);
        
        // Auto-login after registration
        this.currentUser = user;
        this.saveCurrentUser();
        
        return { success: true, user: this.sanitizeUser(user) };
    },
    
    // Login
    login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        const users = this.getAllUsers();
        const user = users[email];
        
        if (!user) {
            throw new Error('Account not found');
        }
        
        if (user.password !== this.hashPassword(password)) {
            throw new Error('Incorrect password');
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        users[email] = user;
        this.saveUsers(users);
        
        this.currentUser = user;
        this.saveCurrentUser();
        
        return { success: true, user: this.sanitizeUser(user) };
    },
    
    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('jkcCurrentUser');
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    },
    
    // Update user profile
    updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        
        const users = this.getAllUsers();
        const user = users[this.currentUser.email];
        
        if (updates.name) {
            user.name = updates.name;
        }
        
        if (updates.password) {
            if (updates.password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            user.password = this.hashPassword(updates.password);
        }
        
        users[this.currentUser.email] = user;
        this.saveUsers(users);
        
        this.currentUser = user;
        this.saveCurrentUser();
        
        return { success: true, user: this.sanitizeUser(user) };
    },
    
    // Delete account
    deleteAccount() {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        
        const users = this.getAllUsers();
        delete users[this.currentUser.email];
        this.saveUsers(users);
        
        // Clear user data
        this.logout();
        localStorage.removeItem('jkcDevotionProgress');
        localStorage.removeItem('jkcSoapJournal');
        
        return { success: true };
    },
    
    // Get all users
    getAllUsers() {
        return JSON.parse(localStorage.getItem('jkcUsers') || '{}');
    },
    
    // Save all users
    saveUsers(users) {
        localStorage.setItem('jkcUsers', JSON.stringify(users));
    },
    
    // Save current user
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('jkcCurrentUser', JSON.stringify(this.currentUser));
        }
    },
    
    // Simple password hashing (not for production - use bcrypt in real app)
    hashPassword(password) {
        // Simple hash for demonstration
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },
    
    // Validate email format
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Sanitize user data (remove sensitive info)
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// Initialize auth on load
AUTH.init();

// Export for use in app.js
window.AUTH = AUTH;