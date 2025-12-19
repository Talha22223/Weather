/**
 * Weather Alert Automation System
 * Main Application Script
 */

// ============================================
// STATE
// ============================================

const state = {
    currentTab: 'dashboard',
    settings: null,
    locations: [],
    alertTypes: [],
    logs: [],
    schedulerStatus: null,
    theme: 'light'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    checkAuthentication();
    
    initTheme();
    initNavigation();
    initEventListeners();
    loadDashboard();
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Continue anyway for local development
    }
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// ============================================
// THEME TOGGLE
// ============================================

function initTheme() {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('weatherAlertTheme') || 'light';
    setTheme(savedTheme);
    
    // Add click handler for theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('weatherAlertTheme', theme);
}

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tab);
    });
    
    state.currentTab = tab;
    
    // Load tab data
    switch (tab) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'locations':
            loadLocations();
            break;
        case 'alert-types':
            loadAlertTypes();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

function initEventListeners() {
    // Dashboard controls
    document.getElementById('schedulerToggle').addEventListener('change', handleSchedulerToggle);
    document.getElementById('updateFrequencyBtn').addEventListener('click', handleUpdateFrequency);
    document.getElementById('triggerNowBtn').addEventListener('click', handleTriggerNow);
    document.getElementById('testAlertBtn').addEventListener('click', handleTestAlert);
    document.getElementById('testApiBtn').addEventListener('click', handleTestApi);
    document.getElementById('testWebhookBtn').addEventListener('click', handleTestWebhook);
    
    // Forecast controls
    document.getElementById('forecastToggle').addEventListener('change', handleForecastToggle);
    document.getElementById('updateForecastTimeBtn').addEventListener('click', handleUpdateForecastTime);
    document.getElementById('triggerForecastBtn').addEventListener('click', handleTriggerForecast);
    
    // Locations
    document.getElementById('addLocationBtn').addEventListener('click', showAddLocationModal);
    
    // Alert Types
    document.getElementById('addAlertTypeBtn').addEventListener('click', showAddAlertTypeModal);
    document.getElementById('enableAllBtn').addEventListener('click', () => handleBulkToggleAlertTypes(true));
    document.getElementById('disableAllBtn').addEventListener('click', () => handleBulkToggleAlertTypes(false));
    
    // Settings
    document.getElementById('apiSettingsForm').addEventListener('submit', handleSaveApiSettings);
    document.getElementById('testApiSettingsBtn').addEventListener('click', handleTestApi);
    document.getElementById('webhookSettingsForm').addEventListener('submit', handleSaveWebhookSettings);
    document.getElementById('testWebhookSettingsBtn').addEventListener('click', handleTestWebhook);
    document.getElementById('systemSettingsForm').addEventListener('submit', handleSaveSystemSettings);
    document.getElementById('clearLogsBtn').addEventListener('click', handleClearLogs);
    document.getElementById('resetDuplicatesBtn').addEventListener('click', handleResetDuplicates);
    
    // API Provider toggle
    document.getElementById('apiProvider').addEventListener('change', handleApiProviderChange);
    
    // Webhook Provider toggle
    document.getElementById('webhookProvider').addEventListener('change', handleWebhookProviderChange);
    
    // Logs
    document.getElementById('logTypeFilter').addEventListener('change', loadLogs);
    document.getElementById('refreshLogsBtn').addEventListener('click', loadLogs);
    
    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    try {
        const [systemStatus, locations, alertTypes, logStats, forecastStatus] = await Promise.all([
            api.getSystemStatus(),
            api.getLocations(),
            api.getAlertTypes(),
            api.getLogStats(),
            api.getForecastStatus()
        ]);
        
        state.schedulerStatus = systemStatus.data;
        state.locations = locations.data;
        state.alertTypes = alertTypes.data;
        
        updateHeaderStatus(systemStatus.data);
        updateSystemStatus(systemStatus.data);
        updateQuickStats(locations.data, alertTypes.data, systemStatus.data);
        updateSchedulerControls(systemStatus.data);
        updateForecastControls(forecastStatus.status);
        updateRecentActivity(logStats.data);
        
    } catch (error) {
        showToast('Failed to load dashboard', 'error');
        console.error('Dashboard load error:', error);
    }
}

