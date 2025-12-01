/**
 * Standalone Scheduler
 * Can be run as a separate process for 24/7 operation
 * Use: node backend/scheduler/standalone.js
 */

require('dotenv').config();

const db = require('../database/db');
const scheduler = require('./scheduler');

console.log('========================================');
console.log('  Weather Alert Automation System');
console.log('  Standalone Scheduler');
console.log('========================================');
console.log('');

// Initialize database
db.initializeDatabase();
console.log('✓ Database initialized');

// Check configuration
const settings = db.getSettings();
const locations = db.getEnabledLocations();
const alertTypes = db.getEnabledAlertTypes();

console.log('');
console.log('Configuration:');
console.log(`  - API Client ID: ${settings.apiClientId ? '✓ Configured' : '✗ Not configured'}`);
console.log(`  - Webhook URL: ${settings.webhookUrl ? '✓ Configured' : '✗ Not configured'}`);
console.log(`  - Enabled Locations: ${locations.length}`);
console.log(`  - Enabled Alert Types: ${alertTypes.length}`);
console.log(`  - Schedule Frequency: Every ${settings.scheduleFrequency} minutes`);
console.log(`  - Scheduler Enabled: ${settings.scheduleEnabled ? 'Yes' : 'No'}`);
console.log('');

if (!settings.apiClientId || !settings.apiClientSecret) {
    console.log('⚠ Warning: API credentials not configured.');
    console.log('  Please configure through the admin interface.');
    console.log('');
}

if (!settings.webhookUrl) {
    console.log('⚠ Warning: Webhook URL not configured.');
    console.log('  Please configure through the admin interface.');
    console.log('');
}

if (locations.length === 0) {
    console.log('⚠ Warning: No locations configured.');
    console.log('  Please add locations through the admin interface.');
    console.log('');
}

// Start scheduler
if (settings.scheduleEnabled) {
    const result = scheduler.startScheduler();
    console.log(`Scheduler Status: ${result.message}`);
    
    if (result.running) {
        console.log(`  - Frequency: ${result.frequency} minutes`);
        console.log(`  - Cron Expression: ${result.cronExpression}`);
    }
} else {
    console.log('Scheduler is disabled. Enable it through the admin interface.');
}

console.log('');
console.log('Scheduler is running. Press Ctrl+C to stop.');
console.log('');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('Shutting down scheduler...');
    scheduler.stopScheduler();
    console.log('Scheduler stopped. Goodbye!');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('Received SIGTERM. Shutting down...');
    scheduler.stopScheduler();
    process.exit(0);
});

// Keep process running
setInterval(() => {
    // Heartbeat - check if settings changed
    const currentSettings = db.getSettings();
    
    // Restart scheduler if frequency changed
    const status = scheduler.getSchedulerStatus();
    if (status.frequency !== currentSettings.scheduleFrequency) {
        console.log(`Frequency changed to ${currentSettings.scheduleFrequency} minutes. Restarting scheduler...`);
        scheduler.restartScheduler();
    }
    
    // Enable/disable based on settings
    if (currentSettings.scheduleEnabled && !status.running) {
        console.log('Scheduler enabled. Starting...');
        scheduler.startScheduler();
    } else if (!currentSettings.scheduleEnabled && status.running) {
        console.log('Scheduler disabled. Stopping...');
        scheduler.stopScheduler();
    }
}, 60000); // Check every minute
