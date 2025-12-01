/**
 * Weather Fetcher Service
 * Supports multiple weather APIs:
 * - OpenWeatherMap (free tier) + NWS for alerts
 * - XWeather (Aeris)
 * 
 * All parameters are dynamic - loaded from database
 */

const axios = require('axios');
const db = require('../database/db');

/**
 * Build the location query string for the API
 * Supports ZIP code, lat/lon, or both
 */
function buildLocationQuery(location, provider) {
    if (provider === 'openweathermap') {
        if (location.latitude && location.longitude) {
            return { lat: location.latitude, lon: location.longitude };
        }
        if (location.zipCode) {
            return { zip: `${location.zipCode},US` };
        }
    } else {
        // XWeather format
        if (location.latitude && location.longitude) {
            return `${location.latitude},${location.longitude}`;
        }
        if (location.zipCode) {
            return location.zipCode;
        }
    }
    return null;
}

/**
 * Get coordinates from ZIP code using OpenWeatherMap Geocoding API (free)
 */
async function getCoordinatesFromZip(zipCode, apiKey) {
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`;
        const geoResponse = await axios.get(geoUrl, { timeout: 15000 });
        return {
            lat: geoResponse.data.lat,
            lon: geoResponse.data.lon,
            name: geoResponse.data.name
        };
    } catch (error) {
        throw new Error(`Could not geocode ZIP ${zipCode}: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Fetch weather alerts from National Weather Service API (FREE - no API key needed)
 * This is the official US government weather alert source
 */
async function fetchNWSAlerts(lat, lon, locationName) {
    try {
        // NWS API uses points to get the forecast zone, then fetches alerts for that zone
        const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
        
        const pointResponse = await axios.get(pointUrl, {
            timeout: 15000,
            headers: {
                'Accept': 'application/geo+json',
                'User-Agent': 'WeatherAlertAutomation/1.0 (contact@example.com)'
            }
        });
        
        // Get the county/zone for alerts
        const zoneId = pointResponse.data.properties.county || pointResponse.data.properties.forecastZone;
        
        if (!zoneId) {
            // Fall back to getting alerts by point
            const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
            const alertsResponse = await axios.get(alertsUrl, {
                timeout: 15000,
                headers: {
                    'Accept': 'application/geo+json',
                    'User-Agent': 'WeatherAlertAutomation/1.0 (contact@example.com)'
                }
            });
            
            return (alertsResponse.data.features || []).map(feature => ({
                ...feature.properties,
                id: feature.properties.id || feature.id,
                lat,
                lon,
                locationName
            }));
        }
        
        // Fetch active alerts for the zone
        const zoneCode = zoneId.split('/').pop();
        const alertsUrl = `https://api.weather.gov/alerts/active/zone/${zoneCode}`;
        
        const alertsResponse = await axios.get(alertsUrl, {
            timeout: 15000,
            headers: {
                'Accept': 'application/geo+json',
                'User-Agent': 'WeatherAlertAutomation/1.0 (contact@example.com)'
            }
        });
        
        return (alertsResponse.data.features || []).map(feature => ({
            ...feature.properties,
            id: feature.properties.id || feature.id,
            lat,
            lon,
            locationName
        }));
        
    } catch (error) {
        if (error.response?.status === 404) {
            // No alerts for this location
            return [];
        }
        throw new Error(`NWS API error: ${error.response?.data?.detail || error.message}`);
    }
}

/**
 * Fetch weather alerts from OpenWeatherMap + NWS
 * Uses OWM for geocoding (free), NWS for alerts (free)
 */
async function fetchOpenWeatherMapAlerts(location, settings) {
    const query = buildLocationQuery(location, 'openweathermap');
    
    if (!query) {
        throw new Error(`Invalid location: ${location.name || location.id}`);
    }
    
    if (!settings.apiKey) {
        throw new Error('API key not configured');
    }
    
    let lat, lon, locationName;
    
    // If we have ZIP, first convert to coordinates using OWM geocoding
    if (query.zip) {
        const coords = await getCoordinatesFromZip(query.zip.replace(',US', ''), settings.apiKey);
        lat = coords.lat;
        lon = coords.lon;
        locationName = coords.name || location.name || query.zip;
    } else {
        lat = query.lat;
        lon = query.lon;
        locationName = location.name || `${lat},${lon}`;
    }
    
    // Use NWS API for alerts (free, no API key needed)
    return fetchNWSAlerts(lat, lon, locationName);
}

/**
 * Fetch weather alerts from XWeather (Aeris)
 */
async function fetchXWeatherAlerts(location, settings, enabledAlertTypes) {
    const locationQuery = buildLocationQuery(location, 'xweather');
    
    if (!locationQuery) {
        throw new Error(`Invalid location: ${location.name || location.id}`);
    }
    
    if (!settings.apiClientId || !settings.apiClientSecret) {
        throw new Error('API credentials not configured');
    }
    
    const apiUrl = `${settings.apiBaseUrl}/alerts/${locationQuery}`;
    
    let filterParam = '';
    if (enabledAlertTypes && enabledAlertTypes.length > 0) {
        const codes = enabledAlertTypes.map(at => at.code).join(',');
        filterParam = `&filter=type:${codes}`;
    }
    
    const fullUrl = `${apiUrl}?client_id=${settings.apiClientId}&client_secret=${settings.apiClientSecret}${filterParam}`;
    
    try {
        const response = await axios.get(fullUrl, {
            timeout: 30000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'WeatherAlertAutomation/1.0'
            }
        });
        
        if (response.data && response.data.success && response.data.response) {
            return response.data.response;
        }
        
        if (response.data && response.data.error && response.data.error.code === 'warn_no_data') {
            return [];
        }
        
        return [];
        
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            
            if (status === 401 || status === 403) {
                throw new Error('Invalid API credentials');
            }
            if (status === 404) {
                return [];
            }
            if (status === 429) {
                throw new Error('API rate limit exceeded');
            }
            
            throw new Error(`API error: ${error.response.data?.error?.description || error.message}`);
        }
        
        throw error;
    }
}

