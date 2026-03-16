import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { LeaveStatus, LeaveType } from '@prisma/client'

// GET - Get leave requests
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const result = await validateSession(token)
    if (!result.valid || !result.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as LeaveStatus | null
    const userId = searchParams.get('userId')
    const pending = searchParams.get('pending') === 'true'

    // Build query
    const where: any = {}

    // Role-based access
    if (result.user.role === 'EMPLOYEE') {
      where.userId = result.user.id
    } else if (pending) {
      // Get pending requests for approval
      where.status = LeaveStatus.PENDING
      
      // Manager can only see their team's requests
      if (result.user.role === 'MANAGER') {
        where.user = { managerId: result.user.id }
      }
    } else {
      if (userId) where.userId = userId
      if (status) where.status = status
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: { select: { id: true, name: true } }
          }
        },
        approver: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: leaveRequests,
    })
  } catch (error) {
    console.error('Get leave requests error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create leave request
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const result = await validateSession(token)
    if (!result.valid || !result.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, startDate, endDate, reason, attachment } = body

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Calculate total days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const leaveRequest = await db.leaveRequest.create({
      data: {
        userId: result.user.id,
        type: type as LeaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        attachment,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pengajuan cuti berhasil dibuat',
      data: leaveRequest,
    })
  } catch (error) {
    console.error('Create leave request error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Approve/Reject leave request
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const result = await validateSession(token)
    if (!result.valid || !result.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!['ADMIN', 'HR', 'MANAGER'].includes(result.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, action, rejectedReason } = body

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // Manager can only approve their team
    if (result.user.role === 'MANAGER' && leaveRequest.user.managerId !== result.user.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin untuk pengajuan ini' },
        { status: 403 }
      )
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan cuti sudah diproses' },
        { status: 400 }
      )
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        approvedById: result.user.id,
        approvedAt: new Date(),
        rejectedReason: action === 'reject' ? rejectedReason : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update leave quota if approved
    if (action === 'approve') {
      const year = new Date().getFullYear()
      const quota = await db.leaveQuota.findUnique({
        where: {
          userId_year: {
            userId: leaveRequest.userId,
            year
          }
        }
      })

      if (quota) {
        const field = leaveRequest.type === 'ANNUAL' ? 'annualUsed' :
                      leaveRequest.type === 'SICK' ? 'sickUsed' :
                      'emergencyUsed'
        
        await db.leaveQuota.update({
          where: { id: quota.id },
          data: {
            [field]: { increment: leaveRequest.totalDays }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Cuti disetujui' : 'Cuti ditolak',
      data: updated,
    })
  } catch (error) {
    console.error('Update leave request error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel leave request
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const result = await validateSession(token)
    if (!result.valid || !result.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak ditemukan' },
        { status: 400 }
      )
    }

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id }
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only owner can cancel and only if pending
    if (leaveRequest.userId !== result.user.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { success: false, message: 'Hanya pengajuan pending yang dapat dibatalkan' },
        { status: 400 }
      )
    }

    await db.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED }
    })

    return NextResponse.json({
      success: true,
      message: 'Pengajuan cuti dibatalkan',
    })
  } catch (error) {
    console.error('Delete leave request error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
