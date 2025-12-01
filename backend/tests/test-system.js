/**
 * System Test Script
 * Run this to verify all components are working
 */

const db = require('../database/db');
const weatherFetcher = require('../services/weatherFetcher');
const alertFormatter = require('../services/alertFormatter');
const duplicateProtection = require('../services/duplicateProtection');
const webhookService = require('../services/webhookService');

async function runTests() {
    console.log('========================================');
    console.log('  Weather Alert System - Test Suite');
    console.log('========================================\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Database initialization
    console.log('Test 1: Database Initialization');
    try {
        db.initializeDatabase();
        const settings = db.getSettings();
        if (settings) {
            console.log('  ✓ Database initialized successfully');
            passed++;
        } else {
            throw new Error('Settings not found');
        }
    } catch (error) {
        console.log('  ✗ Database initialization failed:', error.message);
        failed++;
    }
    
    // Test 2: Location management
    console.log('\nTest 2: Location Management');
    try {
        const testLocation = db.addLocation({
            name: 'Test Location',
            zipCode: '10001',
            enabled: true
        });
        
        if (testLocation && testLocation.id) {
            console.log('  ✓ Location added successfully');
            
            const updated = db.updateLocation(testLocation.id, { name: 'Updated Location' });
            if (updated && updated.name === 'Updated Location') {
                console.log('  ✓ Location updated successfully');
            }
            
            const deleted = db.deleteLocation(testLocation.id);
            if (deleted) {
                console.log('  ✓ Location deleted successfully');
            }
            passed++;
        } else {
            throw new Error('Failed to create location');
        }
    } catch (error) {
        console.log('  ✗ Location management failed:', error.message);
        failed++;
    }
    
    // Test 3: Alert types
    console.log('\nTest 3: Alert Types');
    try {
        const alertTypes = db.getAlertTypes();
        if (alertTypes && alertTypes.length > 0) {
            console.log(`  ✓ Alert types loaded (${alertTypes.length} types)`);
            passed++;
        } else {
            throw new Error('No alert types found');
        }
    } catch (error) {
        console.log('  ✗ Alert types failed:', error.message);
        failed++;
    }
    
    // Test 4: Alert formatter
    console.log('\nTest 4: Alert Formatter');
    try {
        const testAlert = alertFormatter.createTestAlert({ name: 'Test', zipCode: '10001', id: 'test-id' });
        if (testAlert && testAlert.alert_id && testAlert.event) {
            console.log('  ✓ Test alert created successfully');
            console.log(`    - Alert ID: ${testAlert.alert_id}`);
            console.log(`    - Event: ${testAlert.event}`);
            passed++;
        } else {
            throw new Error('Invalid test alert format');
        }
    } catch (error) {
        console.log('  ✗ Alert formatter failed:', error.message);
        failed++;
    }
    
    // Test 5: Duplicate protection
    console.log('\nTest 5: Duplicate Protection');
    try {
        const testLocationId = 'test-dup-location';
        const testAlerts = [
            { alert_id: 'alert-1' },
            { alert_id: 'alert-2' }
        ];
        
        // First pass - all should be new
        const newAlerts1 = duplicateProtection.filterNewAlerts(testLocationId, testAlerts);
        if (newAlerts1.length === 2) {
            console.log('  ✓ First pass: all alerts marked as new');
            
            // Mark as sent
            duplicateProtection.markAlertsSent(testLocationId, testAlerts);
            
            // Second pass - all should be duplicates
            const newAlerts2 = duplicateProtection.filterNewAlerts(testLocationId, testAlerts);
            if (newAlerts2.length === 0) {
                console.log('  ✓ Second pass: all alerts marked as duplicates');
                
                // Clean up
                duplicateProtection.clearForLocation(testLocationId);
                console.log('  ✓ Duplicate cache cleared');
                passed++;
            } else {
                throw new Error('Duplicates not detected');
            }
        } else {
            throw new Error('New alerts not detected');
        }
    } catch (error) {
        console.log('  ✗ Duplicate protection failed:', error.message);
        failed++;
    }
    
    // Test 6: Webhook URL validation
    console.log('\nTest 6: Webhook URL Validation');
    try {
        const valid = webhookService.validateWebhookUrl('https://example.com/webhook');
        const invalid = webhookService.validateWebhookUrl('not-a-url');
        
        if (valid.valid && !invalid.valid) {
            console.log('  ✓ URL validation working correctly');
            passed++;
        } else {
            throw new Error('URL validation incorrect');
        }
    } catch (error) {
        console.log('  ✗ Webhook validation failed:', error.message);
        failed++;
    }
    
    // Test 7: Logs
    console.log('\nTest 7: Logging System');
    try {
        db.addLog({
            type: 'info',
            action: 'test',
            message: 'Test log entry'
        });
        
        const logs = db.getLogs(10);
        const testLog = logs.find(l => l.action === 'test');
        
        if (testLog) {
            console.log('  ✓ Log entry created and retrieved');
            passed++;
        } else {
            throw new Error('Log entry not found');
        }
    } catch (error) {
        console.log('  ✗ Logging failed:', error.message);
        failed++;
    }
    
    // Summary
    console.log('\n========================================');
    console.log('  Test Results');
    console.log('========================================');
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log('');
    
    if (failed === 0) {
        console.log('  ✓ All tests passed!');
        console.log('');
        console.log('  Next steps:');
        console.log('  1. Start the server: npm start');
        console.log('  2. Open http://localhost:3000');
        console.log('  3. Configure API credentials');
        console.log('  4. Configure webhook URL');
        console.log('  5. Add locations');
        console.log('  6. Send a test alert');
    } else {
        console.log('  ✗ Some tests failed. Please check the errors above.');
    }
    console.log('');
}

// Run tests
runTests().catch(console.error);
