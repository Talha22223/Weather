# Authentication System

## Overview
The Weather Alert System now includes a simple authentication system to protect location data and system settings.

## Login Credentials
- **Email:** client@gmail.com
- **Password:** client1234@

## Features
- Simple hardcoded authentication (no database required)
- Session-based authentication with 24-hour token expiration
- Protected API endpoints
- Automatic redirect to login page if not authenticated
- Logout functionality

## How It Works

### Login Process
1. Navigate to `/login.html`
2. Enter the credentials above
3. Upon successful login, a session token is generated and stored in `localStorage`
4. You'll be redirected to the main dashboard

### Protected Routes
All API endpoints are now protected and require authentication:
- `/api/settings` - Settings management
- `/api/locations` - Location management (saves permanently)
- `/api/alert-types` - Alert type configuration
- `/api/scheduler` - Scheduler controls
- `/api/logs` - System logs
- `/api/forecast` - Forecast data

### Public Routes
- `/api/auth/login` - Login endpoint
- `/api/auth/logout` - Logout endpoint
- `/api/auth/verify` - Verify session
- `/api/health` - Health check

## Location Persistence
Locations are now permanently saved to the `backend/data/locations.json` file. They will persist:
- ✅ Across server restarts
- ✅ After login/logout
- ✅ Between sessions
- ✅ On deployment platforms like Render

## Session Management
- Sessions last for 24 hours
- Stored in server memory (will reset on server restart)
- Token stored in browser's `localStorage`
- Automatic redirect to login if session expires

## Security Notes
This is a simple authentication system designed for single-user access. For production use with multiple users or sensitive data, consider:
- Using environment variables for credentials
- Implementing bcrypt for password hashing
- Using a proper database for session storage
- Adding refresh token functionality
- Implementing rate limiting on login attempts

## Changing Credentials
To change the login credentials, edit the `AUTHORIZED_USER` object in `/backend/routes/auth.js`:

```javascript
const AUTHORIZED_USER = {
    email: 'your-email@example.com',
    password: 'your-password'
};
```

## Troubleshooting

### Can't login
- Verify you're using the exact credentials: `client@gmail.com` / `client1234@`
- Check browser console for errors
- Clear browser cache and localStorage
- Ensure the backend server is running

### Locations not saving
- Verify you're logged in
- Check that the `backend/data/` directory exists
- Check file permissions on the `locations.json` file
- Review server logs for write errors

### Session expires immediately
- Check server time settings
- Verify token is being stored in localStorage
- Check for any middleware conflicts
