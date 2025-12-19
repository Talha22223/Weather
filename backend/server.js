/**
 * Weather Alert Automation System
 * Main Server Entry Point
 * 
 * This server provides:
 * - REST API for managing settings, locations, alert types
 * - Scheduler for automated alert checking
 * - Webhook integration with GoHighLevel
 * - Admin interface for CRM specialists
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database and scheduler
const db = require('./database/db');
const scheduler = require('./scheduler/scheduler');
const forecastScheduler = require('./scheduler/forecastScheduler');

// Import routes
const settingsRoutes = require('./routes/settings');
const locationsRoutes = require('./routes/locations');
const alertTypesRoutes = require('./routes/alertTypes');
const schedulerRoutes = require('./routes/scheduler');
const logsRoutes = require('./routes/logs');
const forecastRoutes = require('./routes/forecast');
const { router: authRoutes, requireAuth } = require('./routes/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for all origins (configure for production)
app.use(cors({
    origin: true,
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// STATIC FILES - ADMIN INTERFACE
// ============================================

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected API routes (require authentication)
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/locations', requireAuth, locationsRoutes);
app.use('/api/alert-types', requireAuth, alertTypesRoutes);
app.use('/api/scheduler', requireAuth, schedulerRoutes);
app.use('/api/logs', requireAuth, logsRoutes);
app.use('/api/forecast', requireAuth, forecastRoutes);

// ============================================
// FRONTEND ROUTES
// ============================================

// Serve the admin interface for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    db.addLog({
        type: 'error',
        action: 'server_error',
        message: err.message,
        details: { stack: err.stack }
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// SERVER STARTUP
// ============================================

function startServer() {
    // Initialize database
    console.log('Initializing database...');
    db.initializeDatabase();
    
    // Start HTTP server
    app.listen(PORT, () => {
        console.log('');
        console.log('========================================');
        console.log('  Weather Alert Automation System');
        console.log('========================================');
        console.log('');
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('');
        console.log('Endpoints:');
        console.log(`  - Admin Interface: http://localhost:${PORT}`);
        console.log(`  - API: http://localhost:${PORT}/api`);
        console.log(`  - Health Check: http://localhost:${PORT}/api/health`);
        console.log('');
        
        // Check configuration status
        const settings = db.getSettings();
        const locations = db.getEnabledLocations();
        const alertTypes = db.getEnabledAlertTypes();
        
        console.log('Configuration Status:');
        console.log(`  - API Credentials: ${settings.apiClientId ? '✓' : '✗'}`);
        console.log(`  - Webhook URL: ${settings.webhookUrl ? '✓' : '✗'}`);
        console.log(`  - Locations: ${locations.length} enabled`);
        console.log(`  - Alert Types: ${alertTypes.length} enabled`);
        console.log('');
        
        // Start scheduler if enabled
        if (settings.scheduleEnabled) {
            console.log('Starting alert scheduler...');
            const result = scheduler.startScheduler();
            console.log(`Alert Scheduler: ${result.message}`);
        } else {
            console.log('Alert scheduler is disabled. Enable it through the admin interface.');
        }
        
        // Start forecast scheduler if enabled
        if (settings.forecastEnabled) {
            console.log('Starting forecast scheduler...');
            const forecastResult = forecastScheduler.startForecastScheduler();
            console.log(`Forecast Scheduler: ${forecastResult.message}`);
        } else {
            console.log('Forecast scheduler is disabled. Enable it through the admin interface.');
        }
        
        console.log('');
        console.log('Ready to process weather alerts and forecasts!');
        console.log('');
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    db.addLog({
        type: 'error',
        action: 'uncaught_exception',
        message: err.message,
        details: { stack: err.stack }
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    db.addLog({
        type: 'error',
        action: 'unhandled_rejection',
        message: String(reason)
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    scheduler.stopScheduler();
    forecastScheduler.stopForecastScheduler();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down...');
    scheduler.stopScheduler();
    forecastScheduler.stopForecastScheduler();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
