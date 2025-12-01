/**
 * Locations API Routes
 * Handles all location-related API endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const duplicateProtection = require('../services/duplicateProtection');

/**
 * GET /api/locations
 * Get all locations
 */
router.get('/', (req, res) => {
    try {
        const locations = db.getLocations();
        res.json({
            success: true,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/locations/:id
 * Get a specific location
 */
router.get('/:id', (req, res) => {
    try {
        const locations = db.getLocations();
        const location = locations.find(l => l.id === req.params.id);
        
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/locations
 * Add a new location
 */
router.post('/', (req, res) => {
    try {
        const { name, zipCode, latitude, longitude, enabled } = req.body;
        
        // Validate - must have zip code OR lat/lon
        if (!zipCode && (!latitude || !longitude)) {
            return res.status(400).json({
                success: false,
                error: 'Either ZIP code or latitude/longitude is required'
            });
        }
        
        // Validate ZIP code format if provided
        if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ZIP code format (use 5 digits or 5+4 format)'
            });
        }
        
        // Validate lat/lon if provided
        if (latitude !== undefined && longitude !== undefined) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude must be between -90 and 90'
                });
            }
            
            if (isNaN(lon) || lon < -180 || lon > 180) {
                return res.status(400).json({
                    success: false,
                    error: 'Longitude must be between -180 and 180'
                });
            }
        }
        
        const newLocation = db.addLocation({
            name: name || '',
            zipCode: zipCode || '',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            enabled: enabled !== false
        });
        
        db.addLog({
            type: 'success',
            action: 'location_add',
            message: `Location added: ${newLocation.name || newLocation.zipCode}`,
            details: { locationId: newLocation.id }
        });
        
        res.status(201).json({
            success: true,
            data: newLocation,
            message: 'Location added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/locations/:id
 * Update a location
 */
router.put('/:id', (req, res) => {
    try {
        const { name, zipCode, latitude, longitude, enabled } = req.body;
        
        // Validate ZIP code format if provided
        if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ZIP code format'
            });
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
        if (enabled !== undefined) updateData.enabled = enabled;
        
        const updated = db.updateLocation(req.params.id, updateData);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        db.addLog({
            type: 'info',
            action: 'location_update',
            message: `Location updated: ${updated.name || updated.zipCode}`,
            details: { locationId: updated.id }
        });
        
        res.json({
            success: true,
            data: updated,
            message: 'Location updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/locations/:id
 * Delete a location
 */
router.delete('/:id', (req, res) => {
    try {
        const locations = db.getLocations();
        const location = locations.find(l => l.id === req.params.id);
        
        const deleted = db.deleteLocation(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        // Clear duplicate protection for this location
        duplicateProtection.clearForLocation(req.params.id);
        
        db.addLog({
            type: 'info',
            action: 'location_delete',
            message: `Location deleted: ${location?.name || location?.zipCode || req.params.id}`,
            details: { locationId: req.params.id }
        });
        
        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/locations/:id/toggle
 * Toggle location enabled/disabled
 */
router.post('/:id/toggle', (req, res) => {
    try {
        const locations = db.getLocations();
        const location = locations.find(l => l.id === req.params.id);
        
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        const updated = db.updateLocation(req.params.id, {
            enabled: !location.enabled
        });
        
        res.json({
            success: true,
            data: updated,
            message: `Location ${updated.enabled ? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
