import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, canManageUser } from '@/lib/auth'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

// GET - Get employees
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as Role | null
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    // Build query
    const where: any = {
      organizationId: user.organizationId,
      isActive: true,
    }

    // Exclude own account from list
    where.NOT = { id: user.id }

    if (role) where.role = role
    if (departmentId) where.departmentId = departmentId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const employees = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        phone: true,
        avatar: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        joinDate: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: employees,
    })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create employee
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
    const { 
      email, 
      password, 
      name, 
      role, 
      departmentId, 
      position, 
      phone, 
      managerId,
      employeeId,
      joinDate 
    } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existing = await db.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if can manage this role
    const targetRole = role as Role || 'EMPLOYEE'
    if (!canManageUser(user.role, targetRole)) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat membuat user dengan role tersebut' },
        { status: 403 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: targetRole,
        organizationId: user.organizationId,
        departmentId,
        position,
        phone,
        managerId,
        employeeId,
        joinDate: joinDate ? new Date(joinDate) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        department: { select: { id: true, name: true } },
      }
    })

    // Create leave quota for current year
    const year = new Date().getFullYear()
    await db.leaveQuota.create({
      data: {
        userId: newUser.id,
        year,
        annualTotal: 12,
        annualUsed: 0,
        sickTotal: 14,
        sickUsed: 0,
        emergencyTotal: 3,
        emergencyUsed: 0,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      data: newUser,
    })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update employee
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak ditemukan' },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check permission
    const isSelf = user.id === id
    const isAdmin = ['ADMIN', 'HR'].includes(user.role)

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki izin' },
        { status: 403 }
      )
    }

    // If changing role, check if can manage
    if (updateData.role && !canManageUser(user.role, updateData.role as Role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat mengubah ke role tersebut' },
        { status: 403 }
      )
    }

    // Build update data
    const data: any = {}
    const allowedFields = ['name', 'phone', 'avatar', 'position', 'departmentId', 'managerId', 'role', 'isActive']
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    // Only admin can change some fields
    if (!isAdmin) {
      delete data.role
      delete data.isActive
      delete data.departmentId
      delete data.managerId
    }

    // Password update
    if (updateData.password) {
      data.password = await hashPassword(updateData.password)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        phone: true,
        avatar: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diperbarui',
      data: updatedUser,
    })
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate employee
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

    // Cannot delete self
    if (id === user.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check role permission
    if (!canManageUser(user.role, targetUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menghapus user dengan role tersebut' },
        { status: 403 }
      )
    }

    // Soft delete - set isActive to false
    await db.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Delete all sessions
    await db.session.deleteMany({
      where: { userId: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil dinonaktifkan',
    })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
