/**
 * Duplicate Protection Service
 * Prevents sending the same alert multiple times
 * Stores and compares alert IDs per location
 */

const db = require('../database/db');

/**
 * Filter out duplicate alerts for a location
 * Returns only alerts that haven't been sent before
 * @param {String} locationId - Location ID
 * @param {Array} alerts - Array of formatted alerts
 * @returns {Array} - Array of new (non-duplicate) alerts
 */
function filterNewAlerts(locationId, alerts) {
    if (!alerts || alerts.length === 0) {
        return [];
    }
    
    const lastAlertIds = db.getLastAlertIdsForLocation(locationId);
    
    const newAlerts = alerts.filter(alert => {
        return !lastAlertIds.includes(alert.alert_id);
    });
    
    return newAlerts;
}

/**
 * Mark alerts as sent for a location
 * Updates the stored alert IDs
 * @param {String} locationId - Location ID
 * @param {Array} alerts - Array of alerts that were sent
 */
function markAlertsSent(locationId, alerts) {
    if (!alerts || alerts.length === 0) {
        return;
    }
    
    const existingIds = db.getLastAlertIdsForLocation(locationId);
    const newIds = alerts.map(alert => alert.alert_id);
    
    // Combine and keep last 100 IDs to prevent unbounded growth
    const allIds = [...existingIds, ...newIds];
    const trimmedIds = allIds.slice(-100);
    
    db.setLastAlertForLocation(locationId, trimmedIds);
    
    db.addLog({
        type: 'info',
        action: 'duplicate_protection',
        message: `Marked ${alerts.length} alerts as sent for location ${locationId}`,
        details: { locationId, alertIds: newIds }
    });
}

/**
 * Check if a specific alert is new (not sent before)
 * @param {String} locationId - Location ID
 * @param {String} alertId - Alert ID to check
 * @returns {Boolean} - True if alert is new
 */
function isAlertNew(locationId, alertId) {
    return db.isAlertNew(locationId, alertId);
}

/**
 * Get statistics about duplicate protection
 * @returns {Object} - Statistics object
 */
function getStats() {
    const lastAlerts = db.getLastAlerts();
    const locations = Object.keys(lastAlerts);
    
    let totalStoredIds = 0;
    const perLocation = {};
    
    for (const locId of locations) {
        const count = lastAlerts[locId]?.alertIds?.length || 0;
        totalStoredIds += count;
        perLocation[locId] = count;
    }
    
    return {
        locationsTracked: locations.length,
        totalStoredIds,
        perLocation
    };
}

/**
 * Clear all stored alert IDs (reset duplicate protection)
 * Use with caution - will cause all current alerts to be resent
 */
function clearAll() {
    db.clearLastAlerts();
    
    db.addLog({
        type: 'warning',
        action: 'duplicate_protection',
        message: 'All stored alert IDs cleared - duplicate protection reset'
    });
}

/**
 * Clear stored alert IDs for a specific location
 * @param {String} locationId - Location ID to clear
 */
function clearForLocation(locationId) {
    db.setLastAlertForLocation(locationId, []);
    
    db.addLog({
        type: 'info',
        action: 'duplicate_protection',
        message: `Cleared stored alert IDs for location ${locationId}`,
        details: { locationId }
    });
}

/**
 * Process alerts with duplicate protection
 * Filters new alerts and marks them as sent after successful processing
 * @param {String} locationId - Location ID
 * @param {Array} alerts - All alerts for the location
 * @param {Function} processCallback - Callback to process new alerts (async)
 * @returns {Object} - Processing result
 */
async function processWithDuplicateProtection(locationId, alerts, processCallback) {
    const newAlerts = filterNewAlerts(locationId, alerts);
    
    if (newAlerts.length === 0) {
        return {
            processed: 0,
            skipped: alerts.length,
            success: true
        };
    }
    
    try {
        await processCallback(newAlerts);
        markAlertsSent(locationId, newAlerts);
        
        return {
            processed: newAlerts.length,
            skipped: alerts.length - newAlerts.length,
            success: true
        };
        
    } catch (error) {
        db.addLog({
            type: 'error',
            action: 'duplicate_protection',
            message: `Error processing alerts for location ${locationId}: ${error.message}`,
            details: { locationId, error: error.message }
        });
        
        return {
            processed: 0,
            skipped: alerts.length,
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    filterNewAlerts,
    markAlertsSent,
    isAlertNew,
    getStats,
    clearAll,
    clearForLocation,
    processWithDuplicateProtection
};
