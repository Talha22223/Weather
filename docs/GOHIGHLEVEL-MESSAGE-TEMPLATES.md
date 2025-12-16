# GoHighLevel Message Templates for Weather Alerts

This guide provides ready-to-use message templates for sending weather alerts to your clients via SMS.

---

## 🚨 URGENT ALERT Template (Warnings & Emergencies)

Use this for severe weather warnings that require immediate action:

```
⚠️ URGENT WEATHER ALERT ⚠️

{{alert.event}} in effect!

📍 Area: {{alert.area}}
🔴 Severity: {{alert.severity}}
⏰ Valid: {{alert.starts_at}} to {{alert.ends_at}}

Details:
{{alert.description}}

{{#if alert.instruction}}
⚡ WHAT TO DO:
{{alert.instruction}}
{{/if}}

Stay safe! For updates, reply STOP to unsubscribe.

Source: {{alert.source}}
```

---

## 📋 STANDARD ALERT Template (Watches & Advisories)

Use this for weather watches and advisories:

```
🌤️ Weather Alert for Your Area

{{alert.event}}

📍 Location: {{alert.area}}
📊 Severity: {{alert.severity}}
⏱️ Active: {{alert.starts_at}} to {{alert.ends_at}}

{{alert.description}}

Stay prepared and monitor conditions.

Reply STOP to unsubscribe.
```

---

## 🌈 DAILY WEATHER UPDATE Template (General Updates)

Use this for routine weather condition updates:

```
Good morning! Today's weather update for {{alert.location}}:

{{alert.event}}

{{alert.description}}

Valid through: {{alert.ends_at}}

Have a great day! Reply STOP to unsubscribe.
```

---

## 🎯 CUSTOM CLIENT-FRIENDLY Template

Personalized message for your specific business:

```
Hi {{contact.first_name}}! 👋

Weather alert for {{alert.location}}:

{{alert.headline}}

What's happening:
{{alert.description}}

Time frame: {{alert.starts_at}} to {{alert.ends_at}}

Stay safe! We're monitoring the situation.

- Your [Business Name] Team
```

---

## 📱 SHORT SMS Template (Under 160 characters)

For quick notifications:

```
⚠️ {{alert.event}} - {{alert.area}}
{{alert.severity}} alert active until {{alert.ends_at}}
Stay safe!
```

---

## 🔧 GoHighLevel Setup Instructions

### Step 1: Create Workflow
1. Log into GoHighLevel
2. Go to **Automation** → **Workflows**
3. Create new workflow: "Weather Alert Notifications"

### Step 2: Add Webhook Trigger
1. Add **Webhook** trigger
2. Use this URL in your Weather Alert System settings:
   ```
   https://services.leadconnectorhq.com/hooks/bnCK3mWckPsCJampsHz9/webhook-trigger/gQ8GBpa69VSFnjCL4EvH
   ```

### Step 3: Add Condition (Optional - Filter Test Alerts)
1. Add **Condition** after webhook
2. Set: `alert.is_test` **equals** `false`
3. This prevents test alerts from going to real clients

### Step 4: Add SMS Action
1. Add **Send SMS** action
2. Select recipient: `{{contact.phone}}` or your contact field
3. Paste one of the message templates above
4. Save workflow

### Step 5: Test the Flow
1. In Weather Alert System admin panel, click **"Check Alerts Now"**
2. Or wait for automatic check (every 15 minutes)
3. Verify SMS is received in GoHighLevel

---

## 📊 Available Data Fields

Your webhook receives these fields from the Weather Alert System:

| Field | Example | Description |
|-------|---------|-------------|
| `alert.alert_id` | `"NWS-1234567"` | Unique identifier |
| `alert.event` | `"Tornado Warning"` | Alert type |
| `alert.severity` | `"Warning"` | Severity level |
| `alert.description` | `"Full text..."` | Complete description |
| `alert.headline` | `"Brief headline"` | Short summary |
| `alert.area` | `"Beverly Hills, CA"` | Affected area |
| `alert.location` | `"Beverly Hills"` | Your monitored location |
| `alert.starts_at` | `"2025-12-16T10:00:00Z"` | When alert begins |
| `alert.ends_at` | `"2025-12-16T18:00:00Z"` | When alert expires |
| `alert.issued_at` | `"2025-12-16T09:45:00Z"` | When issued |
| `alert.source` | `"National Weather Service"` | Data source |
| `alert.urgency` | `"Immediate"` | Urgency level |
| `alert.certainty` | `"Observed"` | Certainty level |
| `alert.instruction` | `"Take shelter..."` | Safety instructions |
| `alert.is_test` | `false` | Whether it's a test |

---

## 🎨 Customization Tips

### 1. Add Emoji for Visual Impact
- ⚠️ Warning/Alert
- 🌪️ Tornado
- ⛈️ Thunderstorm
- 🌊 Flood
- ❄️ Winter weather
- 🌡️ Temperature
- 📍 Location
- ⏰ Time

### 2. Filter by Severity
Add conditions to send different templates based on severity:
- **Extreme/Warning** → Urgent template
- **Watch/Advisory** → Standard template
- **Statement** → Brief update

### 3. Time Formatting
Use GoHighLevel's date formatting:
```
{{date alert.starts_at format="h:mm A"}}
{{date alert.starts_at format="MMM DD, YYYY"}}
```

### 4. Conditional Content
```
{{#if alert.instruction}}
Safety Instructions:
{{alert.instruction}}
{{/if}}
```

---

## ✅ Testing Checklist

- [ ] Webhook URL configured in Weather Alert System
- [ ] Test alert received in GoHighLevel
- [ ] SMS template looks good on mobile
- [ ] Contact phone number field mapped correctly
- [ ] Test/production filter working
- [ ] Unsubscribe link included (if required)
- [ ] Business branding added

---

## 🚀 Going Live

1. ✅ Configure real GoHighLevel webhook URL
2. ✅ Add at least one location (Beverly Hills already added)
3. ✅ Verify scheduler is enabled (set to 15 minutes)
4. ✅ Test with "Check Alerts Now" button
5. ✅ Monitor logs for successful webhook delivery
6. ✅ Verify clients receive SMS messages

---

## 🆘 Troubleshooting

**Problem:** Not receiving any alerts
- Check if locations are enabled
- Verify alert types are enabled
- Check scheduler is running
- Look at system logs

**Problem:** SMS not sending
- Verify webhook URL is correct
- Check GoHighLevel workflow is active
- Verify contact has phone number
- Check GHL workflow execution logs

**Problem:** Getting duplicate alerts
- System has built-in duplicate protection
- Check logs for "duplicates skipped"
- System remembers last 100 alerts per location

---

## 📞 Support

For issues with:
- **Weather Alert System**: Check logs in admin panel
- **GoHighLevel**: Check workflow execution logs
- **SMS delivery**: Verify contact phone numbers and GHL SMS settings
