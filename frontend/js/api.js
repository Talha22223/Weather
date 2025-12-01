/**
 * API Client
 * Handles all API communication with the backend
 */

// Use environment-based API URL for production
// Replace YOUR_RENDER_APP_NAME with your actual Render app name after deployment
const API_BASE = window.location.hostname === 'localhost' 
    ? '/api' 
    : 'https://weather-alert-backend.onrender.com/api';

class ApiClient {
    /**
     * Make an API request
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // ============================================
    // SETTINGS
    // ============================================
    
    async getSettings() {
        return this.request('/settings');
    }
    
    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: settings
        });
    }
    
    async updateApiCredentials(clientId, clientSecret) {
        return this.request('/settings/api-credentials', {
            method: 'POST',
            body: { apiClientId: clientId, apiClientSecret: clientSecret }
        });
    }
    
    async testApiConnection() {
        return this.request('/settings/test-api', { method: 'POST' });
    }
    
    async testWebhookConnection() {
        return this.request('/settings/test-webhook', { method: 'POST' });
    }
    
    // ============================================
    // LOCATIONS
    // ============================================
    
    async getLocations() {
        return this.request('/locations');
    }
    
    async addLocation(location) {
        return this.request('/locations', {
            method: 'POST',
            body: location
        });
    }
    
    async updateLocation(id, location) {
        return this.request(`/locations/${id}`, {
            method: 'PUT',
            body: location
        });
    }
    
    async deleteLocation(id) {
        return this.request(`/locations/${id}`, { method: 'DELETE' });
    }
    
    async toggleLocation(id) {
        return this.request(`/locations/${id}/toggle`, { method: 'POST' });
    }
    
    // ============================================
    // ALERT TYPES
    // ============================================
    
    async getAlertTypes() {
        return this.request('/alert-types');
    }
    
    async addAlertType(alertType) {
        return this.request('/alert-types', {
            method: 'POST',
            body: alertType
        });
    }
    
    async updateAlertType(id, alertType) {
        return this.request(`/alert-types/${id}`, {
            method: 'PUT',
            body: alertType
        });
    }
    
    async deleteAlertType(id) {
        return this.request(`/alert-types/${id}`, { method: 'DELETE' });
    }
    
    async toggleAlertType(id) {
        return this.request(`/alert-types/${id}/toggle`, { method: 'POST' });
    }
    
    async bulkToggleAlertTypes(ids, enabled) {
        return this.request('/alert-types/bulk-toggle', {
            method: 'POST',
            body: { ids, enabled }
        });
    }
    
    // ============================================
    // SCHEDULER
    // ============================================
    
    async getSchedulerStatus() {
        return this.request('/scheduler/status');
    }
    
    async getSystemStatus() {
        return this.request('/scheduler/system-status');
    }
    
    async startScheduler() {
        return this.request('/scheduler/start', { method: 'POST' });
    }
    
    async stopScheduler() {
        return this.request('/scheduler/stop', { method: 'POST' });
    }
    
    async restartScheduler() {
        return this.request('/scheduler/restart', { method: 'POST' });
    }
    
    async toggleScheduler() {
        return this.request('/scheduler/toggle', { method: 'POST' });
    }
    
    async updateFrequency(frequency) {
        return this.request('/scheduler/frequency', {
            method: 'PUT',
            body: { frequency }
        });
    }
    
    async triggerNow() {
        return this.request('/scheduler/trigger', { method: 'POST' });
    }
    
    async sendTestAlert(locationId = null) {
        return this.request('/scheduler/test-alert', {
            method: 'POST',
            body: { locationId }
        });
    }
    
    // ============================================
    // LOGS
    // ============================================
    
    async getLogs(limit = 100, type = null) {
        let url = `/logs?limit=${limit}`;
        if (type) url += `&type=${type}`;
        return this.request(url);
    }
    
    async getLogStats() {
        return this.request('/logs/stats');
    }
    
    async clearLogs() {
        return this.request('/logs', { method: 'DELETE' });
    }
    
    async getDuplicateStats() {
        return this.request('/logs/duplicate-stats');
    }
    
    async clearDuplicates() {
        return this.request('/logs/clear-duplicates', { method: 'POST' });
    }
    
    // ============================================
    // HEALTH
    // ============================================
    
    async healthCheck() {
        return this.request('/health');
    }
}

// Export singleton instance
const api = new ApiClient();
