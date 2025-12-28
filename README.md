# 🕌 Masjid Management ERP

> **"Indeed, the mosques are for Allah, so do not invoke with Allah anyone."** (Quran 72:18)

A comprehensive Islamic-centered Masjid Management ERP system with beautiful UI, transparent donation management, and community engagement features.

## ✨ Features

- 🔐 **4-Tier Verification System** - Progressive trust with geolocation
- 📍 **Location-Based Services** - Google Maps integration
- 🤲 **Prayer Tracking** - Geo-fenced check-ins with streaks
- 💰 **Transparent Donations** - Shariah-compliant management
- 🎁 **Mosque Needs** - Community-driven Sadaqah Jariyah
- ⚰️ **Janazah Alerts** - Respectful funeral notifications

## 🚀 Quick Start

### For Deployment (Production)

1. **Read the Deployment Guide**
   ```
   See DEPLOYMENT_GUIDE.md for complete step-by-step instructions
   ```

2. **Run Quick Deploy Script**
   ```powershell
   .\deploy.ps1
   ```

3. **Follow the instructions** to deploy to Vercel

### For Development (Local)

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Frontend**
   - Open `frontend/index.html` in your browser
   - Or use a local server: `npx serve frontend`

## 📁 Project Structure

```
masjid-erp/
├── backend/              # Node.js + Express API
│   ├── config/          # Database, Redis, Google Maps
│   ├── models/          # Sequelize models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation
│   ├── scripts/         # Database initialization
│   └── server.js        # Main server file
├── frontend/            # Web application
│   ├── index.html       # Main page
│   ├── styles.css       # Premium styling
│   └── app.js           # Frontend logic
├── docs/                # Documentation
├── DEPLOYMENT_GUIDE.md  # Complete deployment guide
└── deploy.ps1           # Quick deploy script
```

## 🗄️ Database

Uses PostgreSQL (Neon DB recommended for production)

**Models:**
- Users
- Masajid
- PrayerCheckIns
- Donations
- MosqueNeeds
- JanazahNotifications
- VerificationHistory
- UserMasjidConnections

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Environment variable protection

## 📱 Technology Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Sequelize
- Redis (optional)
- Google Maps API
- Firebase (push notifications)

**Frontend:**
- HTML5 + CSS3
- Vanilla JavaScript
- Google Fonts (Inter, Amiri)
- Responsive design

## 🌍 Deployment

**Recommended Stack:**
- **Backend + Frontend**: Vercel (free tier)
- **Database**: Neon DB (free tier)
- **Version Control**: GitHub

See `DEPLOYMENT_GUIDE.md` for complete instructions.

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Documentation](docs/API.md) - API reference
- [Quick Start](QUICK_START.md) - Get started in 5 minutes

## 🎯 Default Credentials

After database initialization:
```
Email: admin@masjid-erp.com
Password: Admin@123
```

**⚠️ Change this password immediately after first login!**

## 🤝 Contributing

Built with Islamic principles:
- **Amanah (أمانة)** - Trustworthiness through transparency
- **Ihsan (إحسان)** - Excellence in design
- **Sitr (ستر)** - Privacy and data protection
- **Barakah (بركة)** - Seeking Allah's blessing

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

> **"And whoever does an atom's weight of good will see it."** (Quran 99:7)

May Allah ﷻ bless this project and make it a means of continuous reward (Sadaqah Jariyah) for all involved. Ameen.

---

**Built with ❤️ for the Muslim Ummah**

**Version**: 1.0.0  
**Status**: Production Ready 🚀
