# Masjid ERP - Deployment Guide

## 🚀 Production Deployment Overview

This guide covers deploying the Masjid Management ERP to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database ready
- [ ] Google Maps API key (with billing enabled)
- [ ] Firebase project configured
- [ ] Twilio account for SMS (optional)
- [ ] Domain name (optional)
- [ ] SSL certificate (for HTTPS)

---

## 🗄️ Database Deployment (PostgreSQL)

### Option 1: AWS RDS (Recommended)

1. **Create RDS PostgreSQL Instance**
```bash
# Go to AWS Console → RDS → Create Database
# Choose PostgreSQL 14+
# Instance type: db.t3.micro (free tier) or db.t3.small
# Storage: 20GB SSD
# Enable automated backups
```

2. **Configure Security Group**
```bash
# Allow inbound traffic on port 5432
# From your backend server IP only
```

3. **Get Connection Details**
```
Endpoint: your-db.xxxxx.us-east-1.rds.amazonaws.com
Port: 5432
Database: masjid_erp
Username: postgres
Password: <your-secure-password>
```

### Option 2: Heroku Postgres

```bash
# Install Heroku CLI
heroku login
heroku addons:create heroku-postgresql:mini -a your-app-name

# Get database URL
heroku config:get DATABASE_URL -a your-app-name
```

### Option 3: DigitalOcean Managed Database

```bash
# Create database cluster in DigitalOcean
# Choose PostgreSQL 14
# Select region closest to your users
# Basic plan: $15/month
```

### Database Initialization

```bash
# Connect to your production database
psql -h your-db-host -U postgres -d masjid_erp

# The app will auto-create tables on first run
# Or manually run migrations if needed
```

---

## 🖥️ Backend Deployment (Node.js)

### Option 1: Heroku (Easiest)

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Create Heroku App**
```bash
cd backend
heroku create masjid-erp-api

# Add PostgreSQL addon (if not using external DB)
heroku addons:create heroku-postgresql:mini
```

3. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secret_jwt_key_here
heroku config:set GOOGLE_MAPS_API_KEY=your_google_maps_key
heroku config:set FIREBASE_PROJECT_ID=your_firebase_project
heroku config:set FIREBASE_PRIVATE_KEY="your_firebase_key"
heroku config:set FIREBASE_CLIENT_EMAIL=your_firebase_email
heroku config:set ALLOWED_ORIGINS=https://your-domain.com
```

4. **Create Procfile**
```bash
echo "web: node server.js" > Procfile
```

5. **Deploy**
```bash
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a masjid-erp-api
git push heroku main
```

6. **Open App**
```bash
heroku open
# Your API will be at: https://masjid-erp-api.herokuapp.com
```

### Option 2: AWS EC2

1. **Launch EC2 Instance**
```bash
# Ubuntu Server 22.04 LTS
# Instance type: t2.micro (free tier) or t2.small
# Configure security group: Allow ports 22, 80, 443, 5000
```

2. **Connect to Instance**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
```

4. **Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2
```

5. **Clone Repository**
```bash
git clone your-repo-url
cd masjid-erp/backend
npm install --production
```

6. **Create .env File**
```bash
nano .env
# Add all production environment variables
```

7. **Start with PM2**
```bash
pm2 start server.js --name masjid-erp-api
pm2 save
pm2 startup
```

8. **Setup Nginx Reverse Proxy**
```bash
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/masjid-erp

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/masjid-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: DigitalOcean App Platform

1. **Create App**
```bash
# Go to DigitalOcean → App Platform → Create App
# Connect your GitHub repository
# Select backend folder
```

2. **Configure Build**
```yaml
name: masjid-erp-api
region: nyc
services:
  - name: api
    github:
      repo: your-username/masjid-erp
      branch: main
      deploy_on_push: true
    source_dir: /backend
    run_command: node server.js
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        value: ${JWT_SECRET}
      - key: GOOGLE_MAPS_API_KEY
        value: ${GOOGLE_MAPS_API_KEY}
```

3. **Deploy**
```bash
# App will auto-deploy on git push
# URL: https://masjid-erp-api-xxxxx.ondigitalocean.app
```

