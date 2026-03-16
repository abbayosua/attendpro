import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'

// GET /api/reports/export - Export attendance report to Excel
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'attendance'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')

    // Get user with organization
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { organization: true }
    })

    if (!dbUser || !dbUser.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = user.organizationId

    // Build date filter
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate)
      dateFilter.lte = new Date(endDate)
    } else {
      // Default to current month
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      dateFilter.gte = firstDay
      dateFilter.lte = lastDay
    }

    if (type === 'attendance') {
      // Fetch attendance data
      const attendances = await db.attendance.findMany({
        where: {
          date: dateFilter,
          user: {
            organizationId: orgId,
            ...(departmentId && { departmentId })
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              position: true,
              department: { select: { name: true } }
            }
          }
        },
        orderBy: [{ date: 'desc' }, { user: { name: 'asc' } }]
      })

      // Prepare data for Excel
      const data = attendances.map((a, index) => ({
        'No': index + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Nama': a.user.name,
        'Email': a.user.email,
        'Jabatan': a.user.position || '-',
        'Departemen': a.user.department?.name || '-',
        'Clock In': a.clockIn ? new Date(a.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Clock Out': a.clockOut ? new Date(a.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Jam Kerja': a.workHours ? a.workHours.toFixed(2) : '-',
        'Status': a.status === 'PRESENT' ? 'Hadir' : a.status === 'LATE' ? 'Terlambat' : a.status,
        'Lokasi Clock In': a.clockInLat && a.clockInLng 
          ? `${a.clockInLat.toFixed(6)}, ${a.clockInLng.toFixed(6)}` 
          : '-',
        'Lokasi Clock Out': a.clockOutLat && a.clockOutLng 
          ? `${a.clockOutLat.toFixed(6)}, ${a.clockOutLng.toFixed(6)}` 
          : '-',
      }))

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 12 },  // Tanggal
        { wch: 25 },  // Nama
        { wch: 30 },  // Email
        { wch: 20 },  // Jabatan
        { wch: 15 },  // Departemen
        { wch: 10 },  // Clock In
        { wch: 10 },  // Clock Out
        { wch: 10 },  // Jam Kerja
        { wch: 12 },  // Status
        { wch: 25 },  // Lokasi Clock In
        { wch: 25 },  // Lokasi Clock Out
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran')

      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Return as file download
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan-kehadiran-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else if (type === 'leave') {
      // Fetch leave requests
      const leaveRequests = await db.leaveRequest.findMany({
        where: {
          user: {
            organizationId: orgId,
            ...(departmentId && { departmentId })
          },
          ...(startDate && endDate ? {
            OR: [
              { startDate: { gte: new Date(startDate), lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate), lte: new Date(endDate) } }
            ]
          } : {})
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              position: true,
              department: { select: { name: true } }
            }
          },
          approver: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Prepare data for Excel
      const data = leaveRequests.map((l, index) => ({
        'No': index + 1,
        'Nama': l.user.name,
        'Email': l.user.email,
        'Jabatan': l.user.position || '-',
        'Departemen': l.user.department?.name || '-',
        'Jenis Cuti': getLeaveTypeName(l.type),
        'Tanggal Mulai': new Date(l.startDate).toLocaleDateString('id-ID'),
        'Tanggal Selesai': new Date(l.endDate).toLocaleDateString('id-ID'),
        'Durasi (Hari)': l.totalDays,
        'Alasan': l.reason,
        'Status': l.status === 'APPROVED' ? 'Disetujui' : l.status === 'REJECTED' ? 'Ditolak' : 'Pending',
        'Disetujui Oleh': l.approver?.name || '-',
        'Tanggal Pengajuan': new Date(l.createdAt).toLocaleDateString('id-ID'),
      }))

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama
        { wch: 30 },  // Email
        { wch: 20 },  // Jabatan
        { wch: 15 },  // Departemen
        { wch: 15 },  // Jenis Cuti
        { wch: 12 },  // Tanggal Mulai
        { wch: 12 },  // Tanggal Selesai
        { wch: 12 },  // Durasi
        { wch: 30 },  // Alasan
        { wch: 12 },  // Status
        { wch: 20 },  // Disetujui Oleh
        { wch: 15 },  // Tanggal Pengajuan
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Cuti')

      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Return as file download
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan-cuti-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else if (type === 'employees') {
      // Fetch employees
      const employees = await db.user.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          ...(departmentId && { departmentId })
        },
        include: {
          department: { select: { name: true } },
          manager: { select: { name: true } }
        },
        orderBy: { name: 'asc' }
      })

      // Prepare data for Excel
      const data = employees.map((e, index) => ({
        'No': index + 1,
        'Nama': e.name,
        'Email': e.email,
        'Role': getRoleName(e.role),
        'Jabatan': e.position || '-',
        'Departemen': e.department?.name || '-',
        'Manager': e.manager?.name || '-',
        'Tanggal Bergabung': e.joinDate ? new Date(e.joinDate).toLocaleDateString('id-ID') : '-',
        'Status': e.isActive ? 'Aktif' : 'Tidak Aktif',
      }))

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama
        { wch: 30 },  // Email
        { wch: 12 },  // Role
        { wch: 20 },  // Jabatan
        { wch: 15 },  // Departemen
        { wch: 20 },  // Manager
        { wch: 15 },  // Tanggal Bergabung
        { wch: 10 },  // Status
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')

      // Generate buffer
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Return as file download
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="data-karyawan-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getLeaveTypeName(type: string): string {
  const names: Record<string, string> = {
    ANNUAL: 'Cuti Tahunan',
    SICK: 'Cuti Sakit',
    EMERGENCY: 'Cuti Darurat',
    MATERNITY: 'Cuti Melahirkan',
    PATERNITY: 'Cuti Ayah',
    MARRIAGE: 'Cuti Menikah',
    OTHER: 'Lainnya'
  }
  return names[type] || type
}

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    HR: 'HR',
    MANAGER: 'Manager',
    EMPLOYEE: 'Karyawan'
  }
  return names[role] || role
}
