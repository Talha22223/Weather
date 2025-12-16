/**
 * Forecast Formatter Service
 * Converts raw weather forecast data into clean, client-friendly messages
 * Formats for SMS/webhook delivery to GoHighLevel
 */

const db = require('../database/db');

/**
 * Format XWeather forecast data into clean message format
 * @param {Object} forecastData - Raw forecast data from XWeather
 * @param {Object} location - Location object
 * @returns {Object} - Formatted forecast message
 */
function formatXWeatherForecast(forecastData, location) {
    if (!forecastData || !forecastData.periods || forecastData.periods.length === 0) {
        return null;
    }
    
    // Get today's forecast (first period)
    const today = forecastData.periods[0];
    
    // Get location info
    const place = forecastData.place || {};
    const locationName = location.name || place.name || 'Your Area';
    
    // Build the forecast message
    return {
        forecast_id: generateForecastId(today, location),
        type: 'daily_forecast',
        location: locationName,
        location_id: location.id,
        date: today.dateTimeISO || today.timestamp,
        
        // Temperature info
        high_temp: today.maxTempF || today.tempF,
        low_temp: today.minTempF || today.tempMinF,
        temp_unit: 'F',
        
        // Conditions
        weather: today.weather || 'Partly Cloudy',
        weather_short: today.weatherPrimary || today.weather || 'Partly Cloudy',
        weather_code: today.weatherPrimaryCoded || '',
        
        // Details
        precipitation_chance: today.pop || 0,
        precipitation_amount: today.precipIN || 0,
        humidity: today.humidity || today.avgHumidity || 0,
        wind_speed: today.windSpeedMaxMPH || today.windSpeedMPH || 0,
        wind_direction: today.windDirection || today.windDir || '',
        uv_index: today.uvi || today.uvIndex || 0,
        
        // Descriptive text
        summary: buildForecastSummary(today, locationName),
        
        // Additional context
        sunrise: today.sunriseISO || null,
        sunset: today.sunsetISO || null,
        
        // Source info
        source: 'XWeather',
        issued_at: new Date().toISOString(),
        
        // Flag for webhook filtering
        is_forecast: true,
        is_test: false
    };
}

/**
 * Build a human-readable forecast summary
 * @param {Object} period - Forecast period data
 * @param {String} locationName - Location name
 * @returns {String} - Summary text
 */
function buildForecastSummary(period, locationName) {
    const parts = [];
    
    // Temperature
    if (period.maxTempF && period.minTempF) {
        parts.push(`High of ${period.maxTempF}°F, low of ${period.minTempF}°F`);
    } else if (period.tempF) {
        parts.push(`Temperature around ${period.tempF}°F`);
    }
    
    // Weather condition
    if (period.weather) {
        parts.push(period.weather.toLowerCase());
    }
    
    // Precipitation
    if (period.pop && period.pop > 20) {
        parts.push(`${period.pop}% chance of precipitation`);
    }
    
    // Wind
    if (period.windSpeedMaxMPH && period.windSpeedMaxMPH > 15) {
        parts.push(`winds up to ${period.windSpeedMaxMPH} mph`);
    }
    
    // Build sentence
    if (parts.length === 0) {
        return `Weather conditions for ${locationName}.`;
    }
    
    let summary = `Expect ${parts.join(', ')}.`;
    
    // Add advice based on conditions
    if (period.pop && period.pop > 50) {
        summary += ' Bring an umbrella!';
    } else if (period.maxTempF && period.maxTempF > 90) {
        summary += ' Stay hydrated!';
    } else if (period.maxTempF && period.maxTempF < 32) {
        summary += ' Bundle up!';
    }
    
    return summary;
}

/**
 * Generate unique forecast ID
 * @param {Object} period - Forecast period
 * @param {Object} location - Location object
 * @returns {String} - Unique ID
 */
function generateForecastId(period, location) {
    const date = period.dateTimeISO || period.timestamp || new Date().toISOString();
    const dateStr = date.split('T')[0]; // YYYY-MM-DD
    return `FORECAST-${location.id}-${dateStr}`;
}

/**
 * Format forecast for SMS message (short version)
 * @param {Object} forecast - Formatted forecast object
 * @returns {String} - SMS-ready text
 */
function formatForSMS(forecast) {
    let message = `🌤️ Today's Weather for ${forecast.location}\n\n`;
    
    // Temperature
    message += `🌡️ High: ${forecast.high_temp}°F | Low: ${forecast.low_temp}°F\n`;
    
    // Conditions
    message += `☁️ ${forecast.weather}\n`;
    
    // Precipitation
    if (forecast.precipitation_chance > 20) {
        message += `💧 Rain: ${forecast.precipitation_chance}%\n`;
    }
    
    // Summary
    message += `\n${forecast.summary}\n`;
    
    message += `\nHave a great day!`;
    
    return message;
}

/**
 * Format multiple locations' forecasts
 * @param {Object} forecastResults - Results from fetchAllForecasts
 * @returns {Array} - Array of formatted forecasts
 */
function formatAllForecasts(forecastResults) {
    const formatted = [];
    
    for (const [locationId, data] of Object.entries(forecastResults.results)) {
        if (!data.success || !data.forecast) {
            continue;
        }
        
        const formattedForecast = formatXWeatherForecast(data.forecast, data.location);
        
        if (formattedForecast) {
            formatted.push(formattedForecast);
        }
    }
    
    return formatted;
}

module.exports = {
    formatXWeatherForecast,
    formatAllForecasts,
    formatForSMS,
    buildForecastSummary
};
