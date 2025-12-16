/**
 * Forecast API Routes
 * Endpoints for managing daily forecast settings and triggering forecasts
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const forecastScheduler = require('../scheduler/forecastScheduler');

/**
 * GET /api/forecast/status
 * Get current forecast scheduler status
 */
router.get('/status', (req, res) => {
    try {
        const status = forecastScheduler.getForecastSchedulerStatus();
        
        res.json({
            success: true,
            status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/forecast/enable
 * Enable or disable daily forecasts
 * Body: { enabled: true/false }
 */
router.post('/enable', (req, res) => {
    try {
        const { enabled } = req.body;
        
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'enabled must be a boolean'
            });
        }
        
        const result = forecastScheduler.setForecastEnabled(enabled);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/forecast/time
 * Update daily forecast time
 * Body: { time: "HH:MM" }
 */
router.post('/time', (req, res) => {
    try {
        const { time } = req.body;
        
        if (!time || typeof time !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'time is required (format: HH:MM)'
            });
        }
        
        const result = forecastScheduler.updateForecastTime(time);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/forecast/trigger
 * Manually trigger forecast processing now
 */
router.post('/trigger', async (req, res) => {
    try {
        const result = await forecastScheduler.triggerForecastNow();
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/forecast/restart
 * Restart the forecast scheduler
 */
router.post('/restart', (req, res) => {
    try {
        const result = forecastScheduler.restartForecastScheduler();
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
