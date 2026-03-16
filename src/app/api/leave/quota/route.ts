import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'

// GET /api/leave/quota - Get user's leave quota for current year
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get or create leave quota
    let quota = await db.leaveQuota.findUnique({
      where: {
        userId_year: {
          userId,
          year
        }
      }
    })

    if (!quota) {
      // Create default quota for the year
      quota = await db.leaveQuota.create({
        data: {
          userId,
          year,
          annualTotal: 12,
          annualUsed: 0,
          sickTotal: 14,
          sickUsed: 0,
          emergencyTotal: 3,
          emergencyUsed: 0,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: quota
    })
  } catch (error) {
    console.error('Error fetching leave quota:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
