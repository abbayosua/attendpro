import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { AttendanceStatus } from '@prisma/client'

// GET - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query
    const where: any = {}

    // Role-based access
    if (user.role === 'EMPLOYEE') {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Date filter
    if (date) {
      where.date = new Date(date)
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const attendances = await db.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: attendances,
    })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Clock In
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const body = await request.json()
    const { action, latitude, longitude, address, notes, photo } = body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    // Get organization settings for late tolerance
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      include: { settings: true }
    })

    const workStartTime = org?.workStartTime || '09:00'
    const [workHour, workMinute] = workStartTime.split(':').map(Number)
    const workStartMinutes = workHour * 60 + workMinute
    const lateTolerance = org?.lateTolerance || 15

    if (action === 'clockIn') {
      // Check if already clocked in today
      const existing = await db.attendance.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          }
        }
      })

      if (existing && existing.clockIn) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah clock in hari ini' },
          { status: 400 }
        )
      }

      // Determine status
      let status: AttendanceStatus = AttendanceStatus.PRESENT
      if (currentTime > workStartMinutes + lateTolerance) {
        status = AttendanceStatus.LATE
      }

      // Check if holiday
      const holiday = await db.holiday.findFirst({
        where: {
          organizationId: user.organizationId,
          date: today,
        }
      })
      if (holiday) {
        status = AttendanceStatus.HOLIDAY
      }

      const attendance = await db.attendance.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          }
        },
        update: {
          clockIn: now,
          status,
          clockInLat: latitude,
          clockInLng: longitude,
          clockInAddress: address,
          clockInPhoto: photo,
          notes,
        },
        create: {
          userId: user.id,
          date: today,
          clockIn: now,
          status,
          clockInLat: latitude,
          clockInLng: longitude,
          clockInAddress: address,
          clockInPhoto: photo,
          notes,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: status === AttendanceStatus.LATE 
          ? 'Clock in berhasil (Terlambat)' 
          : 'Clock in berhasil',
        data: attendance,
      })
    }

    if (action === 'clockOut') {
      // Check if clocked in today
      const existing = await db.attendance.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          }
        }
      })

      if (!existing || !existing.clockIn) {
        return NextResponse.json(
          { success: false, message: 'Anda belum clock in hari ini' },
          { status: 400 }
        )
      }

      if (existing.clockOut) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah clock out hari ini' },
          { status: 400 }
        )
      }

      // Calculate work hours
      const clockInTime = existing.clockIn
      const workMs = now.getTime() - clockInTime.getTime()
      const workHours = workMs / (1000 * 60 * 60)

      const attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          clockOut: now,
          clockOutLat: latitude,
          clockOutLng: longitude,
          clockOutAddress: address,
          clockOutPhoto: photo,
          workHours,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Clock out berhasil',
        data: attendance,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Action tidak valid' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Attendance action error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
