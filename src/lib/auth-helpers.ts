import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    authId: string
    email: string
    name: string
    role: string
    organizationId: string
    departmentId: string | null
    managerId: string | null
    isActive: boolean
    organization?: {
      id: string
      name: string
      slug: string
    } | null
    department?: {
      id: string
      name: string
    } | null
  } | null
  error?: string
}

export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for Authorization header first (for cross-origin/iframe usage)
    const authHeader = request.headers.get('Authorization')
    let accessToken: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
    }

    const { supabase } = createSupabaseReqResClient(request)

    // If we have an access token, use it to get the user
    let authUser = null
    let error = null

    if (accessToken) {
      // Verify the access token directly
      const { data: { user }, error: tokenError } = await supabase.auth.getUser(accessToken)
      authUser = user
      error = tokenError
    } else {
      // Fall back to cookie-based session
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()
      authUser = user
      error = sessionError
    }

    if (error || !authUser) {
      return { success: false, user: null, error: 'Unauthorized' }
    }

    // Get user from our database by authId or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { authId: authUser.id },
          { email: authUser.email }
        ]
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    })

    if (!user) {
      return { success: false, user: null, error: 'User not found' }
    }

    if (!user.isActive) {
      return { success: false, user: null, error: 'Account inactive' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        authId: user.authId || authUser.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        managerId: user.managerId,
        isActive: user.isActive,
        organization: user.organization,
        department: user.department
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { success: false, user: null, error: 'Internal server error' }
  }
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}
