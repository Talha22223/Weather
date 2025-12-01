/**
 * Scheduler API Routes
 * Handles scheduler control and status
 */

const express = require('express');
const router = express.Router();
const scheduler = require('../scheduler/scheduler');
const alertProcessor = require('../services/alertProcessor');
const db = require('../database/db');

/**
 * GET /api/scheduler/status
 * Get scheduler status
 */
router.get('/status', (req, res) => {
    try {
        const status = scheduler.getSchedulerStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/start
 * Start the scheduler
 */
router.post('/start', (req, res) => {
    try {
        const result = scheduler.startScheduler();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/stop
 * Stop the scheduler
 */
router.post('/stop', (req, res) => {
    try {
        const result = scheduler.stopScheduler();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/restart
 * Restart the scheduler
 */
router.post('/restart', (req, res) => {
    try {
        const result = scheduler.restartScheduler();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/scheduler/frequency
 * Update scheduler frequency
 */
router.put('/frequency', (req, res) => {
    try {
        const { frequency } = req.body;
        
        if (!frequency || isNaN(parseInt(frequency))) {
            return res.status(400).json({
                success: false,
                error: 'Valid frequency (in minutes) is required'
            });
        }
        
        const result = scheduler.updateFrequency(parseInt(frequency));
        res.json({
            success: true,
            data: result,
            message: 'Frequency updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/toggle
 * Toggle scheduler enabled/disabled
 */
router.post('/toggle', (req, res) => {
    try {
        const settings = db.getSettings();
        const result = scheduler.setSchedulerEnabled(!settings.scheduleEnabled);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/trigger
 * Trigger immediate alert processing
 */
router.post('/trigger', async (req, res) => {
    try {
        const result = await scheduler.triggerNow();
        res.json({
            success: true,
            data: result,
            message: 'Alert processing completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scheduler/test-alert
 * Send a test alert
 */
router.post('/test-alert', async (req, res) => {
    try {
        const { locationId } = req.body;
        const result = await alertProcessor.sendTestAlert(locationId);
        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Test alert sent successfully' : 'Failed to send test alert'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/scheduler/system-status
 * Get overall system status
 */
router.get('/system-status', (req, res) => {
    try {
        const systemStatus = alertProcessor.getSystemStatus();
        const schedulerStatus = scheduler.getSchedulerStatus();
        
        res.json({
            success: true,
            data: {
                ...systemStatus,
                scheduler: schedulerStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
