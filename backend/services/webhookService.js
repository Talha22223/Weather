/**
 * GoHighLevel Webhook Integration Service
 * Sends formatted alerts to GHL webhook URL
 * All configuration is dynamic - loaded from database
 */

const axios = require('axios');
const db = require('../database/db');

/**
 * Send a single alert to GoHighLevel webhook
 * @param {Object} alert - Formatted alert object
 * @returns {Promise<Object>} - Result of the webhook call
 */
async function sendAlertToWebhook(alert) {
    const settings = db.getSettings();
    
    if (!settings.webhookUrl) {
        throw new Error('GoHighLevel webhook URL not configured');
    }
    
    try {
        const response = await axios.post(settings.webhookUrl, alert, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WeatherAlertAutomation/1.0'
            }
        });
        
        db.addLog({
            type: 'success',
            action: 'webhook_send',
            message: `Alert sent to GoHighLevel: ${alert.event}`,
            details: {
                alertId: alert.alert_id,
                event: alert.event,
                location: alert.location,
                responseStatus: response.status
            }
        });
        
        return {
            success: true,
            alertId: alert.alert_id,
            status: response.status,
            message: 'Alert sent successfully'
        };
        
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        
        db.addLog({
            type: 'error',
            action: 'webhook_send',
            message: `Failed to send alert to GoHighLevel: ${errorMessage}`,
            details: {
                alertId: alert.alert_id,
                event: alert.event,
                error: errorMessage,
                status: error.response?.status
            }
        });
        
        return {
            success: false,
            alertId: alert.alert_id,
            error: errorMessage,
            status: error.response?.status
        };
    }
}

/**
 * Send multiple alerts to GoHighLevel webhook
 * @param {Array} alerts - Array of formatted alert objects
 * @returns {Promise<Object>} - Results summary
 */
async function sendAlertsToWebhook(alerts) {
    if (!alerts || alerts.length === 0) {
        return {
            sent: 0,
            failed: 0,
            results: []
        };
    }
    
    const results = [];
    let sent = 0;
    let failed = 0;
    
    for (const alert of alerts) {
        const result = await sendAlertToWebhook(alert);
        results.push(result);
        
        if (result.success) {
            sent++;
        } else {
            failed++;
        }
        
        // Small delay between requests to avoid overwhelming the webhook
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    db.addLog({
        type: failed > 0 ? 'warning' : 'success',
        action: 'webhook_batch',
        message: `Sent ${sent} alerts to GoHighLevel (${failed} failed)`,
        details: { sent, failed, total: alerts.length }
    });
    
    return { sent, failed, results };
}

/**
 * Test the webhook connection
 * Sends a test payload to verify the webhook URL is working
 * @returns {Promise<Object>} - Test result
 */
async function testWebhookConnection() {
    const settings = db.getSettings();
    
    if (!settings.webhookUrl) {
        return {
            success: false,
            message: 'GoHighLevel webhook URL not configured'
        };
    }
    
    // Create a test payload
    const testPayload = {
        alert_id: `TEST-${Date.now()}`,
        event: 'Test Weather Alert',
        severity: 'Test',
        description: 'This is a test alert from the Weather Alert Automation System. If you receive this, your webhook connection is working correctly.',
        headline: 'SYSTEM TEST - Not a real alert',
        area: 'Test Area',
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString(),
        issued_at: new Date().toISOString(),
        location: 'Test Location',
        location_id: 'test',
        source: 'WeatherAlertSystem-Test',
        is_test: true
    };
    
    try {
        const response = await axios.post(settings.webhookUrl, testPayload, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WeatherAlertAutomation/1.0'
            }
        });
        
        db.addLog({
            type: 'success',
            action: 'webhook_test',
            message: 'Webhook connection test successful',
            details: { status: response.status }
        });
        
        return {
            success: true,
            message: 'Webhook connection successful',
            status: response.status,
            testPayload: testPayload
        };
        
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        
        db.addLog({
            type: 'error',
            action: 'webhook_test',
            message: `Webhook connection test failed: ${errorMessage}`,
            details: { error: errorMessage, status: error.response?.status }
        });
        
        return {
            success: false,
            message: `Webhook connection failed: ${errorMessage}`,
            status: error.response?.status
        };
    }
}

/**
 * Validate webhook URL format
 * @param {String} url - Webhook URL to validate
 * @returns {Object} - Validation result
 */
function validateWebhookUrl(url) {
    if (!url) {
        return { valid: false, message: 'Webhook URL is required' };
    }
    
    try {
        const parsed = new URL(url);
        
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { valid: false, message: 'Webhook URL must use HTTP or HTTPS protocol' };
        }
        
        // Check for common GHL webhook patterns
        const isGhlUrl = url.includes('gohighlevel') || 
                         url.includes('highlevel') || 
                         url.includes('leadconnectorhq') ||
                         url.includes('msgsndr');
        
        return { 
            valid: true, 
            message: isGhlUrl ? 'Valid GoHighLevel webhook URL' : 'Valid URL format',
            isGhlUrl 
        };
        
    } catch (error) {
        return { valid: false, message: 'Invalid URL format' };
    }
}

module.exports = {
    sendAlertToWebhook,
    sendAlertsToWebhook,
    testWebhookConnection,
    validateWebhookUrl
};
