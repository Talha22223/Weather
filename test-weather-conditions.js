/**
 * Test script to manually trigger alert and weather condition processing
 */

const alertProcessor = require('./backend/services/alertProcessor');

console.log('');
console.log('========================================');
console.log('  Testing Weather Condition System');
console.log('========================================');
console.log('');

async function test() {
    try {
        console.log('Running alert processing (which now includes weather conditions)...\n');
        
        const result = await alertProcessor.processAllAlerts();
        
        console.log('\n========================================');
        console.log('  Test Results');
        console.log('========================================');
        console.log(`Locations Processed: ${result.locationsProcessed}`);
        console.log(`Severe Alerts Found: ${result.newAlerts}`);
        console.log(`Alerts Sent: ${result.alertsSent}`);
        console.log(`Weather Conditions Sent: ${result.weatherConditionsSent || 0}`);
        console.log(`Duration: ${result.duration}ms`);
        
        if (result.errors && result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach(err => {
                console.log(`  - ${err.location}: ${err.error}`);
            });
        }
        
        console.log('\n✅ Test complete! Check the webhook for delivered notifications.');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

test();
