# Deployment Guide

This guide covers deploying the Weather Alert Automation System to various platforms.

---

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Access at http://localhost:3000
```

---

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Heroku account

### Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new app**
   ```bash
   heroku create your-app-name
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Open the app**
   ```bash
   heroku open
   ```

### Notes
- The scheduler runs automatically within the app
- Data is stored in the filesystem (not persistent across restarts)
- For production, consider using MongoDB Atlas instead

---

## Railway Deployment

### Steps

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect Node.js and deploy

### Environment Variables
Set in Railway dashboard:
- `PORT` - Railway sets this automatically
- `NODE_ENV` - Set to `production`

---

## Render Deployment

### Steps

1. Go to https://render.com
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click "Create Web Service"

---

## Vercel Deployment

### Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Vercel account

### Steps

1. **Login**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Cron Jobs**
   
   The `vercel.json` is already configured to trigger the scheduler every 15 minutes.
   
   To change frequency, edit `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/scheduler/trigger",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

### Notes
- Vercel functions have a 10-second timeout on free tier
- Use Vercel Pro for longer timeouts
- Consider using MongoDB Atlas for persistent storage

---

## AWS Lambda Deployment

### Using Serverless Framework

1. **Install Serverless**
   ```bash
   npm install -g serverless
   ```

2. **Create serverless.yml**
   ```yaml
   service: weather-alert-system
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
   
   functions:
     api:
       handler: backend/server.handler
       events:
         - http:
             path: /{proxy+}
             method: any
     
     scheduler:
       handler: backend/scheduler/lambda.handler
       events:
         - schedule: rate(15 minutes)
   ```

3. **Deploy**
   ```bash
   serverless deploy
   ```

### Notes
- Need to create a Lambda handler wrapper
- Use DynamoDB or S3 for persistent storage
- Configure API Gateway for the frontend

---

## Docker Deployment

### Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Build and Run

```bash
# Build
docker build -t weather-alert-system .

# Run
docker run -p 3000:3000 -v $(pwd)/data:/app/data weather-alert-system
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

---

## Using MongoDB Instead of JSON Files

For production deployments, consider using MongoDB for persistent storage.

### 1. Install MongoDB driver
```bash
npm install mongodb
```

### 2. Create MongoDB adapter
Replace the file-based storage in `db.js` with MongoDB operations.

### 3. Environment variable
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weather-alerts
```

---

## SSL/HTTPS Configuration

### Using Nginx as Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Cloudflare

1. Point your domain to Cloudflare
2. Enable "Full SSL" mode
3. Cloudflare handles SSL termination

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure persistent storage (MongoDB/PostgreSQL)
- [ ] Set up SSL/HTTPS
- [ ] Configure proper logging
- [ ] Set up monitoring (e.g., New Relic, DataDog)
- [ ] Add authentication to admin interface
- [ ] Set up backup for database
- [ ] Configure proper error handling
- [ ] Set up health check endpoint monitoring
- [ ] Configure rate limiting

---

## Monitoring

### Health Check Endpoint

The system exposes a health check at:
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00Z",
  "uptime": 3600
}
```

### Setting Up Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

Monitor: `https://your-domain.com/api/health`

---

## Scaling

For high-traffic scenarios:

1. **Horizontal Scaling**: Run multiple instances behind a load balancer
2. **Database**: Use MongoDB/PostgreSQL with connection pooling
3. **Caching**: Add Redis for caching weather data
4. **Queue**: Use RabbitMQ/SQS for processing alerts
