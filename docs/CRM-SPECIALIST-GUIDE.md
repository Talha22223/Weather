# CRM Specialist Training Guide

## Welcome! 👋

This guide will teach you everything you need to know to manage the Weather Alert Automation System. You don't need to know any programming - just follow these simple steps.

---

## 🖥 Accessing the System

1. Open your web browser
2. Go to: `http://your-server-address:3000`
3. You'll see the Dashboard

---

## 📍 Managing Locations

Locations are the ZIP codes or areas you want to monitor for weather alerts.

### Adding a New Location

1. Click the **Locations** tab
2. Click **+ Add Location** button
3. Fill in the form:
   - **Location Name**: A friendly name (e.g., "Dallas Office")
   - **ZIP Code**: The 5-digit ZIP code (e.g., "75201")
   - OR enter **Latitude** and **Longitude** instead
4. Click **Add Location**

### Editing a Location

1. Find the location in the list
2. Click **Edit**
3. Make your changes
4. Click **Save Changes**

### Enabling/Disabling a Location

1. Find the location
2. Click **Enable** or **Disable**
3. Disabled locations won't be checked for alerts

### Deleting a Location

1. Find the location
2. Click **Delete**
3. Confirm the deletion

---

## ⚠️ Managing Alert Types

Alert types determine which weather events trigger notifications.

### Enabling/Disabling Alert Types

1. Click the **Alert Types** tab
2. Find the alert type
3. Click **Enable** or **Disable**

### Bulk Enable/Disable

- Click **Enable All** to enable all alert types
- Click **Disable All** to disable all alert types

### Adding a Custom Alert Type

1. Click **+ Add Alert Type**
2. Enter:
   - **Alert Name**: Friendly name
   - **Alert Code**: XWeather code (ask your IT team)
3. Click **Add Alert Type**

### Common Alert Types

| Alert | Description |
|-------|-------------|
| Tornado Warning | Tornado spotted or indicated by radar |
| Tornado Watch | Conditions favorable for tornadoes |
| Severe Thunderstorm Warning | Dangerous storms expected |
| Flash Flood Warning | Rapid flooding expected |
| Hurricane Warning | Hurricane conditions expected |
| Winter Storm Warning | Heavy snow/ice expected |

---

## ⚙️ Changing Settings

### Updating API Credentials

1. Click the **Settings** tab
2. In the "API Configuration" section:
   - Enter your **API Client ID**
   - Enter your **API Client Secret**
3. Click **Save API Settings**
4. Click **Test Connection** to verify

### Updating Webhook URL

1. Click the **Settings** tab
2. In the "GoHighLevel Webhook" section:
   - Paste your webhook URL
3. Click **Save Webhook URL**
4. Click **Test Webhook** to verify

---

## ⏰ Adjusting Check Frequency

The system checks for new alerts on a schedule. You can change how often it checks.

### Changing Frequency

1. Go to the **Dashboard** tab
2. Find "Check every ___ minutes"
3. Enter a number (1-1440)
4. Click **Update**

### Common Frequencies

| Minutes | Description |
|---------|-------------|
| 5 | Every 5 minutes (most responsive) |
| 15 | Every 15 minutes (recommended) |
| 30 | Every 30 minutes |
| 60 | Every hour |

### Enabling/Disabling the Scheduler

- Toggle the **Enable Scheduler** switch on the Dashboard
- When disabled, the system won't check automatically

---

## 🧪 Testing the System

### Sending a Test Alert

1. Go to the **Dashboard** tab
2. Click **Send Test Alert**
3. Check your phone for the test SMS

### Testing API Connection

1. Click **Test API Connection**
2. Should show "API connection successful!"

### Testing Webhook

1. Click **Test Webhook**
2. Should show "Webhook connection successful!"

### Manual Alert Check

1. Click **Check Alerts Now**
2. System will check all locations immediately
3. Results will show how many alerts were found

---

## 📋 Viewing Logs

The Logs tab shows everything the system does.

### Reading Logs

1. Click the **Logs** tab
2. Recent activity appears at the top

### Filtering Logs

Use the dropdown to filter by:
- **All Types**: Show everything
- **Info**: General information
- **Success**: Successful operations
- **Warning**: Potential issues
- **Error**: Problems that need attention

### Log Colors

| Color | Meaning |
|-------|---------|
| Blue | Information |
| Green | Success |
| Yellow | Warning |
| Red | Error |

---

## ❓ Troubleshooting

### No Alerts Being Sent

1. ✅ Check that locations are enabled
2. ✅ Check that alert types are enabled
3. ✅ Check that the scheduler is running
4. ✅ Verify API credentials are correct
5. ✅ Verify webhook URL is correct
6. ✅ Check the Logs for errors

### Test Alert Not Received

1. ✅ Check webhook URL is correct
2. ✅ Check GHL workflow is active
3. ✅ Check SMS settings in GHL
4. ✅ Check phone number is correct in GHL

### API Connection Failed

1. ✅ Verify API Client ID is correct
2. ✅ Verify API Client Secret is correct
3. ✅ Check if XWeather account is active

### Duplicate Alerts

- The system automatically prevents duplicates
- If needed, go to Settings > "Reset Duplicate Protection"
- ⚠️ Warning: This will resend all current alerts

---

## 📞 Getting Help

If you encounter issues:

1. Check the **Logs** tab for error messages
2. Try the troubleshooting steps above
3. Contact your IT team with:
   - Screenshot of the error
   - What you were trying to do
   - The logs from that time

---

## 📝 Quick Reference Card

| Task | Location |
|------|----------|
| Add location | Locations tab > + Add Location |
| Enable/disable location | Locations tab > Enable/Disable button |
| Enable/disable alert type | Alert Types tab > Enable/Disable button |
| Change check frequency | Dashboard > frequency input > Update |
| Send test alert | Dashboard > Send Test Alert |
| Check alerts now | Dashboard > Check Alerts Now |
| Update API credentials | Settings > API Configuration |
| Update webhook URL | Settings > GoHighLevel Webhook |
| View logs | Logs tab |
| Clear logs | Settings > Clear All Logs |

---

*This system is designed to be simple. If something seems complicated, ask for help!*
