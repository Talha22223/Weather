# Weather Alert Automation System

A fully automated system that checks weather alerts and sends them to GoHighLevel for SMS notifications.

## 🌟 Features

- **Automatic Weather Monitoring** - Continuously checks for weather alerts using XWeather API
- **Dynamic Configuration** - All settings are editable through the admin interface
- **Duplicate Prevention** - Prevents sending the same alert multiple times
- **GoHighLevel Integration** - Sends alerts to GHL webhook for SMS distribution
- **Clean Admin Interface** - Professional, mobile-friendly UI for CRM specialists
- **Real-time Logs** - Monitor all system activity
- **Test Mode** - Send test alerts to verify configuration

## 📁 Project Structure

```
Weather/
├── backend/
│   ├── server.js              # Main server entry point
│   ├── database/
│   │   └── db.js              # JSON file database layer
│   ├── services/
│   │   ├── weatherFetcher.js  # XWeather API integration
│   │   ├── alertFormatter.js  # Alert formatting
│   │   ├── duplicateProtection.js  # Duplicate prevention
│   │   ├── webhookService.js  # GoHighLevel webhook
│   │   └── alertProcessor.js  # Main processing orchestrator
│   ├── scheduler/
│   │   ├── scheduler.js       # Cron job management
│   │   └── standalone.js      # Standalone scheduler process
│   └── routes/
│       ├── settings.js        # Settings API
│       ├── locations.js       # Locations API
│       ├── alertTypes.js      # Alert types API
│       ├── scheduler.js       # Scheduler API
│       └── logs.js            # Logs API
├── frontend/
│   ├── index.html             # Main HTML page
│   ├── css/
│   │   └── styles.css         # Clean, professional styles
│   └── js/
│       ├── api.js             # API client
│       └── app.js             # Main application
├── data/                      # JSON database files (auto-created)
├── docs/
│   └── README.md              # This file
├── package.json               # Node.js dependencies
└── .env.example               # Environment template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- XWeather API account (https://www.xweather.com/)
- GoHighLevel account with webhook access

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   cd Weather
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open the admin interface**
   ```
   http://localhost:3000
   ```

5. **Configure the system** (see Configuration section below)

## ⚙️ Configuration

### Step 1: Configure API Credentials

1. Go to **Settings** tab
2. Enter your XWeather credentials:
   - **API Client ID** - Your XWeather client ID
   - **API Client Secret** - Your XWeather client secret
3. Click **Save API Settings**
4. Click **Test Connection** to verify

### Step 2: Configure GoHighLevel Webhook

1. In GoHighLevel, create a new workflow
2. Add a "Webhook" trigger and copy the webhook URL
3. In the Weather Alert System:
   - Go to **Settings** tab
   - Paste the webhook URL
   - Click **Save Webhook URL**
   - Click **Test Webhook** to verify

### Step 3: Add Locations

1. Go to **Locations** tab
2. Click **Add Location**
3. Enter:
   - Location name (optional)
   - ZIP code OR latitude/longitude
4. Click **Add Location**
5. Repeat for all locations you want to monitor

### Step 4: Configure Alert Types

1. Go to **Alert Types** tab
2. Enable/disable alert types as needed
3. Common important alerts are enabled by default:
   - Tornado Warning/Watch
   - Severe Thunderstorm Warning/Watch
   - Flash Flood Warning/Watch
   - Hurricane Warning/Watch
   - etc.

### Step 5: Set Check Frequency

1. Go to **Dashboard** tab
2. Set the check frequency (1-1440 minutes)
3. Enable the scheduler toggle

### Step 6: Test the System

1. Click **Send Test Alert** to send a test alert to GHL
2. Verify you receive the test notification
3. Click **Check Alerts Now** to manually trigger a check

## 📱 GoHighLevel Workflow Setup

### Webhook Payload Structure

The system sends alerts in this format:

```json
{
  "alert_id": "unique-alert-id",
  "event": "Tornado Warning",
  "severity": "Warning",
  "description": "Full alert description...",
  "headline": "Tornado Warning issued...",
  "area": "County Name",
  "starts_at": "2024-01-15T12:00:00Z",
  "ends_at": "2024-01-15T14:00:00Z",
  "issued_at": "2024-01-15T11:45:00Z",
  "location": "Location Name ZIP: 12345",
  "location_id": "uuid",
  "source": "XWeather",
  "is_test": false
}
```

### GHL Workflow Steps

1. **Trigger**: Webhook (paste your webhook URL in Weather Alert System)
2. **Action**: Send SMS
   - Use custom values from the webhook:
     - `{{alert.event}}` - Alert type
     - `{{alert.severity}}` - Severity level
     - `{{alert.description}}` - Full description
     - `{{alert.area}}` - Affected area
     - `{{alert.location}}` - Monitored location

Example SMS template:
```
⚠️ WEATHER ALERT: {{alert.event}}

