-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'cleaning', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── screens ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS screens (
  id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(10) UNIQUE NOT NULL,  -- 'A', 'B', 'C'
  time_slots JSONB NOT NULL DEFAULT '["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-00:00"]'::jsonb,
  is_active  BOOLEAN DEFAULT TRUE
);

-- ─── bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_id     UUID           NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  date          DATE           NOT NULL,
  time_slot     VARCHAR(20)    NOT NULL,          -- e.g. "09:00-12:00"
  customer_name VARCHAR(255)   NOT NULL,
  phone         VARCHAR(20)    NOT NULL,
  email         VARCHAR(255)   NOT NULL,
  status        booking_status NOT NULL DEFAULT 'booked',
  created_at    TIMESTAMP      DEFAULT NOW(),
  CONSTRAINT unique_screen_date_slot UNIQUE (screen_id, date, time_slot)
);

-- ─── admin_users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL    -- bcrypt hash
);
-- ─── global_settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS global_settings (
  key   VARCHAR(50) PRIMARY KEY,
  value JSONB       NOT NULL
);
-- ─── contact_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT NOW()
);
