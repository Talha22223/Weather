/**
 * Settings API Routes
 * Handles all settings-related API endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const scheduler = require('../scheduler/scheduler');
const weatherFetcher = require('../services/weatherFetcher');
const webhookService = require('../services/webhookService');

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', (req, res) => {
    try {
        const settings = db.getSettings();
        
        // Mask sensitive data
        const maskedSettings = {
            ...settings,
            apiKey: settings.apiKey ? `${settings.apiKey.slice(0, 8)}...` : '',
            apiClientId: settings.apiClientId ? `${settings.apiClientId.slice(0, 4)}...` : '',
            apiClientSecret: settings.apiClientSecret ? '********' : ''
        };
        
        res.json({
            success: true,
            data: maskedSettings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/settings
 * Update settings
 */
router.put('/', (req, res) => {
    try {
        const updates = req.body;
        
        // Validate webhook URL if provided
        if (updates.webhookUrl) {
            const validation = webhookService.validateWebhookUrl(updates.webhookUrl);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.message
                });
            }
        }
        
        // Validate frequency if provided
        if (updates.scheduleFrequency !== undefined) {
            const freq = parseInt(updates.scheduleFrequency);
            if (isNaN(freq) || freq < 1 || freq > 1440) {
                return res.status(400).json({
                    success: false,
                    error: 'Schedule frequency must be between 1 and 1440 minutes'
                });
            }
            updates.scheduleFrequency = freq;
        }
        
        const updated = db.updateSettings(updates);
        
        // Restart scheduler if frequency or enabled changed
        if (updates.scheduleFrequency !== undefined || updates.scheduleEnabled !== undefined) {
            scheduler.restartScheduler();
        }
        
        res.json({
            success: true,
            data: {
                ...updated,
                apiKey: updated.apiKey ? `${updated.apiKey.slice(0, 8)}...` : '',
                apiClientId: updated.apiClientId ? `${updated.apiClientId.slice(0, 4)}...` : '',
                apiClientSecret: updated.apiClientSecret ? '********' : ''
            },
            message: 'Settings updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/settings/api-key
 * Update OpenWeatherMap API key
 */
router.post('/api-key', (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }
        
        db.updateSettings({ apiKey, apiProvider: 'openweathermap' });
        
        db.addLog({
            type: 'info',
            action: 'settings_update',
            message: 'OpenWeatherMap API key updated'
        });
        
        res.json({
            success: true,
            message: 'API key updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/settings/api-credentials
 * Update API credentials separately (full values)
 */
router.post('/api-credentials', (req, res) => {
    try {
        const { apiClientId, apiClientSecret } = req.body;
        
        if (!apiClientId || !apiClientSecret) {
            return res.status(400).json({
                success: false,
                error: 'Both API Client ID and Client Secret are required'
            });
        }
        
        db.updateSettings({ apiClientId, apiClientSecret });
        
        db.addLog({
            type: 'info',
            action: 'settings_update',
            message: 'API credentials updated'
        });
        
        res.json({
            success: true,
            message: 'API credentials updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/settings/test-api
 * Test API connection
 */
router.post('/test-api', async (req, res) => {
    try {
        const result = await weatherFetcher.testApiConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/settings/test-webhook
 * Test webhook connection
 */
router.post('/test-webhook', async (req, res) => {
    try {
        const result = await webhookService.testWebhookConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
