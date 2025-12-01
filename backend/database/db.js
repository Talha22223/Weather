/**
 * Database Layer - JSON File Storage
 * Handles all data persistence for the Weather Alert System
 * All data is dynamic and editable - nothing is hardcoded
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Database file paths
const DB_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DB_DIR, 'settings.json');
const LOCATIONS_FILE = path.join(DB_DIR, 'locations.json');
const ALERT_TYPES_FILE = path.join(DB_DIR, 'alert-types.json');
const LAST_ALERTS_FILE = path.join(DB_DIR, 'last-alerts.json');
const LOGS_FILE = path.join(DB_DIR, 'logs.json');

// Ensure data directory exists
function ensureDataDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

// Generic file read/write helpers
function readJsonFile(filePath, defaultValue = {}) {
    ensureDataDir();
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return defaultValue;
    }
}

function writeJsonFile(filePath, data) {
    ensureDataDir();
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

const defaultSettings = {
    apiProvider: 'openweathermap',
    apiBaseUrl: 'https://api.aerisapi.com',
    apiKey: '', // For OpenWeatherMap
    apiClientId: '', // For XWeather
    apiClientSecret: '', // For XWeather
    webhookUrl: '',
    webhookProvider: 'webhook.site', // webhook.site, requestbin, gohighlevel
    scheduleFrequency: 15, // minutes
    scheduleEnabled: true,
    maxLogsToKeep: 100,
    lastSchedulerRun: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

function getSettings() {
    const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
    // Merge with defaults to ensure all fields exist
    return { ...defaultSettings, ...settings };
}

function updateSettings(newSettings) {
    const current = getSettings();
    const updated = {
        ...current,
        ...newSettings,
        updatedAt: new Date().toISOString()
    };
    writeJsonFile(SETTINGS_FILE, updated);
    return updated;
}

// ============================================
// LOCATIONS MANAGEMENT
// ============================================

function getLocations() {
    return readJsonFile(LOCATIONS_FILE, []);
}

function addLocation(locationData) {
    const locations = getLocations();
    const newLocation = {
        id: uuidv4(),
        name: locationData.name || '',
        zipCode: locationData.zipCode || '',
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        enabled: locationData.enabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    locations.push(newLocation);
    writeJsonFile(LOCATIONS_FILE, locations);
    return newLocation;
}

function updateLocation(id, updateData) {
    const locations = getLocations();
    const index = locations.findIndex(loc => loc.id === id);
    if (index === -1) return null;
    
    locations[index] = {
        ...locations[index],
        ...updateData,
        id: locations[index].id, // Preserve ID
        updatedAt: new Date().toISOString()
    };
    writeJsonFile(LOCATIONS_FILE, locations);
    return locations[index];
}

function deleteLocation(id) {
    const locations = getLocations();
    const filtered = locations.filter(loc => loc.id !== id);
    if (filtered.length === locations.length) return false;
    writeJsonFile(LOCATIONS_FILE, filtered);
    return true;
}

function getEnabledLocations() {
    return getLocations().filter(loc => loc.enabled);
}

// ============================================
// ALERT TYPES MANAGEMENT
// ============================================

const defaultAlertTypes = [
    { id: uuidv4(), name: 'Tornado Warning', code: 'TO.W', enabled: true },
    { id: uuidv4(), name: 'Tornado Watch', code: 'TO.A', enabled: true },
    { id: uuidv4(), name: 'Severe Thunderstorm Warning', code: 'SV.W', enabled: true },
    { id: uuidv4(), name: 'Severe Thunderstorm Watch', code: 'SV.A', enabled: true },
    { id: uuidv4(), name: 'Flash Flood Warning', code: 'FF.W', enabled: true },
    { id: uuidv4(), name: 'Flash Flood Watch', code: 'FF.A', enabled: true },
    { id: uuidv4(), name: 'Flood Warning', code: 'FL.W', enabled: true },
    { id: uuidv4(), name: 'Winter Storm Warning', code: 'WS.W', enabled: true },
    { id: uuidv4(), name: 'Winter Storm Watch', code: 'WS.A', enabled: true },
    { id: uuidv4(), name: 'Blizzard Warning', code: 'BZ.W', enabled: true },
    { id: uuidv4(), name: 'Ice Storm Warning', code: 'IS.W', enabled: true },
    { id: uuidv4(), name: 'High Wind Warning', code: 'HW.W', enabled: true },
    { id: uuidv4(), name: 'Hurricane Warning', code: 'HU.W', enabled: true },
    { id: uuidv4(), name: 'Hurricane Watch', code: 'HU.A', enabled: true },
    { id: uuidv4(), name: 'Tropical Storm Warning', code: 'TR.W', enabled: true },
    { id: uuidv4(), name: 'Heat Advisory', code: 'HT.Y', enabled: false },
    { id: uuidv4(), name: 'Excessive Heat Warning', code: 'EH.W', enabled: true },
    { id: uuidv4(), name: 'Freeze Warning', code: 'FZ.W', enabled: false },
    { id: uuidv4(), name: 'Dense Fog Advisory', code: 'FG.Y', enabled: false },
    { id: uuidv4(), name: 'Dust Storm Warning', code: 'DS.W', enabled: false }
];

function getAlertTypes() {
    const alertTypes = readJsonFile(ALERT_TYPES_FILE, null);
    if (alertTypes === null || alertTypes.length === 0) {
        // Initialize with defaults
        writeJsonFile(ALERT_TYPES_FILE, defaultAlertTypes);
        return defaultAlertTypes;
    }
    return alertTypes;
}

function addAlertType(alertTypeData) {
    const alertTypes = getAlertTypes();
    const newAlertType = {
        id: uuidv4(),
        name: alertTypeData.name || '',
        code: alertTypeData.code || '',
        enabled: alertTypeData.enabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    alertTypes.push(newAlertType);
    writeJsonFile(ALERT_TYPES_FILE, alertTypes);
    return newAlertType;
}

function updateAlertType(id, updateData) {
    const alertTypes = getAlertTypes();
    const index = alertTypes.findIndex(at => at.id === id);
    if (index === -1) return null;
    
    alertTypes[index] = {
        ...alertTypes[index],
        ...updateData,
        id: alertTypes[index].id,
        updatedAt: new Date().toISOString()
    };
    writeJsonFile(ALERT_TYPES_FILE, alertTypes);
    return alertTypes[index];
}

function deleteAlertType(id) {
    const alertTypes = getAlertTypes();
    const filtered = alertTypes.filter(at => at.id !== id);
    if (filtered.length === alertTypes.length) return false;
    writeJsonFile(ALERT_TYPES_FILE, filtered);
    return true;
}

function getEnabledAlertTypes() {
    return getAlertTypes().filter(at => at.enabled);
}

// ============================================
// LAST ALERTS (Duplicate Prevention)
// ============================================

function getLastAlerts() {
    return readJsonFile(LAST_ALERTS_FILE, {});
}

function setLastAlertForLocation(locationId, alertIds) {
    const lastAlerts = getLastAlerts();
    lastAlerts[locationId] = {
        alertIds: alertIds,
        updatedAt: new Date().toISOString()
    };
    writeJsonFile(LAST_ALERTS_FILE, lastAlerts);
}

function getLastAlertIdsForLocation(locationId) {
    const lastAlerts = getLastAlerts();
    return lastAlerts[locationId]?.alertIds || [];
}

function isAlertNew(locationId, alertId) {
    const lastAlertIds = getLastAlertIdsForLocation(locationId);
    return !lastAlertIds.includes(alertId);
}

function clearLastAlerts() {
    writeJsonFile(LAST_ALERTS_FILE, {});
}

// ============================================
// LOGS MANAGEMENT
// ============================================

function getLogs(limit = 100) {
    const logs = readJsonFile(LOGS_FILE, []);
    return logs.slice(-limit);
}

function addLog(logEntry) {
    const settings = getSettings();
    const logs = getLogs(settings.maxLogsToKeep * 2);
    
    const newLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        type: logEntry.type || 'info', // info, success, warning, error
        action: logEntry.action || '',
        message: logEntry.message || '',
        details: logEntry.details || null
    };
    
    logs.push(newLog);
    
    // Keep only max logs
    const trimmed = logs.slice(-settings.maxLogsToKeep);
    writeJsonFile(LOGS_FILE, trimmed);
    
    return newLog;
}

function clearLogs() {
    writeJsonFile(LOGS_FILE, []);
}

// ============================================
// INITIALIZATION
// ============================================

function initializeDatabase() {
    ensureDataDir();
    
    // Ensure all files exist with defaults
    if (!fs.existsSync(SETTINGS_FILE)) {
        writeJsonFile(SETTINGS_FILE, defaultSettings);
    }
    if (!fs.existsSync(LOCATIONS_FILE)) {
        writeJsonFile(LOCATIONS_FILE, []);
    }
    if (!fs.existsSync(ALERT_TYPES_FILE)) {
        getAlertTypes(); // This will initialize with defaults
    }
    if (!fs.existsSync(LAST_ALERTS_FILE)) {
        writeJsonFile(LAST_ALERTS_FILE, {});
    }
    if (!fs.existsSync(LOGS_FILE)) {
        writeJsonFile(LOGS_FILE, []);
    }
    
    addLog({
        type: 'info',
        action: 'system_init',
        message: 'Database initialized successfully'
    });
}

module.exports = {
    // Settings
    getSettings,
    updateSettings,
    
    // Locations
    getLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    getEnabledLocations,
    
    // Alert Types
    getAlertTypes,
    addAlertType,
    updateAlertType,
    deleteAlertType,
    getEnabledAlertTypes,
    
    // Last Alerts (Duplicate Prevention)
    getLastAlerts,
    setLastAlertForLocation,
    getLastAlertIdsForLocation,
    isAlertNew,
    clearLastAlerts,
    
    // Logs
    getLogs,
    addLog,
    clearLogs,
    
    // Initialization
    initializeDatabase
};
