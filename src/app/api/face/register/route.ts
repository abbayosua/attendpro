import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createSupabaseReqResClient(request)

    // Get current user from Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada session aktif' },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: {
        organization: {
          include: { settings: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { embedding, photoUrl } = body

    // Validate embedding (should be 128 numbers)
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { success: false, message: 'Face embedding tidak valid. Harus berisi 128 angka.' },
        { status: 400 }
      )
    }

    // Validate all values are numbers
    if (!embedding.every((v) => typeof v === 'number' && !isNaN(v))) {
      return NextResponse.json(
        { success: false, message: 'Face embedding mengandung nilai yang tidak valid.' },
        { status: 400 }
      )
    }

    // Check if self-registration is allowed
    const settings = user.organization?.settings
    if (settings && !settings.allowSelfFaceRegistration && user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { success: false, message: 'Pendaftaran wajah mandiri tidak diizinkan. Hubungi administrator.' },
        { status: 403 }
      )
    }

    // Store embedding as JSON string
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        faceRegistered: true,
        faceEmbedding: JSON.stringify(embedding),
        faceRegisteredAt: new Date(),
        facePhotoUrl: photoUrl || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Wajah berhasil didaftarkan',
      registeredAt: updatedUser.faceRegisteredAt,
    })
  } catch (error) {
    console.error('Face registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan wajah. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}

// Delete face registration
export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = createSupabaseReqResClient(request)

    // Get current user from Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada session aktif' },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Remove face registration
    await db.user.update({
      where: { id: user.id },
      data: {
        faceRegistered: false,
        faceEmbedding: null,
        faceRegisteredAt: null,
        facePhotoUrl: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Data wajah berhasil dihapus',
    })
  } catch (error) {
    console.error('Face deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus data wajah' },
      { status: 500 }
    )
  }
}
