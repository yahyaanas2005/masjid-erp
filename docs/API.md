# Masjid Management ERP - API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📱 Authentication Endpoints

### Send OTP
```http
POST /auth/send-otp
```
**Body:**
```json
{
  "phone": "+1234567890",
  "purpose": "login" // or "registration"
}
```

### Register
```http
POST /auth/register
```
**Body:**
```json
{
  "name": "Ahmed Ali",
  "phone": "+1234567890",
  "password": "securepassword",
  "otp": "123456",
  "email": "ahmed@example.com" // optional
}
```

### Login
```http
POST /auth/login
```
**Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

### Refresh Token
```http
POST /auth/refresh
```
**Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

---

## 👤 User Endpoints

### Get Current User
```http
GET /users/me
Headers: Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/me
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "Ahmed Ali Updated",
  "email": "newemail@example.com",
  "gender": "male",
  "dateOfBirth": "1990-01-01"
}
```

### Update Home Location
```http
POST /users/location
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "latitude": 24.8607,
  "longitude": 67.0011,
  "address": "Karachi, Pakistan"
}
```

### Connect to Masjid
```http
POST /users/masjid-connection
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "masjidId": "uuid-here",
  "connectionType": "primary" // or "childhood", "ancestral"
}
```

### Get Verification Status
```http
GET /users/verification
Headers: Authorization: Bearer <token>
```

### Upgrade Verification Tier
```http
POST /users/upgrade-tier
Headers: Authorization: Bearer <token>
```

---

## 🕌 Masjid Endpoints

### Find Nearby Masajid
```http
GET /masajid/nearby?latitude=24.8607&longitude=67.0011&radius=10
```

### Get Masjid Details
```http
GET /masajid/:id
```

### Create Masjid (Tier 3+ required)
```http
POST /masajid
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "name": "Masjid Al-Noor",
  "arabicName": "مسجد النور",
  "description": "Community masjid",
  "location": {
    "latitude": 24.8607,
    "longitude": 67.0011,
    "address": "123 Main St, Karachi"
  },
  "prayerTimes": {
    "fajr": "05:30",
    "dhuhr": "13:00",
    "asr": "16:30",
    "maghrib": "18:45",
    "isha": "20:00",
    "jumuah": "13:30"
  }
}
```

### Update Masjid (Admin only)
```http
PUT /masajid/:id
Headers: Authorization: Bearer <token>
```

### Get Community Heatmap (Admin only)
```http
GET /masajid/:id/heatmap
Headers: Authorization: Bearer <token>
```

### Get Masjid Statistics
```http
GET /masajid/:id/stats
```

---

## 🤲 Prayer Endpoints

### Prayer Check-in
```http
POST /prayers/checkin
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "masjidId": "uuid-here",
  "prayerName": "fajr", // fajr, dhuhr, asr, maghrib, isha, jumuah
  "latitude": 24.8607,
  "longitude": 67.0011,
  "checkInMethod": "manual" // or "auto"
}
```

### Get Prayer History
```http
GET /prayers/my-history?limit=20&offset=0
Headers: Authorization: Bearer <token>
```

### Get Prayer Statistics
```http
GET /prayers/stats
Headers: Authorization: Bearer <token>
```

---

## 💰 Donation Endpoints

### Make Donation (Tier 2+ required)
```http
POST /donations
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "masjidId": "uuid-here",
  "amount": 100.00,
  "currency": "USD",
  "donationType": "sadaqah", // sadaqah, zakat, lillah, fidya, kaffarah, aqiqah, general
  "zakatType": "zakat_ul_mal", // optional, for zakat donations
  "paymentMethod": "card", // cash, card, bank_transfer, digital_wallet
  "allocatedTo": "Utilities",
  "isRecurring": false,
  "isAnonymous": false,
  "notes": "For electricity bill"
}
```

### Get My Donations
```http
GET /donations/my-donations?limit=20&offset=0
Headers: Authorization: Bearer <token>
```

