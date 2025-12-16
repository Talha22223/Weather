/**
 * Forecast Scheduler Service
 * Manages daily forecast jobs that run at a specific time each day
 */

const cron = require('node-cron');
const db = require('../database/db');
const forecastProcessor = require('./forecastProcessor');

let forecastTask = null;
let currentForecastCron = null;

/**
 * Convert time string (HH:MM) to cron expression
 * @param {String} timeString - Time in HH:MM format (e.g., "07:00")
 * @returns {String} - Cron expression
 */
function timeToCron(timeString) {
    const [hours, minutes] = timeString.split(':').map(n => parseInt(n));
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time format. Use HH:MM (e.g., 07:00)');
    }
    
    // Run at specific time every day
    return `${minutes} ${hours} * * *`;
}

/**
 * Get human-readable schedule description
 * @param {String} timeString - Time in HH:MM format
 * @returns {String} - Description
 */
function getForecastScheduleDescription(timeString) {
    const [hours, minutes] = timeString.split(':').map(n => parseInt(n));
    
    if (isNaN(hours) || isNaN(minutes)) {
        return 'Invalid time';
    }
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `Daily at ${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Start the forecast scheduler with current settings
 */
function startForecastScheduler() {
    const settings = db.getSettings();
    
    if (!settings.forecastEnabled) {
        db.addLog({
            type: 'info',
            action: 'forecast_scheduler',
            message: 'Daily forecast scheduler is disabled'
        });
        return { running: false, message: 'Daily forecast scheduler is disabled' };
    }
    
    const forecastTime = settings.forecastTime || '07:00';
    
    try {
        const cronExpression = timeToCron(forecastTime);
        
        // If scheduler is already running with same settings, do nothing
        if (forecastTask && currentForecastCron === cronExpression) {
            return { 
                running: true, 
                message: 'Forecast scheduler already running',
                time: forecastTime,
                cronExpression 
            };
        }
        
        // Stop existing task if any
        stopForecastScheduler();
        
        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            db.addLog({
                type: 'error',
                action: 'forecast_scheduler',
                message: `Invalid cron expression: ${cronExpression}`
            });
            return { running: false, message: 'Invalid schedule configuration' };
        }
        
        // Start new task
        forecastTask = cron.schedule(cronExpression, async () => {
            db.addLog({
                type: 'info',
                action: 'forecast_scheduler_trigger',
                message: 'Daily forecast scheduled task triggered'
            });
            
            try {
                await forecastProcessor.processDailyForecasts();
            } catch (error) {
                db.addLog({
                    type: 'error',
                    action: 'forecast_scheduler_error',
                    message: `Forecast scheduler execution error: ${error.message}`,
                    details: { error: error.stack }
                });
            }
        }, {
            scheduled: true,
            timezone: 'America/New_York' // Can be made configurable
        });
        
        currentForecastCron = cronExpression;
        
        db.addLog({
            type: 'success',
            action: 'forecast_scheduler_start',
            message: `Forecast scheduler started: ${getForecastScheduleDescription(forecastTime)}`,
            details: { cronExpression, time: forecastTime }
        });
        
        return {
            running: true,
            message: `Forecast scheduler started: ${getForecastScheduleDescription(forecastTime)}`,
            time: forecastTime,
            cronExpression
        };
        
    } catch (error) {
        db.addLog({
            type: 'error',
            action: 'forecast_scheduler_error',
            message: `Failed to start forecast scheduler: ${error.message}`
        });
        
        return {
            running: false,
            message: error.message
        };
    }
}

/**
 * Stop the forecast scheduler
 */
function stopForecastScheduler() {
    if (forecastTask) {
        forecastTask.stop();
        forecastTask = null;
        currentForecastCron = null;
        
        db.addLog({
            type: 'info',
            action: 'forecast_scheduler_stop',
            message: 'Forecast scheduler stopped'
        });
        
        return { running: false, message: 'Forecast scheduler stopped' };
    }
    
    return { running: false, message: 'Forecast scheduler was not running' };
}

/**
 * Restart forecast scheduler with new settings
 */
function restartForecastScheduler() {
    stopForecastScheduler();
    return startForecastScheduler();
}

/**
 * Get forecast scheduler status
 */
function getForecastSchedulerStatus() {
    const settings = db.getSettings();
    const forecastTime = settings.forecastTime || '07:00';
    
    return {
        running: forecastTask !== null,
        enabled: settings.forecastEnabled || false,
        time: forecastTime,
        timeDescription: getForecastScheduleDescription(forecastTime),
        cronExpression: currentForecastCron,
        lastRun: settings.lastForecastRun || null
    };
}

/**
 * Update forecast time
 * @param {String} newTime - New time in HH:MM format
 */
function updateForecastTime(newTime) {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(newTime)) {
        throw new Error('Invalid time format. Use HH:MM (e.g., 07:00)');
    }
    
    db.updateSettings({ forecastTime: newTime });
    
    // Restart scheduler if running
    if (forecastTask) {
        return restartForecastScheduler();
    }
    
    return {
        running: false,
        time: newTime,
        message: `Forecast time updated to ${getForecastScheduleDescription(newTime)}`
    };
}

/**
 * Enable or disable forecast scheduler
 * @param {Boolean} enabled - Enable or disable
 */
function setForecastEnabled(enabled) {
    db.updateSettings({ forecastEnabled: enabled });
    
    if (enabled) {
        return startForecastScheduler();
    } else {
        return stopForecastScheduler();
    }
}

/**
 * Trigger immediate forecast processing (manual run)
 */
async function triggerForecastNow() {
    db.addLog({
        type: 'info',
        action: 'forecast_manual_trigger',
        message: 'Manual forecast check triggered'
    });
    
    return await forecastProcessor.processDailyForecasts();
}

module.exports = {
    startForecastScheduler,
    stopForecastScheduler,
    restartForecastScheduler,
    getForecastSchedulerStatus,
    updateForecastTime,
    setForecastEnabled,
    triggerForecastNow,
    timeToCron,
    getForecastScheduleDescription
};
