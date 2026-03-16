import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createSupabaseReqResClient(request)

    // Get current user from Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada session', user: null },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: {
        organization: true,
        department: true,
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan', user: null },
        { status: 404 }
      )
    }

    const { password: _, ...safeUser } = user

    return NextResponse.json({
      success: true,
      message: 'Session valid',
      user: safeUser,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server', user: null },
      { status: 500 }
    )
  }
}
