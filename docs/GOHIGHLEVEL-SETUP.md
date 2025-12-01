# GoHighLevel Workflow Setup Guide

This guide explains how to set up GoHighLevel to receive weather alerts and send SMS notifications.

---

## Step 1: Create a New Workflow

1. Log into GoHighLevel
2. Go to **Automation** > **Workflows**
3. Click **+ Create Workflow**
4. Choose **Start from Scratch**
5. Name it "Weather Alert SMS"

---

## Step 2: Add Webhook Trigger

1. Click **Add New Trigger**
2. Select **Webhook**
3. Copy the webhook URL that appears
4. Save this URL - you'll need it for the Weather Alert System

---

## Step 3: Add SMS Action

1. Click the **+** button after the trigger
2. Select **Send SMS**
3. Configure the SMS:

### Phone Number
- Select the contact field that contains phone numbers
- Or use a custom field

### Message Template

Copy and paste this template:

```
⚠️ WEATHER ALERT ⚠️

{{alert.event}}
Severity: {{alert.severity}}
Area: {{alert.area}}

{{alert.description}}

Valid: {{alert.starts_at}} to {{alert.ends_at}}

Stay safe and take necessary precautions.
```

---

## Step 4: Map Webhook Data

The Weather Alert System sends these fields:

| Field | Description | Usage |
|-------|-------------|-------|
| `alert_id` | Unique alert identifier | For tracking |
| `event` | Alert type (e.g., "Tornado Warning") | Main headline |
| `severity` | Severity level | Priority indicator |
| `description` | Full alert description | Details |
| `headline` | Short headline | Alternative summary |
| `area` | Affected area | Location info |
| `starts_at` | When alert starts | Timing |
| `ends_at` | When alert expires | Timing |
| `issued_at` | When alert was issued | Reference |
| `location` | Monitored location name | Your reference |
| `source` | Data source (XWeather) | Attribution |
| `is_test` | Whether it's a test alert | For filtering |

### Using in GHL

Access these in your message using:
- `{{alert.event}}`
- `{{alert.severity}}`
- `{{alert.description}}`
- etc.

---

## Step 5: Optional - Add Conditions

### Filter Test Alerts

1. Add a **Condition** step after the trigger
2. Set condition: `alert.is_test` equals `false`
3. Only real alerts will trigger SMS

### Filter by Severity

1. Add a **Condition** step
2. Set condition: `alert.severity` equals `Warning` OR `Extreme`
3. Only high-severity alerts will trigger SMS

---

## Step 6: Optional - Add Email Notification

1. Add another action: **Send Email**
2. Configure with same template as SMS
3. Good for staff notifications

---

## Step 7: Activate the Workflow

1. Review all steps
2. Click **Publish** or **Activate**
3. The workflow is now live

---

## Step 8: Connect to Weather Alert System

1. Copy the webhook URL from Step 2
2. Open Weather Alert System
3. Go to **Settings** > **GoHighLevel Webhook**
4. Paste the URL
5. Click **Save Webhook URL**
6. Click **Test Webhook**

---

## Testing

1. In Weather Alert System, click **Send Test Alert**
2. You should receive a test SMS
3. The test alert will have `is_test: true`

---

## SMS Templates

### Short Alert (160 characters)

```
⚠️ {{alert.event}} - {{alert.severity}}
{{alert.area}}
Ends: {{alert.ends_at}}
```

### Standard Alert

```
⚠️ WEATHER ALERT

{{alert.event}}
Severity: {{alert.severity}}
Area: {{alert.area}}

{{alert.description}}

Stay safe!
```

### Detailed Alert

```
⚠️ WEATHER ALERT ⚠️

TYPE: {{alert.event}}
SEVERITY: {{alert.severity}}
AREA: {{alert.area}}

DETAILS:
{{alert.description}}

TIMING:
Starts: {{alert.starts_at}}
Expires: {{alert.ends_at}}

This is an automated alert from your Weather Alert System. Take appropriate precautions.
```

---

## Troubleshooting

### Not Receiving SMS

1. Check workflow is published/active
2. Verify webhook URL is correct
3. Check phone number format
4. Check GHL SMS settings
5. Check GHL credits/balance

### Wrong Data in SMS

1. Verify field names match exactly
2. Use `{{alert.fieldname}}` format
3. Check for typos

### Test Alert Works, Real Alerts Don't

1. Check condition filters
2. Verify alert types are enabled
3. Check logs in Weather Alert System

---

## Advanced: Multiple Contact Lists

If you have different contact lists for different areas:

1. Create separate workflows for each area
2. Add conditions based on `alert.location`
3. Route to appropriate contact lists

---

## Support

For GoHighLevel issues:
- GHL Support: https://support.gohighlevel.com

For Weather Alert System issues:
- Check the Logs tab
- Contact your IT team
