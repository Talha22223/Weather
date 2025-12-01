/**
 * Dynamic Scheduler Service
 * Manages cron jobs that can be configured through the UI
 * Frequency is loaded from database and can be changed dynamically
 */

const cron = require('node-cron');
const db = require('../database/db');
const alertProcessor = require('../services/alertProcessor');

let scheduledTask = null;
let currentCronExpression = null;

/**
 * Convert frequency in minutes to cron expression
 * @param {Number} minutes - Frequency in minutes
 * @returns {String} - Cron expression
 */
function frequencyToCron(minutes) {
    minutes = parseInt(minutes) || 15;
    
    if (minutes < 1) minutes = 1;
    if (minutes > 1440) minutes = 1440; // Max 24 hours
    
    if (minutes === 1) {
        return '* * * * *'; // Every minute
    }
    
    if (minutes < 60) {
        return `*/${minutes} * * * *`; // Every X minutes
    }
    
    if (minutes === 60) {
        return '0 * * * *'; // Every hour
    }
    
    if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `0 */${hours} * * *`; // Every X hours
    }
    
    return '0 0 * * *'; // Once per day
}

/**
 * Get human-readable schedule description
 * @param {Number} minutes - Frequency in minutes
 * @returns {String} - Description
 */
function getScheduleDescription(minutes) {
    minutes = parseInt(minutes) || 15;
    
    if (minutes === 1) return 'Every minute';
    if (minutes < 60) return `Every ${minutes} minutes`;
    if (minutes === 60) return 'Every hour';
    if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `Every ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return 'Once per day';
}

/**
 * Start the scheduler with current settings
 */
function startScheduler() {
    const settings = db.getSettings();
    
    if (!settings.scheduleEnabled) {
        db.addLog({
            type: 'info',
            action: 'scheduler',
            message: 'Scheduler is disabled'
        });
        return { running: false, message: 'Scheduler is disabled' };
    }
    
    const cronExpression = frequencyToCron(settings.scheduleFrequency);
    
    // If scheduler is already running with same settings, do nothing
    if (scheduledTask && currentCronExpression === cronExpression) {
        return { 
            running: true, 
            message: 'Scheduler already running',
            frequency: settings.scheduleFrequency,
            cronExpression 
        };
    }
    
    // Stop existing task if any
    stopScheduler();
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
        db.addLog({
            type: 'error',
            action: 'scheduler',
            message: `Invalid cron expression: ${cronExpression}`
        });
        return { running: false, message: 'Invalid schedule configuration' };
    }
    
    // Start new task
    scheduledTask = cron.schedule(cronExpression, async () => {
        db.addLog({
            type: 'info',
            action: 'scheduler_trigger',
            message: 'Scheduled alert check triggered'
        });
        
        try {
            await alertProcessor.processAllAlerts();
        } catch (error) {
            db.addLog({
                type: 'error',
                action: 'scheduler_error',
                message: `Scheduler execution error: ${error.message}`,
                details: { error: error.stack }
            });
        }
    }, {
        scheduled: true,
        timezone: 'America/New_York' // Can be made configurable
    });
    
    currentCronExpression = cronExpression;
    
    db.addLog({
        type: 'success',
        action: 'scheduler_start',
        message: `Scheduler started: ${getScheduleDescription(settings.scheduleFrequency)}`,
        details: { cronExpression, frequency: settings.scheduleFrequency }
    });
    
    return {
        running: true,
        message: `Scheduler started: ${getScheduleDescription(settings.scheduleFrequency)}`,
        frequency: settings.scheduleFrequency,
        cronExpression
    };
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        currentCronExpression = null;
        
        db.addLog({
            type: 'info',
            action: 'scheduler_stop',
            message: 'Scheduler stopped'
        });
        
        return { running: false, message: 'Scheduler stopped' };
    }
    
    return { running: false, message: 'Scheduler was not running' };
}

/**
 * Restart scheduler with new settings
 */
function restartScheduler() {
    stopScheduler();
    return startScheduler();
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
    const settings = db.getSettings();
    
    return {
        running: scheduledTask !== null,
        enabled: settings.scheduleEnabled,
        frequency: settings.scheduleFrequency,
        frequencyDescription: getScheduleDescription(settings.scheduleFrequency),
        cronExpression: currentCronExpression,
        lastRun: settings.lastSchedulerRun,
        nextRun: scheduledTask ? getNextRunTime(settings.scheduleFrequency) : null
    };
}

/**
 * Calculate approximate next run time
 */
function getNextRunTime(frequencyMinutes) {
    const now = new Date();
    const minutes = parseInt(frequencyMinutes) || 15;
    
    // Simple approximation
    const nextRun = new Date(now.getTime() + minutes * 60 * 1000);
    return nextRun.toISOString();
}

/**
 * Update scheduler frequency
 * @param {Number} newFrequency - New frequency in minutes
 */
function updateFrequency(newFrequency) {
    const frequency = parseInt(newFrequency);
    
    if (isNaN(frequency) || frequency < 1 || frequency > 1440) {
        throw new Error('Frequency must be between 1 and 1440 minutes');
    }
    
    db.updateSettings({ scheduleFrequency: frequency });
    
    // Restart scheduler if running
    if (scheduledTask) {
        return restartScheduler();
    }
    
    return {
        running: false,
        frequency,
        message: `Frequency updated to ${getScheduleDescription(frequency)}`
    };
}

/**
 * Enable or disable scheduler
 * @param {Boolean} enabled - Enable or disable
 */
function setSchedulerEnabled(enabled) {
    db.updateSettings({ scheduleEnabled: enabled });
    
    if (enabled) {
        return startScheduler();
    } else {
        return stopScheduler();
    }
}

/**
 * Trigger immediate processing (manual run)
 */
async function triggerNow() {
    db.addLog({
        type: 'info',
        action: 'manual_trigger',
        message: 'Manual alert check triggered'
    });
    
    return await alertProcessor.processAllAlerts();
}

module.exports = {
    startScheduler,
    stopScheduler,
    restartScheduler,
    getSchedulerStatus,
    updateFrequency,
    setSchedulerEnabled,
    triggerNow,
    frequencyToCron,
    getScheduleDescription
};
