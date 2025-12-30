/**
 * Weather Condition Fetcher Service
 * Fetches current weather conditions (not just alerts)
 * Supports checking for "good" or "bad" weather every interval
 */

const axios = require('axios');
const db = require('../database/db');

/**
 * Classify weather as good or bad based on conditions
 * @param {Object} conditions - Weather conditions
 * @returns {Object} - Classification result
 */
function classifyWeather(conditions) {
    const { temp, feelsLike, humidity, windSpeed, description, rain, snow, visibility } = conditions;
    
    const badReasons = [];
    let severity = 'good'; // 'good', 'fair', 'bad', 'severe'
    
    // Temperature checks (in Fahrenheit)
    if (temp > 95) {
        badReasons.push(`Very hot (${temp}°F)`);
        severity = 'bad';
    } else if (temp < 32) {
        badReasons.push(`Freezing (${temp}°F)`);
        severity = 'bad';
    } else if (temp < 40 || temp > 90) {
        badReasons.push(`Uncomfortable temperature (${temp}°F)`);
        if (severity === 'good') severity = 'fair';
    }
    
    // Feels like temperature
    if (feelsLike !== temp && Math.abs(feelsLike - temp) > 10) {
        if (feelsLike > 100 || feelsLike < 25) {
            badReasons.push(`Feels like ${feelsLike}°F`);
            severity = 'bad';
        }
    }
    
    // Wind checks
    if (windSpeed > 25) {
        badReasons.push(`Strong winds (${windSpeed} mph)`);
        severity = 'bad';
    } else if (windSpeed > 15) {
        badReasons.push(`Windy (${windSpeed} mph)`);
        if (severity === 'good') severity = 'fair';
    }
    
    // Precipitation
    if (rain && rain > 0.5) {
        badReasons.push(`Heavy rain (${rain} inches)`);
        severity = 'bad';
    } else if (rain && rain > 0) {
        badReasons.push(`Light rain (${rain} inches)`);
        if (severity === 'good') severity = 'fair';
    }
    
    if (snow && snow > 0) {
        badReasons.push(`Snow (${snow} inches)`);
        severity = 'bad';
    }
    
    // Humidity checks
    if (humidity > 85) {
        badReasons.push(`Very humid (${humidity}%)`);
        if (severity !== 'bad') severity = 'fair';
    }
    
    // Visibility checks
    if (visibility && visibility < 1) {
        badReasons.push(`Poor visibility (${visibility} miles)`);
        severity = 'bad';
    }
    
    // Check weather description for severe conditions
    const descLower = description.toLowerCase();
    if (descLower.includes('thunderstorm') || descLower.includes('storm')) {
        badReasons.push('Thunderstorm conditions');
        severity = 'severe';
    } else if (descLower.includes('tornado') || descLower.includes('hurricane')) {
        badReasons.push('Severe weather');
        severity = 'severe';
    } else if (descLower.includes('fog') || descLower.includes('mist') || descLower.includes('haze')) {
        badReasons.push('Reduced visibility conditions');
        if (severity === 'good') severity = 'fair';
    }
    
    return {
        classification: severity,
        isGood: severity === 'good',
        isBad: severity === 'bad' || severity === 'severe',
        reasons: badReasons,
        summary: badReasons.length > 0 
            ? `${severity.toUpperCase()} WEATHER: ${badReasons.join(', ')}`
            : 'GOOD WEATHER: Pleasant conditions'
    };
}

/**
 * Fetch current weather conditions from OpenWeatherMap
 */
async function fetchOpenWeatherMapConditions(location, settings) {
    if (!settings.apiKey) {
        throw new Error('API key not configured');
    }
    
    let lat, lon;
    
    if (location.latitude && location.longitude) {
        lat = location.latitude;
        lon = location.longitude;
    } else if (location.zipCode) {
        // Get coordinates from ZIP
        const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${location.zipCode},US&appid=${settings.apiKey}`;
        const geoResponse = await axios.get(geoUrl, { timeout: 15000 });
        lat = geoResponse.data.lat;
        lon = geoResponse.data.lon;
    } else {
        throw new Error('Location must have coordinates or ZIP code');
    }
    
    // Fetch current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${settings.apiKey}`;
    
    const response = await axios.get(weatherUrl, { 
        timeout: 15000,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'WeatherAlertAutomation/1.0'
        }
    });
    
    const data = response.data;
    
    // Extract relevant data
    const conditions = {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed),
        windDirection: data.wind.deg,
        visibility: data.visibility ? Math.round(data.visibility / 1609) : null, // Convert meters to miles
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: data.weather[0].icon,
        rain: data.rain ? (data.rain['1h'] || 0) / 25.4 : 0, // Convert mm to inches
        snow: data.snow ? (data.snow['1h'] || 0) / 25.4 : 0, // Convert mm to inches
        clouds: data.clouds.all,
        timestamp: new Date(data.dt * 1000).toISOString(),
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString()
    };
    
    return conditions;
}

