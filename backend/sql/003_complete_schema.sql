-- 003_complete_schema.sql
-- Run this in Neon SQL Editor to add missing tables/columns

-- Ensure janazah_alerts table exists
CREATE TABLE IF NOT EXISTS janazah_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  deceased_name TEXT NOT NULL,
  prayer_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  notified_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add phone to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ensure all tables exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    masjid_name TEXT,
    address TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    date DATE NOT NULL,
    fajr TEXT,
    dhuhr TEXT,
    asr TEXT,
    maghrib TEXT,
    isha TEXT,
    jumuah TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, date)
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    priority TEXT DEFAULT 'NORMAL',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, 
    donor_name TEXT, 
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'Completed',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
