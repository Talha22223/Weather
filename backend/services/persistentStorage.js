/**
 * Persistent Settings Storage
 * Stores settings in a way that survives Render deployments
 * Uses external webhook endpoints as a simple key-value store
 */

const axios = require('axios');

// Simple backup service using webhook.site or similar as storage
const BACKUP_WEBHOOK = process.env.SETTINGS_BACKUP_WEBHOOK;

/**
 * Save settings to external persistent storage
 */
async function backupSettings(settings) {
    if (!BACKUP_WEBHOOK) {
        return { success: false, message: 'No backup webhook configured' };
    }
    
    try {
        await axios.post(BACKUP_WEBHOOK, {
            type: 'settings_backup',
            timestamp: new Date().toISOString(),
            settings: settings
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WeatherAlert-SettingsBackup/1.0'
            }
        });
        
        return { success: true, message: 'Settings backed up successfully' };
    } catch (error) {
        console.error('Settings backup failed:', error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Alternative: Use localStorage-like approach with external service
 * This could be expanded to use services like:
 * - JSONBin.io (free JSON storage)
 * - Firebase Realtime Database
 * - Supabase
 * - Any REST API that accepts JSON
 */
async function saveToExternalStorage(settings) {
    // For now, just use the backup webhook approach
    return await backupSettings(settings);
}

module.exports = {
    backupSettings,
    saveToExternalStorage
};