---

## 📱 Mobile App Deployment

### Android (Google Play Store)

1. **Build Release APK**
```bash
cd frontend/masjid_erp_app

# Update version in pubspec.yaml
version: 1.0.0+1

# Build release APK
flutter build apk --release

# Or build App Bundle (recommended)
flutter build appbundle --release
```

2. **Sign APK**
```bash
# Create keystore
keytool -genkey -v -keystore ~/masjid-erp-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias masjid-erp

# Add to android/key.properties
storePassword=<password>
keyPassword=<password>
keyAlias=masjid-erp
storeFile=<path-to-keystore>
```

3. **Upload to Play Store**
```bash
# Go to Google Play Console
# Create new app
# Upload AAB file
# Fill in store listing, screenshots, etc.
# Submit for review
```

### iOS (Apple App Store)

1. **Build Release IPA**
```bash
flutter build ios --release

# Open in Xcode
open ios/Runner.xcworkspace
```

2. **Archive in Xcode**
```bash
# Product → Archive
# Distribute App → App Store Connect
# Upload
```

3. **Submit to App Store**
```bash
# Go to App Store Connect
# Create new app
# Upload build
# Fill in app information
# Submit for review
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database encryption at rest
- [ ] Use environment variables (never commit secrets)
- [ ] Enable rate limiting
- [ ] Set up CORS properly
- [ ] Regular security updates
- [ ] Enable database backups

---

## 📊 Monitoring & Logging

### Backend Monitoring

**Option 1: PM2 Monitoring**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Option 2: New Relic**
```bash
npm install newrelic
# Add newrelic.js config
```

**Option 3: Sentry (Error Tracking)**
```bash
npm install @sentry/node
# Add to server.js
```

### Database Monitoring

```bash
# Enable slow query logging
# Set up automated backups
# Monitor disk usage
# Set up alerts for high CPU/memory
```

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "masjid-erp-api"
        heroku_email: "your-email@example.com"
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Add more server instances
# Use load balancer (AWS ELB, Nginx)
# Implement Redis for session management
```

### Database Scaling
```bash
# Enable read replicas
# Implement connection pooling
# Use database indexes
# Consider sharding for large datasets
```

### Caching
```bash
# Implement Redis caching
# Cache prayer times, masjid data
# Use CDN for static assets
```

---

## 💰 Cost Estimation

### Minimal Setup (Suitable for 1-5 Masajid)
- **Database**: Heroku Postgres Mini ($5/month)
- **Backend**: Heroku Basic Dyno ($7/month)
- **Total**: ~$12/month

### Small Setup (5-20 Masajid)
- **Database**: DigitalOcean Managed DB ($15/month)
- **Backend**: DigitalOcean Droplet ($12/month)
- **Total**: ~$27/month

### Medium Setup (20-100 Masajid)
- **Database**: AWS RDS db.t3.small ($30/month)
- **Backend**: AWS EC2 t3.small ($15/month)
- **Redis**: AWS ElastiCache ($15/month)
- **Total**: ~$60/month

### Additional Costs
- **Google Maps API**: $0-200/month (first $200 free)
- **Firebase**: Free tier sufficient for MVP
- **Twilio SMS**: $0.0075/SMS
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)

---

## 🧪 Testing Before Production

```bash
# Backend tests
cd backend
npm test

# Load testing
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:5000/health

# Security scan
npm audit
npm audit fix
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly database backups verification
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Monitor error logs daily
- [ ] Review API usage and costs

### Emergency Contacts
- Database admin
- DevOps engineer
- Security team

---

## 🎯 Post-Deployment

1. **Verify All Endpoints**
```bash
curl https://your-api.com/health
curl https://your-api.com/api/v1
```

2. **Test Critical Flows**
- User registration
- Prayer check-in
- Donation processing
- Janazah notifications

3. **Monitor for 24 Hours**
- Check error logs
- Monitor response times
- Verify database connections

4. **Announce to Community**
- Send email to pilot masajid
- Provide support documentation
- Collect feedback

---

**May Allah ﷻ bless this deployment and make it beneficial for the Ummah. Ameen.**
