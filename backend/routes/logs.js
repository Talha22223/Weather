/**
 * Logs API Routes
 * Handles log viewing and management
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const duplicateProtection = require('../services/duplicateProtection');

/**
 * GET /api/logs
 * Get logs with optional filtering
 */
router.get('/', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const type = req.query.type; // info, success, warning, error
        const action = req.query.action;
        
        let logs = db.getLogs(limit);
        
        // Filter by type if specified
        if (type) {
            logs = logs.filter(log => log.type === type);
        }
        
        // Filter by action if specified
        if (action) {
            logs = logs.filter(log => log.action.includes(action));
        }
        
        // Return in reverse chronological order
        logs = logs.reverse();
        
        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/logs
 * Clear all logs
 */
router.delete('/', (req, res) => {
    try {
        db.clearLogs();
        
        db.addLog({
            type: 'info',
            action: 'logs_cleared',
            message: 'All logs cleared by user'
        });
        
        res.json({
            success: true,
            message: 'Logs cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/logs/stats
 * Get log statistics
 */
router.get('/stats', (req, res) => {
    try {
        const logs = db.getLogs(1000);
        
        const stats = {
            total: logs.length,
            byType: {
                info: logs.filter(l => l.type === 'info').length,
                success: logs.filter(l => l.type === 'success').length,
                warning: logs.filter(l => l.type === 'warning').length,
                error: logs.filter(l => l.type === 'error').length
            },
            recentErrors: logs.filter(l => l.type === 'error').slice(-5).reverse(),
            lastProcessing: logs.filter(l => l.action === 'process_complete').slice(-1)[0]
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/logs/duplicate-stats
 * Get duplicate protection statistics
 */
router.get('/duplicate-stats', (req, res) => {
    try {
        const stats = duplicateProtection.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/logs/clear-duplicates
 * Clear all stored alert IDs (reset duplicate protection)
 */
router.post('/clear-duplicates', (req, res) => {
    try {
        duplicateProtection.clearAll();
        res.json({
            success: true,
            message: 'Duplicate protection cache cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
