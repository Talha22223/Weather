# Daily Weather Forecast Feature - Complete Guide

Your Weather Alert System now includes **Daily Weather Forecasts** in addition to real-time weather alerts!

---

## 🆕 What's New?

### Two Types of Messages:

1. **🚨 Weather Alerts** (Existing)
   - Sent when weather service issues warnings/watches
   - Tornado warnings, flood alerts, storm warnings, etc.
   - Checked every 15 minutes automatically
   - Only sent when new alerts are issued

2. **🌤️ Daily Forecasts** (NEW!)
   - Sent once per day at a specific time (default: 7:00 AM)
   - Contains today's weather forecast
   - Temperature high/low, conditions, precipitation chance
   - Sent to all locations you're monitoring

---

## 🎯 How It Works

```
Every Day at 7:00 AM (configurable):
└─ Fetch today's forecast for all locations
   └─ Format forecast data
      └─ Send to GoHighLevel
         └─ GoHighLevel sends SMS to clients
```

**Example Forecast Message:**
```
🌤️ Today's Weather for Beverly Hills

🌡️ High: 75°F | Low: 58°F
☁️ Partly Cloudy
💧 Rain: 20%

Expect high of 75°F, low of 58°F, partly cloudy.

Have a great day!
```

---

## ⚙️ Configuration

### In Admin Panel (Dashboard Tab)

You'll see a new **"🌤️ Daily Forecast"** card with:

1. **Toggle Switch**: Enable/Disable daily forecasts
2. **Time Picker**: Set what time to send daily (default: 07:00)
3. **Status**: Shows when next forecast will be sent

### In Settings File

If you prefer editing `backend/data/settings.json` directly:

```json
{
  "forecastEnabled": true,
  "forecastTime": "07:00",
  "lastForecastRun": null
}
```

---

## 📱 GoHighLevel Setup for Forecasts

### Option 1: Use Same Webhook (Recommended)

Use your existing webhook - the system sends both alerts and forecasts to it:
```
https://services.leadconnectorhq.com/hooks/bnCK3mWckPsCJampsHz9/webhook-trigger/gQ8GBpa69VSFnjCL4EvH
```

**Add a condition to separate them:**
- If `is_forecast` equals `true` → Send forecast template
- If `is_forecast` equals `false` → Send alert template

### Option 2: Separate Workflows

Create two workflows in GoHighLevel:
1. **Weather Alerts** - For urgent warnings
2. **Daily Forecasts** - For routine updates

---

## 📋 Forecast Data Fields

Your webhook receives these fields for forecasts:

| Field | Example | Description |
|-------|---------|-------------|
| `forecast_id` | `"FORECAST-abc123-2025-12-16"` | Unique ID |
| `type` | `"daily_forecast"` | Message type |
| `is_forecast` | `true` | Flag to identify forecasts |
| `location` | `"Beverly Hills"` | Location name |
| `location_id` | `"abc123"` | Location ID |
| `date` | `"2025-12-16T12:00:00Z"` | Forecast date |
| `high_temp` | `75` | High temperature (°F) |
| `low_temp` | `58` | Low temperature (°F) |
| `weather` | `"Partly Cloudy"` | Weather condition |
| `weather_short` | `"Partly Cloudy"` | Short description |
| `precipitation_chance` | `20` | Rain chance (%) |
| `humidity` | `65` | Humidity (%) |
| `wind_speed` | `8` | Wind speed (mph) |
| `wind_direction` | `"NW"` | Wind direction |
| `uv_index` | `6` | UV index |
| `summary` | `"Expect high of 75°F..."` | Human-readable summary |
| `sunrise` | `"2025-12-16T14:45:00Z"` | Sunrise time |
| `sunset` | `"2025-12-17T01:20:00Z"` | Sunset time |
| `source` | `"XWeather"` | Data source |
| `issued_at` | `"2025-12-16T07:00:00Z"` | When sent |

---

## 📝 GoHighLevel Message Templates for Forecasts

### Simple Forecast Template

```
Good morning! 🌤️

Today's weather for {{forecast.location}}:

Temperature: {{forecast.high_temp}}°F high, {{forecast.low_temp}}°F low
Conditions: {{forecast.weather}}
Rain Chance: {{forecast.precipitation_chance}}%

{{forecast.summary}}

Have a great day!
```

### Detailed Forecast Template

```
🌤️ DAILY WEATHER UPDATE

📍 Location: {{forecast.location}}
📅 Date: {{forecast.date}}

🌡️ TEMPERATURE
High: {{forecast.high_temp}}°F
Low: {{forecast.low_temp}}°F

☁️ CONDITIONS
{{forecast.weather}}

💧 PRECIPITATION
Chance: {{forecast.precipitation_chance}}%

💨 WIND
Speed: {{forecast.wind_speed}} mph
Direction: {{forecast.wind_direction}}

🌅 SUN
Sunrise: {{forecast.sunrise}}
Sunset: {{forecast.sunset}}

{{forecast.summary}}

Stay prepared! Reply STOP to unsubscribe.
```