Severity: {{alert.severity}}
Area: {{alert.area}}

{{alert.description}}

Stay safe!
```

## 🔧 Running 24/7

### Option 1: Run Both Together (Development)

```bash
npm start
```

This runs the server with the scheduler built-in.

### Option 2: Separate Processes (Production)

**Terminal 1 - API Server:**
```bash
npm start
```

**Terminal 2 - Standalone Scheduler:**
```bash
npm run scheduler
```

### Option 3: Deploy to Cloud

**Vercel:**
- Deploy the project to Vercel
- Use Vercel Cron Jobs for scheduling

**AWS Lambda + CloudWatch:**
- Deploy backend as Lambda function
- Use CloudWatch Events for scheduling

**Heroku/Railway/Render:**
- Deploy as a Node.js application
- The built-in scheduler will run automatically

## 📊 Monitoring

### Dashboard

The dashboard shows:
- System status (API, Webhook, Scheduler)
- Quick stats (locations, alert types, frequency)
- Recent activity
- Quick action buttons

### Logs

The logs tab shows:
- All system activity
- Filter by type (info, success, warning, error)
- Timestamp and action details

## 🔒 Security Notes

- API credentials are stored locally in the database
- Never commit `data/` folder to version control
- Use environment variables for sensitive production deployments
- The admin interface has no authentication by default - add authentication for production

## 🛠 Troubleshooting

### "API credentials not configured"
- Go to Settings and enter your XWeather credentials
- Test the connection after saving

### "Webhook URL not configured"
- Go to Settings and enter your GoHighLevel webhook URL
- Test the webhook after saving

### "No enabled locations"
- Go to Locations and add at least one location
- Make sure the location is enabled

### Alerts not sending
1. Check the Logs tab for errors
2. Verify API credentials are correct
3. Verify webhook URL is correct
4. Check if locations are enabled
5. Check if alert types are enabled

### Duplicate alerts
- The system automatically prevents duplicates
- If you need to resend all alerts, go to Settings and click "Reset Duplicate Protection"

## 📝 API Reference

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/api-credentials` - Update API credentials
- `POST /api/settings/test-api` - Test API connection
- `POST /api/settings/test-webhook` - Test webhook connection

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Add a location
- `PUT /api/locations/:id` - Update a location
- `DELETE /api/locations/:id` - Delete a location
- `POST /api/locations/:id/toggle` - Toggle location enabled

### Alert Types
- `GET /api/alert-types` - Get all alert types
- `POST /api/alert-types` - Add an alert type
- `PUT /api/alert-types/:id` - Update an alert type
- `DELETE /api/alert-types/:id` - Delete an alert type
- `POST /api/alert-types/:id/toggle` - Toggle alert type enabled

### Scheduler
- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/start` - Start scheduler
- `POST /api/scheduler/stop` - Stop scheduler
- `PUT /api/scheduler/frequency` - Update check frequency
- `POST /api/scheduler/trigger` - Trigger immediate check
- `POST /api/scheduler/test-alert` - Send test alert

### Logs
- `GET /api/logs` - Get logs
- `DELETE /api/logs` - Clear logs
- `GET /api/logs/stats` - Get log statistics

## 📄 License

MIT License
