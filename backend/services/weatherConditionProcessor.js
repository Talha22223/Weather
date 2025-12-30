/**
 * Weather Condition Processor Service
 * Processes weather conditions and sends notifications about good/bad weather
 * Works alongside alertProcessor for severe weather alerts
 */

const db = require('../database/db');
const weatherConditionFetcher = require('./weatherConditionFetcher');
const weatherConditionFormatter = require('./weatherConditionFormatter');
const webhookService = require('./webhookService');
const duplicateProtection = require('./duplicateProtection');

/**
 * Process weather conditions for all locations
 * Called by scheduler every X minutes
 * @returns {Promise<Object>} - Processing summary
 */
async function processAllConditions() {
    const startTime = Date.now();
    
    db.addLog({
        type: 'info',
        action: 'condition_process_start',
        message: 'Starting weather condition check'
    });
    
    const summary = {
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
        locationsProcessed: 0,
        totalConditionsFetched: 0,
        goodWeather: 0,
        badWeather: 0,
        conditionsSent: 0,
        conditionsFailed: 0,
        errors: []
    };
    
    try {
        // Get settings to check if we should send only bad weather or all weather
        const settings = db.getSettings();
        const sendOnlyBadWeather = settings.weatherConditionSendOnlyBad !== false; // Default to true
        
        // Step 1: Fetch current conditions from all enabled locations
        const fetchResult = await weatherConditionFetcher.fetchAllConditions();
        
        // Step 2: Format and send conditions
        for (const [locationId, data] of Object.entries(fetchResult.results)) {
            summary.locationsProcessed++;
            summary.totalConditionsFetched++;
            
            const { location, conditions, classification } = data;
            
            // Track good vs bad weather
            if (classification.isGood) {
                summary.goodWeather++;
            } else if (classification.isBad) {
                summary.badWeather++;
            }
            
            // Skip if only bad weather should be sent
            if (sendOnlyBadWeather && classification.isGood) {
                db.addLog({
                    type: 'info',
                    action: 'condition_skip',
                    message: `Skipped good weather for ${location.name || location.zipCode} (only bad weather mode)`,
                    details: { locationId, classification: classification.classification }
                });
                continue;
            }
            
            // Format the condition for webhook
            const formattedCondition = weatherConditionFormatter.formatWeatherCondition(
                { conditions, classification },
                location
            );
            
            // Check for duplicates (only send if conditions changed significantly)
            const shouldSend = shouldSendConditionUpdate(locationId, formattedCondition, settings);
            
            if (!shouldSend) {
                db.addLog({
                    type: 'info',
                    action: 'condition_duplicate',
                    message: `Weather conditions unchanged for ${location.name || location.zipCode}`,
                    details: { locationId, classification: classification.classification }
                });
                continue;
            }
            
            // Send to webhook
            const sendResult = await webhookService.sendAlertsToWebhook([formattedCondition]);
            
            if (sendResult.sent > 0) {
                summary.conditionsSent++;
                
                // Store last sent condition
                storeLastCondition(locationId, formattedCondition);
                
                db.addLog({
                    type: 'success',
                    action: 'condition_sent',
                    message: `Weather condition sent for ${location.name || location.zipCode}: ${classification.summary}`,
                    details: { 
                        locationId, 
                        classification: classification.classification,
                        temp: conditions.temp
                    }
                });
            } else {
                summary.conditionsFailed++;
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
            action: 'condition_process_error',
            message: `Weather condition processing failed: ${error.message}`,
            details: { error: error.stack }
        });
    }
    
    // Finalize summary
    summary.endTime = new Date().toISOString();
    summary.duration = Date.now() - startTime;
    
    db.addLog({
        type: summary.errors.length > 0 ? 'warning' : 'success',
        action: 'condition_process_complete',
        message: `Weather check complete: ${summary.goodWeather} good, ${summary.badWeather} bad, ${summary.conditionsSent} notifications sent`,
        details: summary
    });
    
    return summary;
}

/**
 * Check if we should send a condition update
 * Only send if conditions have changed significantly
 */
function shouldSendConditionUpdate(locationId, newCondition, settings) {
    const lastConditions = db.getLastConditions();
    
    if (!lastConditions[locationId]) {
        return true; // First time, always send
    }
    
    const lastCondition = lastConditions[locationId];
    const now = Date.now();
    const lastSentTime = new Date(lastCondition.timestamp).getTime();
    const timeSinceLastSent = now - lastSentTime;
    
    // Always send if classification changed (good -> bad or vice versa)
    if (lastCondition.classification !== newCondition.classification) {
        return true;
    }
    
    // For bad weather, send more frequently (every check)
    if (newCondition.isBadWeather) {
        return true;
    }
    
    // For good weather, only send every hour (to avoid spam)
    const minIntervalForGoodWeather = settings.weatherConditionGoodWeatherInterval || 60; // minutes
    const minIntervalMs = minIntervalForGoodWeather * 60 * 1000;
    
    if (timeSinceLastSent < minIntervalMs) {
        return false; // Too soon
    }
    
    // Check if temperature changed significantly (more than 5 degrees)
    const tempDiff = Math.abs(newCondition.weather.temperature - lastCondition.weather.temperature);
    if (tempDiff >= 5) {
        return true;
    }
    
    // If enough time has passed, send an update
    return timeSinceLastSent >= minIntervalMs;
}

/**
 * Store the last sent condition for a location
 */
function storeLastCondition(locationId, condition) {
    const lastConditions = db.getLastConditions();
    lastConditions[locationId] = condition;
    db.updateLastConditions(lastConditions);
}

module.exports = {
    processAllConditions
};
