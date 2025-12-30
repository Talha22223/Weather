/**
 * Weather Condition Formatter
 * Formats weather condition data for webhook delivery
 */

/**
 * Format weather conditions for webhook
 * @param {Object} conditionData - Weather condition data with classification
 * @param {Object} location - Location information
 * @returns {Object} - Formatted condition notification
 */
function formatWeatherCondition(conditionData, location) {
    const { conditions, classification } = conditionData;
    
    // Determine notification type
    let notificationType;
    let priority;
    
    if (classification.classification === 'severe') {
        notificationType = 'SEVERE_WEATHER';
        priority = 'high';
    } else if (classification.classification === 'bad') {
        notificationType = 'BAD_WEATHER';
        priority = 'medium';
    } else if (classification.classification === 'fair') {
        notificationType = 'FAIR_WEATHER';
        priority = 'low';
    } else {
        notificationType = 'GOOD_WEATHER';
        priority = 'low';
    }
    
    // Build detailed message
    let detailedMessage = `Current Weather for ${location.name || location.zipCode}:\n\n`;
    detailedMessage += `🌡️ Temperature: ${conditions.temp}°F (Feels like ${conditions.feelsLike}°F)\n`;
    detailedMessage += `☁️ Conditions: ${capitalizeFirstLetter(conditions.description)}\n`;
    detailedMessage += `💨 Wind: ${conditions.windSpeed} mph\n`;
    detailedMessage += `💧 Humidity: ${conditions.humidity}%\n`;
    
    if (conditions.rain > 0) {
        detailedMessage += `🌧️ Rain: ${conditions.rain.toFixed(2)} inches\n`;
    }
    
    if (conditions.snow > 0) {
        detailedMessage += `❄️ Snow: ${conditions.snow.toFixed(2)} inches\n`;
    }
    
    if (conditions.visibility !== null) {
        detailedMessage += `👁️ Visibility: ${conditions.visibility} miles\n`;
    }
    
    detailedMessage += `\n📊 Status: ${classification.summary}`;
    
    if (classification.reasons.length > 0) {
        detailedMessage += `\n\n⚠️ Weather Factors:\n`;
        classification.reasons.forEach(reason => {
            detailedMessage += `  • ${reason}\n`;
        });
    }
    
    // Generate unique ID for this condition report
    const conditionId = `COND-${location.id}-${Date.now()}`;
    
    return {
        id: conditionId,
        type: notificationType,
        classification: classification.classification,
        event: `${classification.classification.toUpperCase()} Weather Alert`,
        headline: classification.summary,
        description: detailedMessage,
        severity: priority,
        location: location.name || location.zipCode,
        locationId: location.id,
        coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
        },
        weather: {
            temperature: conditions.temp,
            feelsLike: conditions.feelsLike,
            conditions: conditions.description,
            humidity: conditions.humidity,
            windSpeed: conditions.windSpeed,
            rain: conditions.rain,
            snow: conditions.snow
        },
        timestamp: new Date().toISOString(),
        observationTime: conditions.timestamp,
        isGoodWeather: classification.isGood,
        isBadWeather: classification.isBad
    };
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Format multiple weather conditions
 */
function formatWeatherConditions(conditionResults) {
    const formatted = [];
    
    for (const [locationId, data] of Object.entries(conditionResults)) {
        if (data.conditions && data.classification) {
            formatted.push(formatWeatherCondition(data, data.location));
        }
    }
    
    return formatted;
}

module.exports = {
    formatWeatherCondition,
    formatWeatherConditions
};
