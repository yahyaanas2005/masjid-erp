-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- 1. Tenants (Mosques)
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  address text,
  sect text, -- 'Hanafi', 'Shafi', etc.
  created_at timestamp with time zone default now()
);

-- 2. Users (Global) - Linked to Supabase Auth
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  phone text,
  email text,
  created_at timestamp with time zone default now()
);

-- 3. Memberships (RBAC)
create table memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  tenant_id uuid references tenants(id),
  role text check (role in ('Owner', 'Admin', 'Imam', 'Volunteer', 'Member')),
  status text default 'ACTIVE',
  created_at timestamp with time zone default now(),
  unique(user_id, tenant_id)
);

-- 4. Janazah Alerts (High Priority)
create table janazah_alerts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  deceased_name text,
  prayer_time timestamp with time zone,
  location text,
  notified_count integer default 0,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

-- 5. Donations (Shariah Compliant)
create table donations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  donor_id uuid references profiles(id), -- Nullable for anonymous
  amount numeric(10, 2) not null,
  currency text default 'PKR',
  category text check (category in ('Zakat', 'Sadaqah', 'Fitra', 'Waqf', 'Khairat')),
  is_verified boolean default false,
  receipt_url text,
  created_at timestamp with time zone default now()
);

-- RLS Policies (Draft)
alter table tenants enable row level security;
alter table janazah_alerts enable row level security;
alter table donations enable row level security;
