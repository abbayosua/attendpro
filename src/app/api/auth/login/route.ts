import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password diperlukan' },
        { status: 400 }
      )
    }

    const { supabase, response } = createSupabaseReqResClient(request)

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Login gagal' },
        { status: 401 }
      )
    }

    // Find user in our database
    let user = await db.user.findUnique({
      where: { authId: authData.user.id },
      include: {
        organization: true,
        department: true,
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // If not found by authId, try by email (for existing users)
    if (!user) {
      user = await db.user.findUnique({
        where: { email: authData.user.email },
        include: {
          organization: true,
          department: true,
          manager: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Link the authId to the existing user
      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: { authId: authData.user.id },
          include: {
            organization: true,
            department: true,
            manager: {
              select: { id: true, name: true, email: true }
            }
          }
        })
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan di sistem. Hubungi administrator.' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Akun Anda tidak aktif. Hubungi administrator.' },
        { status: 403 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Return user data
    const { password: _, ...safeUser } = user

    const jsonResponse = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: safeUser,
      // Return the access token for cross-origin/iframe usage
      accessToken: authData.session.access_token,
    })

    // Copy cookies from supabase response to json response
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none',
        secure: cookie.secure
      })
    })

    return jsonResponse
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
