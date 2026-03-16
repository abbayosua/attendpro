import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-helpers'

// GET /api/settings - Get organization settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    // Get user with organization
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          include: { settings: true }
        }
      }
    })

    if (!dbUser || !dbUser.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org = dbUser.organization

    // Get or create settings
    let settings = org.settings
    if (!settings) {
      settings = await db.settings.create({
        data: {
          organizationId: org.id,
        }
      })
    }

    // Return combined settings from Organization and Settings model
    return NextResponse.json({
      // Work hours from Organization
      workStartTime: org.workStartTime,
      workEndTime: org.workEndTime,
      breakStartTime: org.breakStartTime,
      breakEndTime: org.breakEndTime,
      lateTolerance: org.lateTolerance,
      
      // Notifications from Settings
      notifyClockIn: settings.notifyClockIn,
      notifyClockOut: settings.notifyClockOut,
      notifyLate: settings.notifyLate,
      notifyLeave: settings.notifyLeave,
      
      // Security from Settings
      requireGps: settings.requireGps,
      requirePhoto: settings.requirePhoto,
      gpsRadius: settings.gpsRadius,
      
      // Location from Settings
      officeLatitude: settings.officeLatitude,
      officeLongitude: settings.officeLongitude,
      officeAddress: settings.officeAddress,
      
      // Organization info
      orgName: org.name,
      orgAddress: org.address,
      orgPhone: org.phone,
      orgEmail: org.email,
      orgLogo: org.logo,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/settings - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthUser(request)
    if (!authResult.success || !authResult.user) {
      return unauthorizedResponse(authResult.error)
    }
    const user = authResult.user

    // Check if user is admin
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { organization: { include: { settings: true } } }
    })

    if (!dbUser || !dbUser.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const orgId = dbUser.organization.id

    // Update Organization fields
    const orgUpdateData: any = {}
    if (body.workStartTime !== undefined) orgUpdateData.workStartTime = body.workStartTime
    if (body.workEndTime !== undefined) orgUpdateData.workEndTime = body.workEndTime
    if (body.breakStartTime !== undefined) orgUpdateData.breakStartTime = body.breakStartTime
    if (body.breakEndTime !== undefined) orgUpdateData.breakEndTime = body.breakEndTime
    if (body.lateTolerance !== undefined) orgUpdateData.lateTolerance = parseInt(body.lateTolerance)
    if (body.orgName !== undefined) orgUpdateData.name = body.orgName
    if (body.orgAddress !== undefined) orgUpdateData.address = body.orgAddress
    if (body.orgPhone !== undefined) orgUpdateData.phone = body.orgPhone
    if (body.orgEmail !== undefined) orgUpdateData.email = body.orgEmail

    // Update Organization
    if (Object.keys(orgUpdateData).length > 0) {
      await db.organization.update({
        where: { id: orgId },
        data: orgUpdateData
      })
    }

    // Update Settings fields
    const settingsUpdateData: any = {}
    if (body.notifyClockIn !== undefined) settingsUpdateData.notifyClockIn = body.notifyClockIn
    if (body.notifyClockOut !== undefined) settingsUpdateData.notifyClockOut = body.notifyClockOut
    if (body.notifyLate !== undefined) settingsUpdateData.notifyLate = body.notifyLate
    if (body.notifyLeave !== undefined) settingsUpdateData.notifyLeave = body.notifyLeave
    if (body.requireGps !== undefined) settingsUpdateData.requireGps = body.requireGps
    if (body.requirePhoto !== undefined) settingsUpdateData.requirePhoto = body.requirePhoto
    if (body.gpsRadius !== undefined) settingsUpdateData.gpsRadius = parseInt(body.gpsRadius)
    if (body.officeLatitude !== undefined) settingsUpdateData.officeLatitude = parseFloat(body.officeLatitude)
    if (body.officeLongitude !== undefined) settingsUpdateData.officeLongitude = parseFloat(body.officeLongitude)
    if (body.officeAddress !== undefined) settingsUpdateData.officeAddress = body.officeAddress

    // Get or create settings, then update
    let settings = dbUser.organization.settings
    if (!settings) {
      settings = await db.settings.create({
        data: {
          organizationId: orgId,
          ...settingsUpdateData
        }
      })
    } else if (Object.keys(settingsUpdateData).length > 0) {
      await db.settings.update({
        where: { id: settings.id },
        data: settingsUpdateData
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pengaturan berhasil disimpan' 
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
