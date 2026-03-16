-- AbsenKu Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY');
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'MARRIAGE', 'OTHER');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Create Organization table
CREATE TABLE "Organization" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "workStartTime" TEXT NOT NULL DEFAULT '09:00',
    "workEndTime" TEXT NOT NULL DEFAULT '18:00',
    "breakStartTime" TEXT NOT NULL DEFAULT '12:00',
    "breakEndTime" TEXT NOT NULL DEFAULT '13:00',
    "lateTolerance" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Settings table
CREATE TABLE "Settings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL UNIQUE,
    "notifyClockIn" BOOLEAN NOT NULL DEFAULT true,
    "notifyClockOut" BOOLEAN NOT NULL DEFAULT true,
    "notifyLate" BOOLEAN NOT NULL DEFAULT true,
    "notifyLeave" BOOLEAN NOT NULL DEFAULT true,
    "requireGps" BOOLEAN NOT NULL DEFAULT true,
    "requirePhoto" BOOLEAN NOT NULL DEFAULT false,
    "gpsRadius" INTEGER NOT NULL DEFAULT 100,
    "officeLatitude" DOUBLE PRECISION,
    "officeLongitude" DOUBLE PRECISION,
    "officeAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create User table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "employeeId" TEXT,
    "position" TEXT,
    "joinDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT,
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Department table
CREATE TABLE "Department" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "managerId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Add foreign keys to User table
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_departmentId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_managerId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Attendance table
CREATE TABLE "Attendance" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "clockInLat" DOUBLE PRECISION,
    "clockInLng" DOUBLE PRECISION,
    "clockInAddress" TEXT,
    "clockOutLat" DOUBLE PRECISION,
    "clockOutLng" DOUBLE PRECISION,
    "clockOutAddress" TEXT,
    "clockInPhoto" TEXT,
    "clockOutPhoto" TEXT,
    "notes" TEXT,
    "workHours" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create LeaveRequest table
CREATE TABLE "LeaveRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "attachment" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "rejectedReason" TEXT,
    "userId" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create LeaveQuota table
CREATE TABLE "LeaveQuota" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "annualTotal" INTEGER NOT NULL DEFAULT 12,
    "annualUsed" INTEGER NOT NULL DEFAULT 0,
    "sickTotal" INTEGER NOT NULL DEFAULT 14,
    "sickUsed" INTEGER NOT NULL DEFAULT 0,
    "emergencyTotal" INTEGER NOT NULL DEFAULT 3,
    "emergencyUsed" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Holiday table
CREATE TABLE "Holiday" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Holiday_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Session table
CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create AuditLog table
CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" TEXT,
    "newData" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "organizationId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- Create unique constraints
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_date_key" UNIQUE ("userId", "date");
ALTER TABLE "LeaveQuota" ADD CONSTRAINT "LeaveQuota_userId_year_key" UNIQUE ("userId", "year");
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_name_key" UNIQUE ("organizationId", "name");
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_organizationId_date_key" UNIQUE ("organizationId", "date");

-- Insert Organization
INSERT INTO "Organization" ("id", "name", "slug", "email", "phone", "address", "plan", "maxUsers") VALUES
('org-001', 'PT. AbsenKu Indonesia', 'absensiku', 'info@absensiku.id', '(021) 1234-5678', 'Jl. Sudirman No. 123, Jakarta Selatan', 'PROFESSIONAL', 100);

-- Insert Settings
INSERT INTO "Settings" ("organizationId", "officeLatitude", "officeLongitude", "officeAddress") VALUES
('org-001', -6.2088, 106.8456, 'Jl. Sudirman No. 123, Jakarta Selatan');

-- Insert Departments
INSERT INTO "Department" ("id", "name", "description", "organizationId") VALUES
('dept-eng', 'Engineering', 'Tim pengembangan perangkat lunak', 'org-001'),
('dept-hr', 'Human Resource', 'Tim manajemen sumber daya manusia', 'org-001'),
('dept-marketing', 'Marketing', 'Tim pemasaran dan promosi', 'org-001'),
('dept-finance', 'Finance', 'Tim keuangan dan akuntansi', 'org-001'),
('dept-it', 'IT Support', 'Tim dukungan teknologi informasi', 'org-001');