### Get Masjid Donations (Public)
```http
GET /donations/masjid/:masjidId?limit=20
```

### Get Transparency Dashboard (Public)
```http
GET /donations/masjid/:masjidId/transparency
```

---

## 🎁 Mosque Needs Endpoints

### Get All Mosque Needs
```http
GET /needs?masjidId=uuid&status=open&category=supplies
```

### Get Mosque Need Details
```http
GET /needs/:id
```

### Create Mosque Need (Admin only)
```http
POST /needs
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "masjidId": "uuid-here",
  "title": "10 Prayer Mats Needed",
  "description": "We need 10 high-quality prayer mats for the main prayer hall",
  "category": "supplies", // infrastructure, utilities, supplies, technology, maintenance, other
  "totalCost": 500.00,
  "currency": "USD",
  "requiresDelivery": true,
  "deliveryAddress": "Masjid address",
  "priority": "medium", // low, medium, high, urgent
  "deadline": "2025-02-01T00:00:00Z"
}
```

### Contribute to Mosque Need (Tier 2+ required)
```http
POST /needs/:id/contribute
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "amount": 50.00,
  "message": "May Allah accept this contribution"
}
```

### Update Mosque Need (Admin only)
```http
PUT /needs/:id
Headers: Authorization: Bearer <token>
```

### Delete Mosque Need (Admin only)
```http
DELETE /needs/:id
Headers: Authorization: Bearer <token>
```

---

## ⚰️ Janazah Endpoints

### Get Upcoming Janazah (Tier 3+ required)
```http
GET /janazah/upcoming
Headers: Authorization: Bearer <token>
```

### Get Janazah Details (Tier 3+ required)
```http
GET /janazah/:id
Headers: Authorization: Bearer <token>
```

### Create Janazah Notification (Admin only)
```http
POST /janazah
Headers: Authorization: Bearer <token>
```
**Body:**
```json
{
  "masjidId": "uuid-here",
  "deceasedName": "Abdullah Rahman",
  "gender": "male",
  "ageGroup": "elderly",
  "janazahTime": "2025-01-15T14:00:00Z",
  "location": {
    "latitude": 24.8607,
    "longitude": 67.0011,
    "address": "Masjid Al-Noor"
  },
  "burialLocation": "City Cemetery",
  "burialTime": "2025-01-15T15:30:00Z",
  "familyContact": "+1234567890",
  "additionalInfo": "Family requests community presence",
  "familyConsent": true,
  "publicVisibility": true
}
```

### RSVP to Janazah (Tier 3+ required)
```http
POST /janazah/:id/rsvp
Headers: Authorization: Bearer <token>
```

### Update Janazah (Admin only)
```http
PUT /janazah/:id
Headers: Authorization: Bearer <token>
```

---

## 🔐 Verification Tiers

### Tier 0: Unverified
- New user, basic registration only

### Tier 1: Neighborhood Verification
- Face-to-face verification by mosque committee
- **Unlocks:** Basic masjid services, prayer notifications

### Tier 2: Digital Identity & Geo-fencing
- 5+ verified prayer check-ins over 2 weeks
- **Unlocks:** Donations, mosque needs, community visibility

### Tier 3: Engagement History
- 3+ months active, 5+ donations, 30+ check-ins
- **Unlocks:** Janazah notifications, volunteer opportunities

### Tier 4: Official ID Verification
- National ID verification by admin
- **Unlocks:** Administrative access, financial management

---

## 📊 Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🚀 Getting Started

1. **Send OTP** to your phone number
2. **Register** with OTP verification
3. **Update your location** for geo-fencing
4. **Connect to a masjid** (primary, childhood, or ancestral)
5. **Check in for prayers** to build verification tier
6. **Make donations** and contribute to mosque needs
7. **Receive Janazah alerts** (Tier 3+)

---

**May Allah ﷻ accept this work and make it beneficial for the Ummah. Ameen.**
