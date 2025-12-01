/**
 * Alert Formatter Service
 * Converts raw weather API alerts into clean, standardized JSON format
 * Supports NWS (National Weather Service), OpenWeatherMap and XWeather formats
 * No hardcoded text - all dynamic
 */

const db = require('../database/db');

/**
 * Format a single alert from NWS (National Weather Service) API response
 */
function formatNWSAlert(rawAlert, location) {
    return {
        alert_id: rawAlert.id || generateAlertId(rawAlert),
        event: rawAlert.event || 'Weather Alert',
        severity: rawAlert.severity || mapNWSSeverity(rawAlert.event),
        description: rawAlert.description || '',
        headline: rawAlert.headline || rawAlert.event || '',
        area: rawAlert.areaDesc || formatLocationName(location),
        starts_at: rawAlert.onset || rawAlert.effective || null,
        ends_at: rawAlert.expires || rawAlert.ends || null,
        issued_at: rawAlert.sent || rawAlert.effective || null,
        location: rawAlert.locationName || formatLocationName(location),
        location_id: location.id,
        source: 'National Weather Service',
        raw_type: rawAlert.event || '',
        certainty: rawAlert.certainty || '',
        urgency: rawAlert.urgency || '',
        instruction: rawAlert.instruction || '',
        sender: rawAlert.senderName || 'NWS'
    };
}

/**
 * Map NWS event names to severity levels
 */
function mapNWSSeverity(event) {
    if (!event) return 'Unknown';
    
    const eventLower = event.toLowerCase();
    
    if (eventLower.includes('warning')) return 'Warning';
    if (eventLower.includes('watch')) return 'Watch';
    if (eventLower.includes('advisory')) return 'Advisory';
    if (eventLower.includes('statement')) return 'Statement';
    if (eventLower.includes('emergency')) return 'Extreme';
    
    return 'Unknown';
}

/**
 * Format a single alert from OpenWeatherMap API response
 */
function formatOpenWeatherMapAlert(rawAlert, location) {
    // Check if this is actually an NWS alert (our hybrid approach)
    if (rawAlert.event && (rawAlert.headline || rawAlert.areaDesc || rawAlert.senderName)) {
        return formatNWSAlert(rawAlert, location);
    }
    
    const startTime = rawAlert.start ? new Date(rawAlert.start * 1000).toISOString() : null;
    const endTime = rawAlert.end ? new Date(rawAlert.end * 1000).toISOString() : null;
    
    return {
        alert_id: generateAlertId(rawAlert),
        event: rawAlert.event || 'Weather Alert',
        severity: mapOpenWeatherSeverity(rawAlert.tags),
        description: rawAlert.description || '',
        headline: rawAlert.event || '',
        area: rawAlert.sender_name || formatLocationName(location),
        starts_at: startTime,
        ends_at: endTime,
        issued_at: startTime,
        location: formatLocationName(location),
        location_id: location.id,
        source: 'OpenWeatherMap',
        raw_type: rawAlert.event || '',
        certainty: '',
        urgency: '',
        tags: rawAlert.tags || []
    };
}

/**
 * Map OpenWeatherMap tags to severity
 */
function mapOpenWeatherSeverity(tags) {
    if (!tags || !Array.isArray(tags)) return 'Unknown';
    
    const tagStr = tags.join(' ').toLowerCase();
    
    if (tagStr.includes('extreme')) return 'Extreme';
    if (tagStr.includes('severe')) return 'Severe';
    if (tagStr.includes('warning')) return 'Warning';
    if (tagStr.includes('watch')) return 'Watch';
    if (tagStr.includes('advisory')) return 'Advisory';
    if (tagStr.includes('moderate')) return 'Moderate';
    
    return 'Unknown';
}

/**
 * Format a single alert from XWeather API response
 * @param {Object} rawAlert - Raw alert object from API
 * @param {Object} location - Location object
 * @returns {Object} - Formatted alert object
 */
function formatXWeatherAlert(rawAlert, location) {
    // Handle nested details structure from XWeather
    const details = rawAlert.details || rawAlert;
    const timestamps = rawAlert.timestamps || {};
    
    return {
        alert_id: details.id || rawAlert.id || generateAlertId(rawAlert),
        event: details.name || details.type || '',
        severity: mapSeverity(details.significance || details.priority),
        description: details.body || details.desc || '',
        headline: details.name || '',
        area: formatArea(details.zone || details.areas || [], location),
        starts_at: formatTimestamp(timestamps.begins || details.timestamp || details.issued),
        ends_at: formatTimestamp(timestamps.expires || details.expires),
        issued_at: formatTimestamp(timestamps.issued || details.issued),
        location: formatLocationName(location),
        location_id: location.id,
        source: db.getSettings().apiProvider || 'XWeather',
        raw_type: details.type || '',
        certainty: details.certainty || '',
        urgency: details.urgency || ''
    };
}

/**
 * Generate a unique alert ID if none provided
 */
