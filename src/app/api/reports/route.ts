import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttendanceStatus, LeaveStatus } from '@prisma/client'

// GET - Get reports
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
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')

    const orgId = result.user.organizationId

    // Base date range
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)) // First day of month
    const end = endDate ? new Date(endDate) : new Date()

    // Overview statistics
    if (type === 'overview') {
      // Get total employees
      const totalEmployees = await db.user.count({
        where: {
          organizationId: orgId,
          isActive: true,
          role: { not: 'SUPER_ADMIN' },
          ...(departmentId && { departmentId }),
        }
      })

      // Get today's attendance
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayAttendance = await db.attendance.findMany({
        where: {
          date: today,
          user: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId && { departmentId }),
          }
        }
      })

      const presentToday = todayAttendance.filter(a => a.clockIn).length
      const lateToday = todayAttendance.filter(a => a.status === 'LATE').length

      // Get on leave today
      const onLeaveToday = await db.leaveRequest.count({
        where: {
          status: LeaveStatus.APPROVED,
          startDate: { lte: today },
          endDate: { gte: today },
          user: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId && { departmentId }),
          }
        }
      })

      // Get pending leave requests
      const pendingLeaves = await db.leaveRequest.count({
        where: {
          status: LeaveStatus.PENDING,
          user: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId && { departmentId }),
          }
        }
      })

      // Department stats
      const departments = await db.department.findMany({
        where: {
          organizationId: orgId,
          ...(departmentId && { id: departmentId }),
        },
        include: {
          _count: {
            select: { users: true }
          }
        }
      })

      const deptAttendance = await Promise.all(
        departments.map(async (dept) => {
          const deptUsers = await db.user.findMany({
            where: { departmentId: dept.id, isActive: true },
            select: { id: true }
          })
          const userIds = deptUsers.map(u => u.id)

          const attendance = await db.attendance.count({
            where: {
              userId: { in: userIds },
              date: today,
              clockIn: { not: null }
            }
          })

          return {
            id: dept.id,
            name: dept.name,
            total: dept._count.users,
            present: attendance,
            percentage: dept._count.users > 0 
              ? Math.round((attendance / dept._count.users) * 100) 
              : 0
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: {
          totalEmployees,
          presentToday,
          lateToday,
          onLeaveToday,
          pendingLeaves,
          absentToday: totalEmployees - presentToday - onLeaveToday,
          attendanceRate: totalEmployees > 0 
            ? Math.round((presentToday / totalEmployees) * 100) 
            : 0,
          departmentStats: deptAttendance,
        }
      })
    }

    // Weekly report
    if (type === 'weekly') {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
      weekStart.setHours(0, 0, 0, 0)

      const days = []
      for (let i = 0; i < 5; i++) { // Mon-Fri
        const day = new Date(weekStart)
        day.setDate(day.getDate() + i)

        const attendance = await db.attendance.findMany({
          where: {
            date: day,
            user: {
              organizationId: orgId,
              isActive: true,
              ...(departmentId && { departmentId }),
            }
          }
        })

        days.push({
          date: day.toISOString().split('T')[0],
          day: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][i],
          present: attendance.filter(a => a.clockIn).length,
          late: attendance.filter(a => a.status === 'LATE').length,
          absent: 0, // Will be calculated on frontend
        })
      }

      return NextResponse.json({
        success: true,
        data: days,
      })
    }

    // Attendance detail
    if (type === 'attendance') {
      const attendance = await db.attendance.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
          user: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId && { departmentId }),
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              position: true,
              department: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { date: 'desc' },
        take: 500,
      })

      return NextResponse.json({
        success: true,
        data: attendance,
      })
    }

    // Leave summary
    if (type === 'leave') {
      const leaves = await db.leaveRequest.findMany({
        where: {
          user: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId && { departmentId }),
          },
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: { select: { id: true, name: true } }
            }
          },
          approver: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: leaves,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Tipe report tidak valid' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
