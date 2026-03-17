/**
 * AttendPro - Employee Attendance Management System
 * @author Abbayosua <abbasiagian@gmail.com>
 *
 * Database client configuration with Supabase PostgreSQL support
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use Supabase pooler URL for serverless/production
const supabaseDatabaseUrl = process.env.DATABASE_URL?.includes('file:')
  ? process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: supabaseDatabaseUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db