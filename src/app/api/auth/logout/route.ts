import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { supabase, response } = createSupabaseReqResClient(request)

    // Sign out from Supabase Auth
    await supabase.auth.signOut()

    const jsonResponse = NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    })

    // Clear cookies
    jsonResponse.cookies.delete('auth-token')
    response?.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.delete(cookie.name)
    })

    return jsonResponse
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