function updateHeaderStatus(status) {
    const headerStatus = document.getElementById('headerStatus');
    const dot = headerStatus.querySelector('.status-dot');
    const text = headerStatus.querySelector('.status-text');
    
    if (status.configured && status.scheduler?.running) {
        dot.className = 'status-dot online';
        text.textContent = 'System Active';
    } else if (status.configured) {
        dot.className = 'status-dot warning';
        text.textContent = 'Scheduler Paused';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'Setup Required';
    }
}

function updateSystemStatus(status) {
    document.getElementById('apiStatus').textContent = status.apiConfigured ? '✓ Connected' : '✗ Not Configured';
    document.getElementById('apiStatus').className = `status-value ${status.apiConfigured ? 'success' : 'error'}`;
    
    document.getElementById('webhookStatus').textContent = status.webhookConfigured ? '✓ Connected' : '✗ Not Configured';
    document.getElementById('webhookStatus').className = `status-value ${status.webhookConfigured ? 'success' : 'error'}`;
    
    document.getElementById('schedulerStatus').textContent = status.scheduler?.running ? '✓ Running' : '○ Stopped';
    document.getElementById('schedulerStatus').className = `status-value ${status.scheduler?.running ? 'success' : 'warning'}`;
    
    const lastRun = status.lastRun ? formatTime(status.lastRun) : 'Never';
    document.getElementById('lastRun').textContent = lastRun;
}

function updateQuickStats(locations, alertTypes, status) {
    const enabledLocations = locations.filter(l => l.enabled).length;
    const enabledAlertTypes = alertTypes.filter(at => at.enabled).length;
    
    document.getElementById('locationsCount').textContent = enabledLocations;
    document.getElementById('alertTypesCount').textContent = enabledAlertTypes;
    document.getElementById('frequencyDisplay').textContent = `${status.scheduleFrequency}m`;
}

function updateSchedulerControls(status) {
    document.getElementById('schedulerToggle').checked = status.schedulerEnabled;
    document.getElementById('schedulerToggleLabel').textContent = status.schedulerEnabled ? 'Scheduler Enabled' : 'Scheduler Disabled';
    document.getElementById('frequencyInput').value = status.scheduleFrequency;
}

function updateForecastControls(status) {
    document.getElementById('forecastToggle').checked = status.enabled;
    document.getElementById('forecastToggleLabel').textContent = status.enabled ? 'Daily Forecasts Enabled' : 'Daily Forecasts Disabled';
    document.getElementById('forecastTimeInput').value = status.time || '07:00';
    
    const forecastStatusEl = document.getElementById('forecastStatus');
    if (status.enabled && status.running) {
        forecastStatusEl.innerHTML = `<small>Sends daily at ${status.timeDescription}</small>`;
    } else if (status.enabled && !status.running) {
        forecastStatusEl.innerHTML = `<small>Configured for ${status.timeDescription}</small>`;
    } else {
        forecastStatusEl.innerHTML = `<small>Disabled</small>`;
    }
}