-- Insert Users (password: demo123)
INSERT INTO "User" ("id", "email", "password", "name", "role", "organizationId", "position", "departmentId", "isActive") VALUES
('user-admin', 'admin@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Admin User', 'ADMIN', 'org-001', 'System Administrator', 'dept-it', true),
('user-hr', 'hr@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Sarah Johnson', 'HR', 'org-001', 'HR Manager', 'dept-hr', true),
('user-mgr-eng', 'manager.engineering@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Michael Chen', 'MANAGER', 'org-001', 'Engineering Manager', 'dept-eng', true),
('user-mgr-mkt', 'manager.marketing@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'David Wilson', 'MANAGER', 'org-001', 'Marketing Manager', 'dept-marketing', true),
('user-john', 'john.doe@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'John Doe', 'EMPLOYEE', 'org-001', 'Senior Software Engineer', 'dept-eng', true),
('user-jane', 'jane.smith@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Jane Smith', 'EMPLOYEE', 'org-001', 'Software Engineer', 'dept-eng', true),
('user-budi', 'budi.santoso@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Budi Santoso', 'EMPLOYEE', 'org-001', 'Frontend Developer', 'dept-eng', true),
('user-dewi', 'dewi.putri@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Dewi Putri', 'EMPLOYEE', 'org-001', 'Backend Developer', 'dept-eng', true),
('user-ahmad', 'ahmad.wijaya@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Ahmad Wijaya', 'EMPLOYEE', 'org-001', 'Marketing Specialist', 'dept-marketing', true),
('user-siti', 'siti.rahayu@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Siti Rahayu', 'EMPLOYEE', 'org-001', 'Content Creator', 'dept-marketing', true),
('user-riski', 'riski.hidayat@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Riski Hidayat', 'EMPLOYEE', 'org-001', 'HR Staff', 'dept-hr', true),
('user-linda', 'linda.kusuma@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Linda Kusuma', 'EMPLOYEE', 'org-001', 'Finance Staff', 'dept-finance', true),
('user-yoga', 'yoga.pratama@absensi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aOy6.Xqt8F.Xqm', 'Yoga Pratama', 'EMPLOYEE', 'org-001', 'IT Support', 'dept-it', true);

-- Update Department Managers
UPDATE "Department" SET "managerId" = 'user-hr' WHERE "id" = 'dept-hr';
UPDATE "Department" SET "managerId" = 'user-mgr-eng' WHERE "id" = 'dept-eng';
UPDATE "Department" SET "managerId" = 'user-mgr-mkt' WHERE "id" = 'dept-marketing';

-- Update User Managers
UPDATE "User" SET "managerId" = 'user-mgr-eng' WHERE "id" IN ('user-john', 'user-jane', 'user-budi', 'user-dewi');
UPDATE "User" SET "managerId" = 'user-mgr-mkt' WHERE "id" IN ('user-ahmad', 'user-siti');
UPDATE "User" SET "managerId" = 'user-hr' WHERE "id" = 'user-riski';

-- Insert Leave Quotas
INSERT INTO "LeaveQuota" ("userId", "year") VALUES
('user-admin', 2025),
('user-hr', 2025),
('user-mgr-eng', 2025),
('user-mgr-mkt', 2025),
('user-john', 2025),
('user-jane', 2025),
('user-budi', 2025),
('user-dewi', 2025),
('user-ahmad', 2025),
('user-siti', 2025),
('user-riski', 2025),
('user-linda', 2025),
('user-yoga', 2025);

-- Insert Holidays
INSERT INTO "Holiday" ("name", "date", "isRecurring", "organizationId") VALUES
('Tahun Baru', '2025-01-01', true, 'org-001'),
('Hari Buruh Internasional', '2025-05-01', true, 'org-001'),
('Hari Kemerdekaan Indonesia', '2025-08-17', true, 'org-001'),
('Hari Natal', '2025-12-25', true, 'org-001');

-- Done! Demo accounts (password: demo123):
-- admin@absensi.com (Admin)
-- hr@absensi.com (HR)
-- manager.engineering@absensi.com (Manager)
-- john.doe@absensi.com (Employee)
