/**
 * Alert Types API Routes
 * Handles all alert type-related API endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/alert-types
 * Get all alert types
 */
router.get('/', (req, res) => {
    try {
        const alertTypes = db.getAlertTypes();
        res.json({
            success: true,
            data: alertTypes,
            count: alertTypes.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/alert-types/:id
 * Get a specific alert type
 */
router.get('/:id', (req, res) => {
    try {
        const alertTypes = db.getAlertTypes();
        const alertType = alertTypes.find(at => at.id === req.params.id);
        
        if (!alertType) {
            return res.status(404).json({
                success: false,
                error: 'Alert type not found'
            });
        }
        
        res.json({
            success: true,
            data: alertType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/alert-types
 * Add a new alert type
 */
router.post('/', (req, res) => {
    try {
        const { name, code, enabled } = req.body;
        
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                error: 'Name and code are required'
            });
        }
        
        // Check for duplicate code
        const existing = db.getAlertTypes();
        if (existing.some(at => at.code.toLowerCase() === code.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Alert type with this code already exists'
            });
        }
        
        const newAlertType = db.addAlertType({
            name,
            code: code.toUpperCase(),
            enabled: enabled !== false
        });
        
        db.addLog({
            type: 'success',
            action: 'alert_type_add',
            message: `Alert type added: ${newAlertType.name}`,
            details: { alertTypeId: newAlertType.id, code: newAlertType.code }
        });
        
        res.status(201).json({
            success: true,
            data: newAlertType,
            message: 'Alert type added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/alert-types/:id
 * Update an alert type
 */
router.put('/:id', (req, res) => {
    try {
        const { name, code, enabled } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (enabled !== undefined) updateData.enabled = enabled;
        
        // Check for duplicate code if changing
        if (code) {
            const existing = db.getAlertTypes();
            const duplicate = existing.find(at => 
                at.code.toLowerCase() === code.toLowerCase() && 
                at.id !== req.params.id
            );
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    error: 'Alert type with this code already exists'
                });
            }
        }
        
        const updated = db.updateAlertType(req.params.id, updateData);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Alert type not found'
            });
        }
        
        db.addLog({
            type: 'info',
            action: 'alert_type_update',
            message: `Alert type updated: ${updated.name}`,
            details: { alertTypeId: updated.id }
        });
        
        res.json({
            success: true,
            data: updated,
            message: 'Alert type updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/alert-types/:id
 * Delete an alert type
 */
router.delete('/:id', (req, res) => {
    try {
        const alertTypes = db.getAlertTypes();
        const alertType = alertTypes.find(at => at.id === req.params.id);
        
        const deleted = db.deleteAlertType(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Alert type not found'
            });
        }
        
        db.addLog({
            type: 'info',
            action: 'alert_type_delete',
            message: `Alert type deleted: ${alertType?.name || req.params.id}`,
            details: { alertTypeId: req.params.id }
        });
        
        res.json({
            success: true,
            message: 'Alert type deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/alert-types/:id/toggle
 * Toggle alert type enabled/disabled
 */
router.post('/:id/toggle', (req, res) => {
    try {
        const alertTypes = db.getAlertTypes();
        const alertType = alertTypes.find(at => at.id === req.params.id);
        
        if (!alertType) {
            return res.status(404).json({
                success: false,
                error: 'Alert type not found'
            });
        }
        
        const updated = db.updateAlertType(req.params.id, {
            enabled: !alertType.enabled
        });
        
        res.json({
            success: true,
            data: updated,
            message: `Alert type ${updated.enabled ? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/alert-types/bulk-toggle
 * Enable or disable multiple alert types
 */
router.post('/bulk-toggle', (req, res) => {
    try {
        const { ids, enabled } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'IDs array is required'
            });
        }
        
        const updated = [];
        for (const id of ids) {
            const result = db.updateAlertType(id, { enabled });
            if (result) {
                updated.push(result);
            }
        }
        
        res.json({
            success: true,
            data: updated,
            message: `${updated.length} alert types ${enabled ? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
