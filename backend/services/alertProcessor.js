/**
 * Alert Processor Service
 * Orchestrates the complete alert processing workflow:
 * 1. Fetch alerts from weather API
 * 2. Format alerts
 * 3. Filter duplicates
 * 4. Send to GoHighLevel
 */

const db = require('../database/db');
const weatherFetcher = require('./weatherFetcher');
const alertFormatter = require('./alertFormatter');
const duplicateProtection = require('./duplicateProtection');
const webhookService = require('./webhookService');

/**
 * Process all alerts - main orchestration function
 * Called by scheduler or manual trigger
 * @returns {Promise<Object>} - Processing summary
 */
async function processAllAlerts() {
    const startTime = Date.now();
    
    db.addLog({
        type: 'info',
        action: 'process_start',
        message: 'Starting alert processing cycle'
    });
    
    const summary = {
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
        locationsProcessed: 0,
        totalAlertsFetched: 0,
        newAlerts: 0,
        duplicatesSkipped: 0,
        alertsSent: 0,
        alertsFailed: 0,
        errors: []
    };
    
    try {
        // Step 1: Fetch alerts from all enabled locations
        const fetchResult = await weatherFetcher.fetchAllAlerts();
        
        // Process each location's alerts
        for (const [locationId, data] of Object.entries(fetchResult.results)) {
            summary.locationsProcessed++;
            
            const { location, alerts: rawAlerts } = data;
            
            if (!rawAlerts || rawAlerts.length === 0) {
                continue;
            }
            
            // Step 2: Format alerts
            const formattedAlerts = alertFormatter.formatAlerts(rawAlerts, location);
            summary.totalAlertsFetched += formattedAlerts.length;
            
            // Step 3: Filter duplicates
            const newAlerts = duplicateProtection.filterNewAlerts(locationId, formattedAlerts);
            summary.duplicatesSkipped += formattedAlerts.length - newAlerts.length;
            summary.newAlerts += newAlerts.length;
            
            if (newAlerts.length === 0) {
                continue;
            }
            
            // Step 4: Send to webhook
            const sendResult = await webhookService.sendAlertsToWebhook(newAlerts);
            summary.alertsSent += sendResult.sent;
            summary.alertsFailed += sendResult.failed;
            
            // Mark alerts as sent only if they were successfully sent
            const successfulAlerts = newAlerts.filter((alert, index) => 
                sendResult.results[index]?.success
            );
            
            if (successfulAlerts.length > 0) {
                duplicateProtection.markAlertsSent(locationId, successfulAlerts);
            }
        }
        
        // Record any fetch errors
        if (fetchResult.errors.length > 0) {
            summary.errors = fetchResult.errors.map(e => ({
                location: e.location.name || e.location.zipCode,
                error: e.error
            }));
        }
        
    } catch (error) {
        summary.errors.push({ location: 'System', error: error.message });
        
        db.addLog({
            type: 'error',
            action: 'process_error',
            message: `Alert processing failed: ${error.message}`,
            details: { error: error.stack }
        });
    }
    
    // Finalize summary
    summary.endTime = new Date().toISOString();
    summary.duration = Date.now() - startTime;
    
    // Update settings with last run time
    db.updateSettings({ lastSchedulerRun: summary.endTime });
    
    db.addLog({
        type: summary.errors.length > 0 ? 'warning' : 'success',
        action: 'process_complete',
        message: `Processing complete: ${summary.newAlerts} new alerts, ${summary.alertsSent} sent, ${summary.duplicatesSkipped} duplicates skipped`,
        details: summary
    });
    
    return summary;
}

/**
 * Process alerts for a specific location only
 * @param {String} locationId - Location ID to process
 * @returns {Promise<Object>} - Processing result
 */
async function processLocationAlerts(locationId) {
    const settings = db.getSettings();
    const locations = db.getLocations();
    const location = locations.find(l => l.id === locationId);
    
    if (!location) {
        throw new Error(`Location not found: ${locationId}`);
    }
    
    const enabledAlertTypes = db.getEnabledAlertTypes();
    
    try {
        // Fetch alerts
        const rawAlerts = await weatherFetcher.fetchAlertsForLocation(
            location, 
            settings, 
            enabledAlertTypes
        );
        
        // Format alerts
        const formattedAlerts = alertFormatter.formatAlerts(rawAlerts, location);
        
        // Filter duplicates
        const newAlerts = duplicateProtection.filterNewAlerts(locationId, formattedAlerts);
        
        if (newAlerts.length === 0) {
            return {
                success: true,
                location: location.name || location.zipCode,
                fetched: formattedAlerts.length,
                new: 0,
                sent: 0,
                message: 'No new alerts'
            };
        }
        
        // Send to webhook
        const sendResult = await webhookService.sendAlertsToWebhook(newAlerts);
        
        // Mark successful alerts as sent
        const successfulAlerts = newAlerts.filter((alert, index) => 
            sendResult.results[index]?.success
        );
        
        if (successfulAlerts.length > 0) {
            duplicateProtection.markAlertsSent(locationId, successfulAlerts);
        }
        
        return {
            success: true,
            location: location.name || location.zipCode,
            fetched: formattedAlerts.length,
            new: newAlerts.length,
            sent: sendResult.sent,
            failed: sendResult.failed
        };
        
    } catch (error) {
        return {
            success: false,
            location: location.name || location.zipCode,
            error: error.message
        };
    }
}

/**
 * Send a test alert through the system
 * @param {String} locationId - Optional location ID
 * @returns {Promise<Object>} - Test result
 */
async function sendTestAlert(locationId = null) {
    let location = null;
    
    if (locationId) {
        const locations = db.getLocations();
        location = locations.find(l => l.id === locationId);
    }
    
    const testAlert = alertFormatter.createTestAlert(location);
    
    db.addLog({
        type: 'info',
        action: 'test_alert',
        message: 'Sending test alert to webhook',
        details: { locationId, alertId: testAlert.alert_id }
    });
    
    const result = await webhookService.sendAlertToWebhook(testAlert);
    
    return {
        ...result,
        testAlert
    };
}

/**
 * Get system status
 * @returns {Object} - System status
 */
function getSystemStatus() {
    const settings = db.getSettings();
    const locations = db.getEnabledLocations();
    const alertTypes = db.getEnabledAlertTypes();
    const duplicateStats = duplicateProtection.getStats();
    
    // Check API configuration based on provider
    let apiConfigured = false;
    if (settings.apiProvider === 'openweathermap') {
        apiConfigured = !!settings.apiKey;
    } else {
        apiConfigured = !!(settings.apiClientId && settings.apiClientSecret);
    }
    
    return {
        configured: !!(apiConfigured && settings.webhookUrl),
        apiConfigured: apiConfigured,
        webhookConfigured: !!settings.webhookUrl,
        schedulerEnabled: settings.scheduleEnabled,
        scheduleFrequency: settings.scheduleFrequency,
        lastRun: settings.lastSchedulerRun,
        enabledLocations: locations.length,
        enabledAlertTypes: alertTypes.length,
        duplicateProtection: duplicateStats
    };
}

module.exports = {
    processAllAlerts,
    processLocationAlerts,
    sendTestAlert,
    getSystemStatus
};
