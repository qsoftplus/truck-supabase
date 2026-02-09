-- Migration: Update trucks and drivers tables to match new schema
-- Date: 2025-02-05

-- Update drivers table: add new phone columns
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS alt_phone text,
ADD COLUMN IF NOT EXISTS home_phone text;

-- Optionally drop photo_url if not needed (comment out if you still need it)
-- ALTER TABLE public.drivers DROP COLUMN IF EXISTS photo_url;
