import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseReqResClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// Euclidean distance between two vectors
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2)
  }
  return Math.sqrt(sum)
}

// Convert distance to similarity score (0-1)
function distanceToScore(distance: number, maxDistance: number = 1.0): number {
  return Math.max(0, 1 - (distance / maxDistance))
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createSupabaseReqResClient(request)

    // Get current user from Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada session aktif', verified: false },
        { status: 401 }
      )
    }

    // Get user from our database with stored face embedding
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        faceRegistered: true,
        faceEmbedding: true,
        organization: {
          select: {
            id: true,
            settings: {
              select: {
                requireFaceRecognition: true,
                faceMatchThreshold: true,
                livenessScoreThreshold: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan', verified: false },
        { status: 404 }
      )
    }

    if (!user.faceRegistered || !user.faceEmbedding) {
      return NextResponse.json(
        { success: false, message: 'Wajah belum terdaftar. Silakan daftarkan wajah terlebih dahulu.', verified: false },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { embedding, livenessScore, livenessChallenge } = body

    // Validate embedding (should be 128 numbers)
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        { success: false, message: 'Face embedding tidak valid.', verified: false },
        { status: 400 }
      )
    }

    // Get settings
    const settings = user.organization?.settings
    const matchThreshold = settings?.faceMatchThreshold || 0.6
    const livenessThreshold = settings?.livenessScoreThreshold || 0.7

    // Check liveness score
    if (livenessScore !== undefined && livenessScore < livenessThreshold) {
      return NextResponse.json({
        success: false,
        message: `Liveness score terlalu rendah (${(livenessScore * 100).toFixed(0)}% < ${(livenessThreshold * 100).toFixed(0)}%)`,
        verified: false,
        livenessScore,
        livenessPassed: false,
      })
    }

    // Parse stored embedding
    const storedEmbedding: number[] = JSON.parse(user.faceEmbedding)

    // Calculate similarity
    const distance = euclideanDistance(embedding, storedEmbedding)
    const matchScore = distanceToScore(distance)

    // Check if match meets threshold
    const isMatch = matchScore >= matchThreshold

    if (!isMatch) {
      return NextResponse.json({
        success: false,
        message: `Wajah tidak cocok (${(matchScore * 100).toFixed(0)}% < ${(matchThreshold * 100).toFixed(0)}%)`,
        verified: false,
        matchScore,
        matchPassed: false,
        livenessScore,
        livenessPassed: livenessScore === undefined || livenessScore >= livenessThreshold,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Verifikasi wajah berhasil',
      verified: true,
      matchScore,
      livenessScore,
      livenessChallenge,
      matchPassed: true,
      livenessPassed: livenessScore === undefined || livenessScore >= livenessThreshold,
    })
  } catch (error) {
    console.error('Face verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memverifikasi wajah', verified: false },
      { status: 500 }
    )
  }
}
