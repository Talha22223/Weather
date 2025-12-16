/**
 * Weather Forecast Service
 * Fetches daily weather forecasts (not alerts) for regular updates
 * Supports XWeather API forecast endpoints
 */

const axios = require('axios');
const db = require('../database/db');

/**
 * Fetch forecast for a single location from XWeather API
 * @param {Object} location - Location object
 * @param {Object} settings - Settings object with API credentials
 * @returns {Promise<Object>} - Forecast data
 */
async function fetchXWeatherForecast(location, settings) {
    const { apiClientId, apiClientSecret } = settings;
    
    if (!apiClientId || !apiClientSecret) {
        throw new Error('XWeather API credentials not configured');
    }
    
    // Build location query (prefer lat/lon, fallback to ZIP)
    let locationQuery;
    if (location.latitude && location.longitude) {
        locationQuery = `${location.latitude},${location.longitude}`;
    } else if (location.zipCode) {
        locationQuery = location.zipCode;
    } else {
        throw new Error(`No valid location data for ${location.name}`);
    }
    
    try {
        // XWeather forecasts endpoint
        const url = `https://data.api.xweather.com/forecasts/${locationQuery}`;
        
        const response = await axios.get(url, {
            params: {
                client_id: apiClientId,
                client_secret: apiClientSecret,
                limit: 3, // Get 3 days forecast
                filter: 'day' // Daily forecast
            },
            timeout: 15000,
            headers: {
                'User-Agent': 'WeatherAlertAutomation/1.0'
            }
        });
        
        if (response.data.success && response.data.response) {
            return {
                success: true,
                location: location,
                forecast: response.data.response[0], // First result
                raw: response.data
            };
        }
        
        throw new Error('Invalid forecast response from XWeather');
        
    } catch (error) {
        const errorMessage = error.response?.data?.error?.description || error.message;
        
        db.addLog({
            type: 'error',
            action: 'forecast_fetch_error',
            message: `Failed to fetch forecast for ${location.name}: ${errorMessage}`,
            details: {
                location: location.name,
                locationId: location.id,
                error: errorMessage
            }
        });
        
        return {
            success: false,
            location: location,
            error: errorMessage
        };
    }
}

/**
 * Fetch forecasts for all enabled locations
 * @returns {Promise<Object>} - Results summary
 */
async function fetchAllForecasts() {
    const settings = db.getSettings();
    const locations = db.getEnabledLocations();
    
    if (locations.length === 0) {
        db.addLog({
            type: 'warning',
            action: 'forecast_fetch',
            message: 'No enabled locations to fetch forecasts for'
        });
        
        return {
            success: false,
            message: 'No enabled locations',
            results: {},
            errors: []
        };
    }
    
    db.addLog({
        type: 'info',
        action: 'forecast_fetch_start',
        message: `Fetching forecasts for ${locations.length} location(s)`
    });
    
    const results = {};
    const errors = [];
    
    for (const location of locations) {
        try {
            const result = await fetchXWeatherForecast(location, settings);
            
            if (result.success) {
                results[location.id] = result;
            } else {
                errors.push({
                    location,
                    error: result.error
                });
            }
            
        } catch (error) {
            errors.push({
                location,
                error: error.message
            });
        }
    }
    
    const successCount = Object.keys(results).length;
    
    db.addLog({
        type: successCount > 0 ? 'success' : 'error',
        action: 'forecast_fetch_complete',
        message: `Fetched forecasts: ${successCount} successful, ${errors.length} failed`,
        details: { successCount, errorCount: errors.length }
    });
    
    return {
        success: successCount > 0,
        results,
        errors,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    fetchXWeatherForecast,
    fetchAllForecasts
};