function generateAlertId(alert) {
    const details = alert.details || alert;
    const parts = [
        details.type || 'unknown',
        details.timestamp || Date.now(),
        details.zone || ''
    ];
    return Buffer.from(parts.join('-')).toString('base64').slice(0, 24);
}

/**
 * Map API severity/priority to standardized severity levels
 */
function mapSeverity(value) {
    if (!value) return 'Unknown';
    
    const valueStr = String(value).toLowerCase();
    
    // XWeather uses significance codes
    const severityMap = {
        'w': 'Warning',
        'a': 'Watch',
        'y': 'Advisory',
        's': 'Statement',
        'f': 'Forecast',
        'o': 'Outlook',
        'n': 'Synopsis'
    };
    
    if (severityMap[valueStr]) {
        return severityMap[valueStr];
    }
    
    // Handle priority numbers
    const priorityNum = parseInt(value);
    if (!isNaN(priorityNum)) {
        if (priorityNum <= 2) return 'Extreme';
        if (priorityNum <= 4) return 'Severe';
        if (priorityNum <= 6) return 'Moderate';
        if (priorityNum <= 8) return 'Minor';
        return 'Unknown';
    }
    
    // Handle text severity
    const textMap = {
        'extreme': 'Extreme',
        'severe': 'Severe',
        'moderate': 'Moderate',
        'minor': 'Minor',
        'warning': 'Warning',
        'watch': 'Watch',
        'advisory': 'Advisory'
    };
    
    return textMap[valueStr] || value;
}

/**
 * Format area/zone information
 */
function formatArea(zones, location) {
    if (Array.isArray(zones) && zones.length > 0) {
        // Handle array of zone objects
        return zones.map(z => {
            if (typeof z === 'string') return z;
            return z.name || z.county || z.zone || z;
        }).join(', ');
    }
    
    if (typeof zones === 'string' && zones) {
        return zones;
    }
    
    // Fall back to location info
    return location.name || location.zipCode || 'Unknown Area';
}

/**
 * Format location name from location object
 */
function formatLocationName(location) {
    const parts = [];
    
    if (location.name) {
        parts.push(location.name);
    }
    
    if (location.zipCode) {
        parts.push(`ZIP: ${location.zipCode}`);
    }
    
    if (location.latitude && location.longitude) {
        parts.push(`(${location.latitude}, ${location.longitude})`);
    }
    
    return parts.join(' ') || 'Unknown Location';
}

/**
 * Format timestamp to ISO string
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return null;
    
    try {
        // Handle Unix timestamp
        if (typeof timestamp === 'number') {
            // Check if seconds or milliseconds
            const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            return new Date(ts).toISOString();
        }
        
        // Handle string timestamp
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
        
        return null;
    } catch {
        return null;
    }
}

/**
 * Format multiple alerts from API response
 * Auto-detects provider format
 * @param {Array} rawAlerts - Array of raw alerts
 * @param {Object} location - Location object
 * @returns {Array} - Array of formatted alerts
 */
function formatAlerts(rawAlerts, location) {
    if (!Array.isArray(rawAlerts)) {
        return [];
    }
    
    const settings = db.getSettings();
    const provider = settings.apiProvider || 'openweathermap';
    
    return rawAlerts.map(alert => {
        if (provider === 'openweathermap') {
            return formatOpenWeatherMapAlert(alert, location);
        } else {
            return formatXWeatherAlert(alert, location);
        }
    });
}

/**
 * Create a test alert for manual testing
 * @param {Object} location - Optional location to use
 * @returns {Object} - Test alert object
 */
function createTestAlert(location = null) {
    const now = new Date();
    const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    return {
        alert_id: `TEST-${Date.now()}`,
        event: 'Test Weather Alert',
        severity: 'Advisory',
        description: 'This is a test alert sent from the Weather Alert Automation System to verify that the webhook connection is working correctly. This is NOT a real weather alert.',
        headline: 'TEST ALERT - System Verification',
        area: location ? formatLocationName(location) : 'Test Location',
        starts_at: now.toISOString(),
        ends_at: expires.toISOString(),
        issued_at: now.toISOString(),
        location: location ? formatLocationName(location) : 'Test Location',
        location_id: location?.id || 'test-location',
        source: 'WeatherAlertSystem-TestMode',
        raw_type: 'TEST',
        certainty: 'Test',
        urgency: 'Test',
        is_test: true
    };
}

/**
 * Format alert for SMS-friendly display
 * @param {Object} alert - Formatted alert object
 * @returns {String} - SMS-friendly text
 */
function formatAlertForSMS(alert) {
    const parts = [
        `⚠️ ${alert.event}`,
        `Severity: ${alert.severity}`,
        `Area: ${alert.area}`,
        '',
        alert.description ? alert.description.slice(0, 300) : '',
        '',
        `Expires: ${alert.ends_at ? new Date(alert.ends_at).toLocaleString() : 'TBD'}`
    ];
    
    return parts.join('\n').trim();
}

module.exports = {
    formatXWeatherAlert,
    formatAlerts,
    createTestAlert,
    formatAlertForSMS,
    mapSeverity,
    formatTimestamp,
    formatLocationName
};
