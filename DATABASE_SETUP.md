# 🗄️ Database Initialization Instructions

## Step 1: Get Your Neon Connection String

From the Neon console (the modal that's open), you need to:

1. Click **"Show password"** button at the bottom of the modal
2. Copy the **entire connection string** - it should look like:
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-shy-union-a12345.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this somewhere** - you'll need it!

---

## Step 2: Create Environment File

1. Navigate to the backend folder
2. Create a file called `.env` (just `.env`, no extension)
3. Add this content (replace with YOUR connection string):

```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-shy-union-a12345.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Save the file!**

---

## Step 3: Run These Commands

Open PowerShell and run these commands **one by one**:

```powershell
cd c:\Users\i4970\Downloads\Saas\Masjid\masjid-erp\backend
```

```powershell
npm install
```

Wait for it to finish (might take 1-2 minutes), then:

```powershell
node scripts/init-db.js
```

---

## ✅ Success!

You should see:
```
✅ Database Initialization Complete!
📊 Database Tables Created:
   • Users
   • Masajid
   • PrayerCheckIns
   • Donations
   • MosqueNeeds
   • JanazahNotifications
```

**Default Admin Credentials:**
- Email: `admin@masjid-erp.com`
- Password: `Admin@123`

---

## 🎉 You're Done!

Your Masjid ERP is now **LIVE**!

Visit your Vercel URL and login with the admin credentials above.

**⚠️ Remember to change the admin password after first login!**
