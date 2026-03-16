import { NextRequest, NextResponse } from 'next/server'
import { validateSession, sanitizeUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada session', user: null },
        { status: 401 }
      )
    }

    const result = await validateSession(token)

    if (!result.valid || !result.user) {
      return NextResponse.json(
        { success: false, message: 'Session tidak valid', user: null },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session valid',
      user: sanitizeUser(result.user),
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server', user: null },
      { status: 500 }
    )
  }
}