function updateRecentActivity(logStats) {
    const container = document.getElementById('recentActivity');
    const logs = logStats.recentErrors || [];
    
    if (logs.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="activity-item">
            <div class="activity-icon ${log.type}">${getLogIcon(log.type)}</div>
            <div class="activity-content">
                <div class="activity-message">${escapeHtml(log.message)}</div>
                <div class="activity-time">${formatTime(log.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// LOCATIONS
// ============================================

async function loadLocations() {
    try {
        const response = await api.getLocations();
        state.locations = response.data;
        renderLocations();
    } catch (error) {
        showToast('Failed to load locations', 'error');
    }
}

function renderLocations() {
    const tbody = document.getElementById('locationsBody');
    
    if (state.locations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state-icon">📍</div>
                    <p>No locations configured</p>
                    <p>Click "Add Location" to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.locations.map(location => `
        <tr>
            <td>
                <span class="status-badge ${location.enabled ? 'enabled' : 'disabled'}">
                    ${location.enabled ? '● Enabled' : '○ Disabled'}
                </span>
            </td>
            <td>${escapeHtml(location.name) || '-'}</td>
            <td>${escapeHtml(location.zipCode) || '-'}</td>
            <td>${location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="handleToggleLocation('${location.id}')">
                    ${location.enabled ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showEditLocationModal('${location.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="handleDeleteLocation('${location.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddLocationModal() {
    const html = `
        <form id="locationForm">
            <div class="form-group">
                <label for="locName">Location Name</label>
                <input type="text" id="locName" placeholder="e.g., Main Office">
            </div>
            <div class="form-group">
                <label for="locZip">ZIP Code</label>
                <input type="text" id="locZip" placeholder="e.g., 10001">
            </div>
            <p style="text-align: center; color: var(--color-text-muted); margin: 1rem 0;">— OR —</p>
            <div class="form-group">
                <label for="locLat">Latitude</label>
                <input type="number" id="locLat" step="any" placeholder="e.g., 40.7128">
            </div>
            <div class="form-group">
                <label for="locLon">Longitude</label>
                <input type="number" id="locLon" step="any" placeholder="e.g., -74.0060">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Location</button>
            </div>
        </form>
    `;
    
    showModal('Add Location', html);
    
    document.getElementById('locationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('locName').value,
            zipCode: document.getElementById('locZip').value,
            latitude: document.getElementById('locLat').value || null,
            longitude: document.getElementById('locLon').value || null
        };
        
        try {
            await api.addLocation(data);
            showToast('Location added successfully', 'success');
            closeModal();
            loadLocations();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function showEditLocationModal(id) {
    const location = state.locations.find(l => l.id === id);
    if (!location) return;
    
    const html = `
        <form id="locationForm">
            <div class="form-group">
                <label for="locName">Location Name</label>
                <input type="text" id="locName" value="${escapeHtml(location.name)}" placeholder="e.g., Main Office">
            </div>
            <div class="form-group">
                <label for="locZip">ZIP Code</label>
                <input type="text" id="locZip" value="${escapeHtml(location.zipCode)}" placeholder="e.g., 10001">
            </div>
            <div class="form-group">
                <label for="locLat">Latitude</label>
                <input type="number" id="locLat" step="any" value="${location.latitude || ''}" placeholder="e.g., 40.7128">
            </div>
            <div class="form-group">
                <label for="locLon">Longitude</label>
                <input type="number" id="locLon" step="any" value="${location.longitude || ''}" placeholder="e.g., -74.0060">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;
    
    showModal('Edit Location', html);
    
    document.getElementById('locationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('locName').value,
            zipCode: document.getElementById('locZip').value,
            latitude: document.getElementById('locLat').value || null,
            longitude: document.getElementById('locLon').value || null
        };
        
        try {
            await api.updateLocation(id, data);
            showToast('Location updated successfully', 'success');
            closeModal();
            loadLocations();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function handleToggleLocation(id) {
    try {
        await api.toggleLocation(id);
        loadLocations();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteLocation(id) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
        await api.deleteLocation(id);
        showToast('Location deleted', 'success');
        loadLocations();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// ALERT TYPES
// ============================================

async function loadAlertTypes() {
    try {
        const response = await api.getAlertTypes();
        state.alertTypes = response.data;
        renderAlertTypes();
    } catch (error) {
        showToast('Failed to load alert types', 'error');
    }
}

function renderAlertTypes() {
    const tbody = document.getElementById('alertTypesBody');
    
    if (state.alertTypes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>No alert types configured</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = state.alertTypes.map(alertType => `
        <tr>
            <td>
                <span class="status-badge ${alertType.enabled ? 'enabled' : 'disabled'}">
                    ${alertType.enabled ? '● Enabled' : '○ Disabled'}
                </span>
            </td>
            <td>${escapeHtml(alertType.name)}</td>
            <td><code>${escapeHtml(alertType.code)}</code></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="handleToggleAlertType('${alertType.id}')">
                    ${alertType.enabled ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showEditAlertTypeModal('${alertType.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="handleDeleteAlertType('${alertType.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddAlertTypeModal() {
    const html = `
        <form id="alertTypeForm">
            <div class="form-group">
                <label for="atName">Alert Name</label>
                <input type="text" id="atName" required placeholder="e.g., Tornado Warning">
            </div>
            <div class="form-group">
                <label for="atCode">Alert Code</label>
                <input type="text" id="atCode" required placeholder="e.g., TO.W">
                <small style="color: var(--color-text-muted);">Use XWeather alert type codes</small>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Alert Type</button>
            </div>
        </form>
    `;
    
    showModal('Add Alert Type', html);
    
    document.getElementById('alertTypeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('atName').value,
            code: document.getElementById('atCode').value
        };
        
        try {
            await api.addAlertType(data);
            showToast('Alert type added successfully', 'success');
            closeModal();
            loadAlertTypes();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function showEditAlertTypeModal(id) {
    const alertType = state.alertTypes.find(at => at.id === id);
    if (!alertType) return;
    
    const html = `
        <form id="alertTypeForm">
            <div class="form-group">
                <label for="atName">Alert Name</label>
                <input type="text" id="atName" value="${escapeHtml(alertType.name)}" required>
            </div>
            <div class="form-group">
                <label for="atCode">Alert Code</label>
                <input type="text" id="atCode" value="${escapeHtml(alertType.code)}" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;
    
    showModal('Edit Alert Type', html);
    
    document.getElementById('alertTypeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('atName').value,
            code: document.getElementById('atCode').value
        };
        
        try {
            await api.updateAlertType(id, data);
            showToast('Alert type updated successfully', 'success');
            closeModal();
            loadAlertTypes();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function handleToggleAlertType(id) {
    try {
        await api.toggleAlertType(id);
        loadAlertTypes();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteAlertType(id) {
    if (!confirm('Are you sure you want to delete this alert type?')) return;
    
    try {
        await api.deleteAlertType(id);
        showToast('Alert type deleted', 'success');
        loadAlertTypes();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleBulkToggleAlertTypes(enabled) {
    const ids = state.alertTypes.map(at => at.id);
    
    try {
        await api.bulkToggleAlertTypes(ids, enabled);
        showToast(`All alert types ${enabled ? 'enabled' : 'disabled'}`, 'success');
        loadAlertTypes();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// SETTINGS
// ============================================

async function loadSettings() {
    try {
        const response = await api.getSettings();
        state.settings = response.data;
        populateSettingsForm();
    } catch (error) {
        showToast('Failed to load settings', 'error');
    }
}

function populateSettingsForm() {
    const s = state.settings;
    
    // API Settings
    const apiProvider = s.apiProvider || 'openweathermap';
    document.getElementById('apiProvider').value = apiProvider;
    
    // Show/hide appropriate API fields
    handleApiProviderChange();
    
    // Populate API fields
    document.getElementById('apiKey').value = s.apiKey || '';
    document.getElementById('apiBaseUrl').value = s.apiBaseUrl || '';
    
    // Handle credentials intelligently - preserve existing values unless masked
    const clientIdField = document.getElementById('apiClientId');
    const clientSecretField = document.getElementById('apiClientSecret');
    
    // Only clear and repopulate if we have different values
    if (s.apiClientId) {
        if (s.apiClientId.endsWith('...')) {
            // Server returned masked value - keep existing field value if any
            if (!clientIdField.value) {
                clientIdField.placeholder = s.apiClientId + ' (configured)';
            }
        } else {
            // Server returned actual value - use it
            clientIdField.value = s.apiClientId;
        }
    }
    
    if (s.apiClientSecret) {
        if (s.apiClientSecret === '********') {
            // Server returned masked value - keep existing field value if any  
            if (!clientSecretField.value) {
                clientSecretField.placeholder = '••••••••• (configured)';
            }
        } else {
            // Server returned actual value - use it
            clientSecretField.value = s.apiClientSecret;
        }
    }
    
    // Webhook Settings
    const webhookUrl = s.webhookUrl || '';
    document.getElementById('webhookUrl').value = webhookUrl;
    
    // Detect webhook provider from URL
    if (webhookUrl.includes('webhook.site')) {
        document.getElementById('webhookProvider').value = 'webhook.site';
    } else if (webhookUrl.includes('requestbin')) {
        document.getElementById('webhookProvider').value = 'requestbin';
    } else if (webhookUrl.includes('leadconnectorhq') || webhookUrl.includes('gohighlevel')) {
        document.getElementById('webhookProvider').value = 'gohighlevel';
    } else if (webhookUrl) {
        document.getElementById('webhookProvider').value = 'custom';
    }
    handleWebhookProviderChange();
    
    // System Settings
    document.getElementById('maxLogsToKeep').value = s.maxLogsToKeep || 100;
}

function handleApiProviderChange() {
    const provider = document.getElementById('apiProvider').value;
    const owmFields = document.getElementById('openweathermapFields');
    const xweatherFields = document.getElementById('xweatherFields');
    
    if (provider === 'openweathermap') {
        owmFields.style.display = 'block';
        xweatherFields.style.display = 'none';
    } else {
        owmFields.style.display = 'none';
        xweatherFields.style.display = 'block';
    }
    
    // Preserve existing values when switching providers
    // Don't reload/clear the form automatically
}

function handleWebhookProviderChange() {
    const provider = document.getElementById('webhookProvider').value;
    const hint = document.getElementById('webhookHint');
    const urlInput = document.getElementById('webhookUrl');
    
    switch (provider) {
        case 'webhook.site':
            hint.innerHTML = 'Create free webhook at <a href="https://webhook.site" target="_blank">webhook.site</a>';
            urlInput.placeholder = 'https://webhook.site/your-unique-id';
            break;
        case 'requestbin':
            hint.innerHTML = 'Create free webhook at <a href="https://requestbin.com" target="_blank">requestbin.com</a>';
            urlInput.placeholder = 'https://requestbin.com/your-bin-id';
            break;
        case 'gohighlevel':
            hint.innerHTML = 'Get webhook URL from GoHighLevel workflow settings';
            urlInput.placeholder = 'https://services.leadconnectorhq.com/hooks/...';
            break;
        case 'custom':
            hint.innerHTML = 'Enter any webhook URL that accepts POST requests';
            urlInput.placeholder = 'https://your-server.com/webhook';
            break;
    }
}

async function handleSaveApiSettings(e) {
    e.preventDefault();
    
    const provider = document.getElementById('apiProvider').value;
    
    try {
        if (provider === 'openweathermap') {
            const apiKey = document.getElementById('apiKey').value;
            
            // Only update if API key is provided and not masked
            if (apiKey && !apiKey.includes('...')) {
                await api.updateSettings({
                    apiProvider: provider,
                    apiKey: apiKey
                });
            } else {
                // Just update the provider
                await api.updateSettings({
                    apiProvider: provider
                });
            }
        } else {
            // XWeather
            const clientId = document.getElementById('apiClientId').value;
            const clientSecret = document.getElementById('apiClientSecret').value;
            const baseUrl = document.getElementById('apiBaseUrl').value;
            
            // Always update provider and base URL
            await api.updateSettings({
                apiProvider: provider,
                apiBaseUrl: baseUrl
            });
            
            // Only update credentials if both are provided and not empty
            if (clientId && clientSecret && clientId.trim() !== '' && clientSecret.trim() !== '') {
                await api.updateApiCredentials(clientId, clientSecret);
            }
        }
        
        showToast('API settings saved', 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSaveWebhookSettings(e) {
    e.preventDefault();
    
    const webhookUrl = document.getElementById('webhookUrl').value;
    
    try {
        await api.updateSettings({ webhookUrl });
        showToast('Webhook URL saved', 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSaveSystemSettings(e) {
    e.preventDefault();
    
    const maxLogsToKeep = parseInt(document.getElementById('maxLogsToKeep').value);
    
    try {
        await api.updateSettings({ maxLogsToKeep });
        showToast('System settings saved', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// LOGS
// ============================================

async function loadLogs() {
    try {
        const type = document.getElementById('logTypeFilter').value;
        const response = await api.getLogs(100, type || null);
        state.logs = response.data;
        renderLogs();
    } catch (error) {
        showToast('Failed to load logs', 'error');
    }
}

function renderLogs() {
    const container = document.getElementById('logsContainer');
    
    if (state.logs.length === 0) {
        container.innerHTML = '<p class="empty-state">No logs found</p>';
        return;
    }
    
    container.innerHTML = state.logs.map(log => `
        <div class="log-entry">
            <span class="log-type ${log.type}">${log.type}</span>
            <div class="log-content">
                <div class="log-message">${escapeHtml(log.message)}</div>
                <div class="log-action">${escapeHtml(log.action)}</div>
            </div>
            <span class="log-time">${formatTime(log.timestamp)}</span>
        </div>
    `).join('');
}

async function handleClearLogs() {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
        await api.clearLogs();
        showToast('Logs cleared', 'success');
        loadLogs();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleResetDuplicates() {
    if (!confirm('Are you sure? This will cause all current alerts to be sent again.')) return;
    
    try {
        await api.clearDuplicates();
        showToast('Duplicate protection reset', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// SCHEDULER CONTROLS
// ============================================

async function handleSchedulerToggle() {
    try {
        await api.toggleScheduler();
        showToast('Scheduler toggled', 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
        loadDashboard();
    }
}

async function handleUpdateFrequency() {
    const frequency = parseInt(document.getElementById('frequencyInput').value);
    
    if (!frequency || frequency < 1 || frequency > 1440) {
        showToast('Frequency must be between 1 and 1440 minutes', 'error');
        return;
    }
    
    try {
        await api.updateFrequency(frequency);
        showToast(`Frequency updated to ${frequency} minutes`, 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTriggerNow() {
    const btn = document.getElementById('triggerNowBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Checking...';
    
    try {
        const result = await api.triggerNow();
        showToast(`Checked ${result.data.locationsProcessed} locations, found ${result.data.newAlerts} new alerts`, 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🔄</span> Check Alerts Now';
    }
}

async function handleForecastToggle(e) {
    const enabled = e.target.checked;
    
    try {
        await api.setForecastEnabled(enabled);
        document.getElementById('forecastToggleLabel').textContent = enabled ? 'Daily Forecasts Enabled' : 'Daily Forecasts Disabled';
        showToast(enabled ? 'Daily forecasts enabled' : 'Daily forecasts disabled', 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
        e.target.checked = !enabled;
    }
}

async function handleUpdateForecastTime() {
    const time = document.getElementById('forecastTimeInput').value;
    
    if (!time) {
        showToast('Please enter a valid time', 'error');
        return;
    }
    
    try {
        await api.updateForecastTime(time);
        showToast(`Forecast time updated to ${time}`, 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTriggerForecast() {
    const btn = document.getElementById('triggerForecastBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
    
    try {
        const result = await api.triggerForecast();
        showToast(`Sent forecasts for ${result.data.locationsProcessed} location(s)`, 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🌤️</span> Send Forecast Now';
    }
}

async function handleTestAlert() {
    const btn = document.getElementById('testAlertBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
    
    try {
        const result = await api.sendTestAlert();
        if (result.success) {
            showToast('Test alert sent successfully!', 'success');
        } else {
            showToast(result.error || 'Failed to send test alert', 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">📤</span> Send Test Alert';
    }
}

async function handleTestApi() {
    try {
        const result = await api.testApiConnection();
        if (result.success) {
            showToast('API connection successful!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTestWebhook() {
    try {
        const result = await api.testWebhookConnection();
        if (result.success) {
            showToast('Webhook connection successful!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// MODAL
// ============================================

function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalContainer').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalContainer').classList.add('hidden');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
    
    // Format date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getLogIcon(type) {
    switch (type) {
        case 'success': return '✓';
        case 'warning': return '⚠';
        case 'error': return '✗';
        case 'info':
        default: return 'ℹ';
    }
}

// Make functions available globally for onclick handlers
window.handleToggleLocation = handleToggleLocation;
window.handleDeleteLocation = handleDeleteLocation;
window.showEditLocationModal = showEditLocationModal;
window.handleToggleAlertType = handleToggleAlertType;
window.handleDeleteAlertType = handleDeleteAlertType;
window.showEditAlertTypeModal = showEditAlertTypeModal;
window.closeModal = closeModal;
