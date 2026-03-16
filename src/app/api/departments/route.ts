import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

// GET - Get departments
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const departments = await db.department.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: departments.map(d => ({
        ...d,
        userCount: d._count.users,
      })),
    })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create department
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    // Check permission
    if (!['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, managerId } = body

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Nama departemen diperlukan' },
        { status: 400 }
      )
    }

    // Check if department name exists
    const existing = await db.department.findFirst({
      where: {
        organizationId: user.organizationId,
        name,
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Nama departemen sudah ada' },
        { status: 400 }
      )
    }

    const department = await db.department.create({
      data: {
        name,
        description,
        managerId,
        organizationId: user.organizationId,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Departemen berhasil dibuat',
      data: department,
    })
  } catch (error) {
    console.error('Create department error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update department
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    // Check permission
    if (!['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, description, managerId } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak ditemukan' },
        { status: 400 }
      )
    }

    // Check if department name exists (excluding current)
    if (name) {
      const existing = await db.department.findFirst({
        where: {
          organizationId: user.organizationId,
          name,
          NOT: { id }
        }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Nama departemen sudah ada' },
          { status: 400 }
        )
      }
    }

    const department = await db.department.update({
      where: { id },
      data: {
        name,
        description,
        managerId,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Departemen berhasil diperbarui',
      data: department,
    })
  } catch (error) {
    console.error('Update department error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete department
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    // Check permission
    if (!['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak ditemukan' },
        { status: 400 }
      )
    }

    // Check if department has users
    const usersCount = await db.user.count({
      where: { departmentId: id }
    })

    if (usersCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Departemen tidak dapat dihapus karena masih memiliki karyawan' },
        { status: 400 }
      )
    }

    await db.department.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Departemen berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete department error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
