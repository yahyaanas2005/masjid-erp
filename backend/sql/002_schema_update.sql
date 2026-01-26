-- 002_schema_update.sql

-- User Management (Replacing Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Admin', -- 'Owner', 'Admin', 'Member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (Linked to Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    masjid_name TEXT,
    address TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer Times
CREATE TABLE IF NOT EXISTS prayer_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- For multi-tenant support later
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

-- Announcements / Notices
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    priority TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'HIGH'
    created_by UUID, -- References users(id) ideally
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations (Ensure table exists)
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, 
    donor_name TEXT, 
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT, -- 'Zakat', 'Sadaqah', etc.
    status TEXT DEFAULT 'Completed',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
