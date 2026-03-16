-- Migration: Add authId column for Supabase Auth
-- Run this in Supabase SQL Editor

-- Add authId column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authId" TEXT UNIQUE;

-- Make password nullable (Supabase Auth handles passwords)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Create index on authId
CREATE INDEX IF NOT EXISTS "User_authId_idx" ON "User"("authId");

-- Drop the Session table (Supabase Auth handles sessions)
DROP TABLE IF EXISTS "Session";

-- Done! After running this, you need to:
-- 1. Create Supabase Auth users for each existing user
-- 2. Update the User records with the authId from Supabase Auth