/**
 * Fetch current weather conditions from XWeather
 */
async function fetchXWeatherConditions(location, settings) {
    if (!settings.apiClientId || !settings.apiClientSecret) {
        throw new Error('API credentials not configured');
    }
    
    let locationQuery;
    if (location.latitude && location.longitude) {
        locationQuery = `${location.latitude},${location.longitude}`;
    } else if (location.zipCode) {
        locationQuery = location.zipCode;
    } else {
        throw new Error('Location must have coordinates or ZIP code');
    }
    
    const apiUrl = `${settings.apiBaseUrl}/observations/${locationQuery}`;
    const fullUrl = `${apiUrl}?client_id=${settings.apiClientId}&client_secret=${settings.apiClientSecret}`;
    
    const response = await axios.get(fullUrl, {
        timeout: 15000,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'WeatherAlertAutomation/1.0'
        }
    });
    
    if (!response.data || !response.data.response || !response.data.response[0]) {
        throw new Error('No weather data returned');
    }
    
    const data = response.data.response[0];
    const periods = data.periods[0];
    
    // Extract relevant data
    const conditions = {
        temp: Math.round(periods.tempF),
        feelsLike: Math.round(periods.feelslikeF),
        humidity: Math.round(periods.humidity),
        pressure: periods.pressureMB,
        windSpeed: Math.round(periods.windSpeedMPH),
        windDirection: periods.windDirDEG,
        visibility: periods.visibilityMI,
        description: periods.weather || periods.weatherPrimary,
        main: periods.weatherPrimary,
        icon: periods.icon,
        rain: periods.precipIN || 0,
        snow: periods.snowIN || 0,
        clouds: periods.sky,
        timestamp: periods.timestamp,
        sunrise: periods.sunrise || null,
        sunset: periods.sunset || null
    };
    
    return conditions;
}

/**
 * Fetch conditions for a specific location
 */
async function fetchConditionsForLocation(location, settings) {
    const provider = settings.apiProvider || 'openweathermap';
    
    if (provider === 'openweathermap') {
        return await fetchOpenWeatherMapConditions(location, settings);
    } else {
        return await fetchXWeatherConditions(location, settings);
    }
}

/**
 * Fetch conditions for all enabled locations
 */
async function fetchAllConditions() {
    const settings = db.getSettings();
    const locations = db.getEnabledLocations();
    
    if (locations.length === 0) {
        db.addLog({
            type: 'warning',
            action: 'fetch_conditions',
            message: 'No enabled locations configured'
        });
        return { results: {}, errors: [] };
    }
    
    const results = {};
    const errors = [];
    
    for (const location of locations) {
        try {
            const conditions = await fetchConditionsForLocation(location, settings);
            const classification = classifyWeather(conditions);
            
            results[location.id] = {
                location: location,
                conditions: conditions,
                classification: classification
            };
            
            db.addLog({
                type: 'success',
                action: 'fetch_conditions',
                message: `Fetched weather conditions for ${location.name || location.zipCode}: ${classification.summary}`,
                details: { 
                    locationId: location.id, 
                    temp: conditions.temp,
                    classification: classification.classification
                }
            });
            
        } catch (error) {
            errors.push({
                location: location,
                error: error.message
            });
            
            db.addLog({
                type: 'error',
                action: 'fetch_conditions',
                message: `Error fetching conditions for ${location.name || location.zipCode}: ${error.message}`,
                details: { locationId: location.id, error: error.message }
            });
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    return { results, errors };
}

module.exports = {
    fetchConditionsForLocation,
    fetchAllConditions,
    classifyWeather
};
