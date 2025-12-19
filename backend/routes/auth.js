/**
 * Authentication Routes
 * Simple hardcoded authentication for single user access
 */

const express = require('express');
const router = express.Router();

// Hardcoded credentials
const AUTHORIZED_USER = {
    email: 'client@gmail.com',
    password: 'client1234@'
};

// Simple session storage (in-memory)
const sessions = new Map();

/**
 * POST /api/auth/login
 * Login with hardcoded credentials
 */
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }
    
    // Check credentials
    if (email === AUTHORIZED_USER.email && password === AUTHORIZED_USER.password) {
        // Create session token
        const sessionToken = generateSessionToken();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        
        sessions.set(sessionToken, {
            email: AUTHORIZED_USER.email,
            expiresAt
        });
        
        return res.json({
            success: true,
            token: sessionToken,
            expiresAt
        });
    }
    
    return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
    });
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && sessions.has(token)) {
        sessions.delete(token);
    }
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/verify
 * Verify if session is valid
 */
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided'
        });
    }
    
    const session = sessions.get(token);
    
    if (!session) {
        return res.status(401).json({
            success: false,
            error: 'Invalid session'
        });
    }
    
    if (session.expiresAt < Date.now()) {
        sessions.delete(token);
        return res.status(401).json({
            success: false,
            error: 'Session expired'
        });
    }
    
    res.json({
        success: true,
        email: session.email,
        expiresAt: session.expiresAt
    });
});

/**
 * Middleware to protect routes
 */
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    
    const session = sessions.get(token);
    
    if (!session || session.expiresAt < Date.now()) {
        if (session) sessions.delete(token);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired session'
        });
    }
    
    req.user = { email: session.email };
    next();
}

/**
 * Generate a random session token
 */
function generateSessionToken() {
    return Array.from({ length: 32 }, () => 
        Math.random().toString(36).charAt(2)
    ).join('');
}

module.exports = {
    router,
    requireAuth,
    sessions
};
