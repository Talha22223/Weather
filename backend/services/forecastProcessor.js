/**
 * Forecast Processor Service
 * Orchestrates daily forecast workflow:
 * 1. Fetch forecasts from weather API
 * 2. Format forecasts
 * 3. Send to GoHighLevel webhook
 */

const db = require('../database/db');
const weatherForecastService = require('./weatherForecastService');
const forecastFormatter = require('./forecastFormatter');
const webhookService = require('./webhookService');

/**
 * Process all forecasts - main orchestration function
 * Called by daily scheduler or manual trigger
 * @returns {Promise<Object>} - Processing summary
 */
async function processDailyForecasts() {
    const startTime = Date.now();
    
    db.addLog({
        type: 'info',
        action: 'forecast_process_start',
        message: 'Starting daily forecast processing'
    });
    
    const summary = {
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
        locationsProcessed: 0,
        forecastsFetched: 0,
        forecastsSent: 0,
        forecastsFailed: 0,
        errors: []
    };
    
    try {
        // Step 1: Fetch forecasts from all enabled locations
        const fetchResult = await weatherForecastService.fetchAllForecasts();
        
        if (!fetchResult.success) {
            throw new Error('Failed to fetch forecasts');
        }
        
        // Step 2: Format forecasts
        const formattedForecasts = forecastFormatter.formatAllForecasts(fetchResult);
        summary.locationsProcessed = formattedForecasts.length;
        summary.forecastsFetched = formattedForecasts.length;
        
        if (formattedForecasts.length === 0) {
            db.addLog({
                type: 'warning',
                action: 'forecast_process',
                message: 'No forecasts to send'
            });
            
            summary.endTime = new Date().toISOString();
            summary.duration = Date.now() - startTime;
            return summary;
        }
        
        // Step 3: Send to webhook
        for (const forecast of formattedForecasts) {
            try {
                const sendResult = await webhookService.sendAlertToWebhook(forecast);
                
                if (sendResult.success) {
                    summary.forecastsSent++;
                } else {
                    summary.forecastsFailed++;
                    summary.errors.push({
                        location: forecast.location,
                        error: sendResult.error
                    });
                }
            } catch (error) {
                summary.forecastsFailed++;
                summary.errors.push({
                    location: forecast.location,
                    error: error.message
                });
            }
        }
        
        // Record any fetch errors
        if (fetchResult.errors.length > 0) {
            summary.errors.push(...fetchResult.errors.map(e => ({
                location: e.location.name || e.location.zipCode,
                error: e.error
            })));
        }
        
    } catch (error) {
        summary.errors.push({ location: 'System', error: error.message });
        
        db.addLog({
            type: 'error',
            action: 'forecast_process_error',
            message: `Forecast processing failed: ${error.message}`,
            details: { error: error.stack }
        });
    }
    
    // Finalize summary
    summary.endTime = new Date().toISOString();
    summary.duration = Date.now() - startTime;
    
    // Update settings with last run time
    db.updateSettings({ lastForecastRun: summary.endTime });
    
    db.addLog({
        type: summary.errors.length > 0 ? 'warning' : 'success',
        action: 'forecast_process_complete',
        message: `Forecast processing complete: ${summary.forecastsSent} sent, ${summary.forecastsFailed} failed`,
        details: summary
    });
    
    return summary;
}

module.exports = {
    processDailyForecasts
};
