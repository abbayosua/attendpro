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
        { success: false, message: 'Tidak ada session aktif', registered: false },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        faceRegistered: true,
        faceRegisteredAt: true,
        facePhotoUrl: true,
        organization: {
          select: {
            id: true,
            name: true,
            settings: {
              select: {
                requireFaceRecognition: true,
                requireLivenessDetection: true,
                faceMatchThreshold: true,
                livenessScoreThreshold: true,
                allowSelfFaceRegistration: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan', registered: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      registered: user.faceRegistered,
      registeredAt: user.faceRegisteredAt,
      photoUrl: user.facePhotoUrl,
      settings: user.organization?.settings || {
        requireFaceRecognition: false,
        requireLivenessDetection: true,
        faceMatchThreshold: 0.6,
        livenessScoreThreshold: 0.7,
        allowSelfFaceRegistration: true,
      },
    })
  } catch (error) {
    console.error('Face status error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil status wajah', registered: false },
      { status: 500 }
    )
  }
}