/**
 * Fetch alerts for a specific location
 * Automatically selects the right API based on settings
 */
async function fetchAlertsForLocation(location, settings, enabledAlertTypes) {
    const provider = settings.apiProvider || 'openweathermap';
    
    if (provider === 'openweathermap') {
        return fetchOpenWeatherMapAlerts(location, settings);
    } else {
        return fetchXWeatherAlerts(location, settings, enabledAlertTypes);
    }
}

/**
 * Fetch alerts for all enabled locations
 */
async function fetchAllAlerts() {
    const settings = db.getSettings();
    const locations = db.getEnabledLocations();
    const enabledAlertTypes = db.getEnabledAlertTypes();
    
    if (locations.length === 0) {
        db.addLog({
            type: 'warning',
            action: 'fetch_alerts',
            message: 'No enabled locations configured'
        });
        return { results: {}, errors: [] };
    }
    
    const results = {};
    const errors = [];
    
    for (const location of locations) {
        try {
            const alerts = await fetchAlertsForLocation(location, settings, enabledAlertTypes);
            results[location.id] = {
                location: location,
                alerts: alerts
            };
            
            db.addLog({
                type: 'success',
                action: 'fetch_alerts',
                message: `Fetched ${alerts.length} alerts for ${location.name || location.zipCode}`,
                details: { locationId: location.id, alertCount: alerts.length }
            });
            
        } catch (error) {
            errors.push({
                location: location,
                error: error.message
            });
            
            db.addLog({
                type: 'error',
                action: 'fetch_alerts',
                message: `Error fetching alerts for ${location.name || location.zipCode}: ${error.message}`,
                details: { locationId: location.id, error: error.message }
            });
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    return { results, errors };
}

/**
 * Test API connection with current settings
 */
async function testApiConnection() {
    const settings = db.getSettings();
    const provider = settings.apiProvider || 'openweathermap';
    
    if (provider === 'openweathermap') {
        if (!settings.apiKey) {
            return {
                success: false,
                message: 'OpenWeatherMap API key not configured'
            };
        }
        
        try {
            // Test with NYC coordinates
            const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${settings.apiKey}`;
            
            const response = await axios.get(testUrl, { timeout: 15000 });
            
            if (response.data) {
                db.addLog({
                    type: 'success',
                    action: 'api_test',
                    message: 'OpenWeatherMap API connection test successful'
                });
                
                return {
                    success: true,
                    message: 'API connection successful',
                    provider: 'OpenWeatherMap',
                    location: response.data.name
                };
            }
            
            return { success: false, message: 'Unexpected API response' };
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            
            db.addLog({
                type: 'error',
                action: 'api_test',
                message: `API connection test failed: ${errorMessage}`
            });
            
            return {
                success: false,
                message: `API connection failed: ${errorMessage}`
            };
        }
    } else {
        // XWeather test
        if (!settings.apiClientId || !settings.apiClientSecret) {
            return {
                success: false,
                message: 'XWeather API credentials not configured'
            };
        }
        
        try {
            const testUrl = `${settings.apiBaseUrl}/alerts/10001?client_id=${settings.apiClientId}&client_secret=${settings.apiClientSecret}&limit=1`;
            
            const response = await axios.get(testUrl, { timeout: 15000 });
            
            if (response.data) {
                db.addLog({
                    type: 'success',
                    action: 'api_test',
                    message: 'XWeather API connection test successful'
                });
                
                return {
                    success: true,
                    message: 'API connection successful',
                    provider: 'XWeather'
                };
            }
            
            return { success: false, message: 'Unexpected API response' };
            
        } catch (error) {
            const errorMessage = error.response?.data?.error?.description || error.message;
            
            db.addLog({
                type: 'error',
                action: 'api_test',
                message: `API connection test failed: ${errorMessage}`
            });
            
            return {
                success: false,
                message: `API connection failed: ${errorMessage}`
            };
        }
    }
}

module.exports = {
    fetchAlertsForLocation,
    fetchAllAlerts,
    testApiConnection,
    buildLocationQuery
};