### Conditional Template (Weather-Based Advice)

```
Good morning {{contact.first_name}}! ☀️

Today in {{forecast.location}}:

🌡️ {{forecast.high_temp}}°F / {{forecast.low_temp}}°F
{{forecast.weather}}

{{#if forecast.precipitation_chance > 50}}
☔ Don't forget your umbrella! {{forecast.precipitation_chance}}% chance of rain.
{{else if forecast.high_temp > 85}}
🥵 Stay cool and hydrated today!
{{else if forecast.high_temp < 40}}
🧥 Bundle up, it's cold out there!
{{else}}
Have a wonderful day!
{{/if}}
```

---

## 🔧 Testing & Troubleshooting

### Test Forecast Now

1. Go to admin panel dashboard
2. Click **"Send Forecast Now"** button
3. Check GoHighLevel workflow execution logs
4. Verify SMS received

### Check Logs

System logs will show:
- `forecast_fetch_start` - Starting to fetch forecasts
- `forecast_fetch_complete` - Successfully fetched
- `forecast_process_complete` - Forecasts sent to webhook

### Common Issues

**Problem**: Not receiving daily forecasts
- ✓ Check if forecast is enabled in dashboard
- ✓ Verify forecast time is set correctly
- ✓ Check system logs for errors
- ✓ Verify locations are enabled

**Problem**: Forecast sent at wrong time
- Update time in dashboard and click "Update"
- Server uses America/New_York timezone

**Problem**: GoHighLevel not sending SMS
- Check if webhook URL is correct in settings
- Verify GoHighLevel workflow is active
- Check if condition properly filters forecasts

---

## 🚀 Quick Start Checklist

- [x] Daily forecast feature installed
- [ ] Enable forecasts in admin panel
- [ ] Set desired time (default: 7:00 AM)
- [ ] Click "Send Forecast Now" to test
- [ ] Create/update GoHighLevel workflow with forecast template
- [ ] Add condition to separate forecasts from alerts
- [ ] Test that SMS is received
- [ ] Monitor logs for successful delivery

---

## 📊 Forecast vs Alert Comparison

| Feature | Weather Alerts | Daily Forecasts |
|---------|---------------|-----------------|
| **Frequency** | When issued by weather service | Once per day at set time |
| **Trigger** | Real weather threats | Scheduled time |
| **Content** | Warnings, watches, advisories | Temperature, conditions, forecast |
| **Urgency** | High (immediate action) | Low (informational) |
| **Schedule** | Every 15 minutes check | Daily at specific time |
| **Duplicates** | Filtered automatically | One per day per location |
| **Webhook Field** | `is_test: false`, no `is_forecast` | `is_forecast: true` |

---

## 🎨 Customization Ideas

### 1. Different Times for Different Locations
Currently all locations get forecast at same time. To customize:
- Create multiple workflows in GoHighLevel
- Use location-based routing
- Or contact us to add per-location time settings

### 2. Weekend-Only Forecasts
Add condition in GoHighLevel:
```
{{#if current_day == "Saturday" or current_day == "Sunday"}}
  Send forecast
{{/if}}
```

### 3. Severe Weather Emphasis
Combine with alerts in one message:
```
🌤️ Today's Forecast: {{forecast.weather}}

{{#if alert.event}}
⚠️ ACTIVE ALERT: {{alert.event}}
{{/if}}
```

---

## 📞 Support & Questions

- **System Logs**: Check admin panel → Logs tab
- **Test Buttons**: Use dashboard quick actions
- **Settings**: All in `backend/data/settings.json`
- **API Status**: Dashboard shows connection status

---

## 🔄 Automatic Behavior

Once enabled, the system automatically:
1. ✅ Fetches forecast daily at configured time
2. ✅ Formats data into clean JSON
3. ✅ Sends to GoHighLevel webhook
4. ✅ Logs all activity
5. ✅ Restarts on server reboot
6. ✅ Handles API errors gracefully

No manual intervention needed! Just enable and forget.

---

## 🎯 Next Steps

1. **Enable in admin panel** - Toggle the switch
2. **Set your preferred time** - Morning works best
3. **Create GHL workflow** - Use templates above
4. **Test it** - Click "Send Forecast Now"
5. **Monitor** - Check logs and SMS delivery
6. **Enjoy** - Automated daily updates!

Your clients will love getting helpful daily weather updates! ☀️🌤️⛈️❄️
