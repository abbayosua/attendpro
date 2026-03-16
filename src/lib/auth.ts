import bcrypt from 'bcrypt'
import { randomBytes, randomUUID } from 'crypto'
import { db } from './db'
import { User, Role, Organization, Department } from '@prisma/client'

const SALT_ROUNDS = 12
const SESSION_DURATION_DAYS = 7

// ====================
// Password Utilities
// ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ====================
// Session Utilities
// ====================

export function generateToken(): string {
  return randomUUID() + '-' + randomBytes(32).toString('hex')
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const session = await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })

  return session
}

export async function validateSession(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          organization: true,
          department: true,
          manager: {
            select: { id: true, name: true, email: true }
          },
        },
      },
    },
  })

  if (!session) {
    return { valid: false, user: null, session: null }
  }

  if (session.expiresAt < new Date()) {
    // Session expired, delete it
    await db.session.delete({ where: { id: session.id } })
    return { valid: false, user: null, session: null }
  }

  // Update last login
  await db.user.update({
    where: { id: session.userId },
    data: { lastLoginAt: new Date() },
  })

  return { valid: true, user: session.user, session }
}

export async function deleteSession(token: string) {
  try {
    await db.session.delete({ where: { token } })
    return true
  } catch {
    return false
  }
}

export async function cleanupExpiredSessions() {
  const result = await db.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  return result.count
}

// ====================
// User Utilities
// ====================

export type SafeUser = Omit<User, 'password'> & {
  organization: Organization | null
  department: Department | null
  manager: { id: string; name: string; email: string } | null
}

export function sanitizeUser(user: User & {
  organization: Organization | null
  department: Department | null
  manager: { id: string; name: string; email: string } | null
}): SafeUser {
  const { password, ...safeUser } = user
  return safeUser as SafeUser
}

// ====================
// Role Permissions
// ====================

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ['all'],
  ADMIN: [
    'manage_organization',
    'manage_users',
    'manage_departments',
    'view_all_attendance',
    'manage_attendance',
    'approve_leave',
    'view_reports',
    'manage_settings',
  ],
  HR: [
    'manage_users',
    'manage_departments',
    'view_all_attendance',
    'approve_leave',
    'view_reports',
  ],
  MANAGER: [
    'view_team_attendance',
    'approve_team_leave',
    'view_team_reports',
  ],
  EMPLOYEE: [
    'view_own_attendance',
    'submit_attendance',
    'submit_leave',
    'view_own_reports',
  ],
}

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes('all') || permissions.includes(permission)
}

export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  const roleHierarchy: Role[] = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'SUPER_ADMIN']
  const actorLevel = roleHierarchy.indexOf(actorRole)
  const targetLevel = roleHierarchy.indexOf(targetRole)
  return actorLevel > targetLevel
}

// ====================
// Auth Response Types
// ====================

export interface AuthResponse {
  success: boolean
  message: string
  user?: SafeUser
  token?: string
}

export async function loginUser(
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResponse> {
  // Find user
  const user = await db.user.findUnique({
    where: { email },
    include: {
      organization: true,
      department: true,
      manager: {
        select: { id: true, name: true, email: true }
      },
    },
  })

  if (!user) {
    return { success: false, message: 'Email atau password salah' }
  }

  if (!user.isActive) {
    return { success: false, message: 'Akun Anda tidak aktif. Hubungi administrator.' }
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { success: false, message: 'Email atau password salah' }
  }

  // Create session
  const session = await createSession(user.id, userAgent, ipAddress)

  return {
    success: true,
    message: 'Login berhasil',
    user: sanitizeUser(user),
    token: session.token,
  }
}

export async function registerUser(
  data: {
    email: string
    password: string
    name: string
    organizationId: string
    role?: Role
    departmentId?: string
    position?: string
  }
): Promise<AuthResponse> {
  // Check if email already exists
  const existing = await db.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    return { success: false, message: 'Email sudah terdaftar' }
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password)

  // Create user
  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      organizationId: data.organizationId,
      role: data.role || 'EMPLOYEE',
      departmentId: data.departmentId,
      position: data.position,
    },
    include: {
      organization: true,
      department: true,
      manager: {
        select: { id: true, name: true, email: true }
      },
    },
  })

  // Create session
  const session = await createSession(user.id)

  return {
    success: true,
    message: 'Registrasi berhasil',
    user: sanitizeUser(user),
    token: session.token,
  }
}
