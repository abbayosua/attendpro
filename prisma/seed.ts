import { PrismaClient, Role, Plan, AttendanceStatus, LeaveType, LeaveStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.leaveQuota.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.settings.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.organization.deleteMany()

  // Create Organization
  console.log('🏢 Creating organization...')
  const organization = await prisma.organization.create({
    data: {
      name: 'PT. AbsenKu Indonesia',
      slug: 'absensiku',
      email: 'info@absensiku.id',
      phone: '(021) 1234-5678',
      address: 'Jl. Sudirman No. 123, Jakarta Selatan',
      plan: Plan.PROFESSIONAL,
      maxUsers: 100,
      workStartTime: '09:00',
      workEndTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      lateTolerance: 15,
    }
  })

  // Create Settings
  await prisma.settings.create({
    data: {
      organizationId: organization.id,
      notifyClockIn: true,
      notifyClockOut: true,
      notifyLate: true,
      notifyLeave: true,
      requireGps: true,
      requirePhoto: false,
      gpsRadius: 100,
      officeLatitude: -6.2088,
      officeLongitude: 106.8456,
      officeAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    }
  })

  // Create Departments
  console.log('📁 Creating departments...')
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Engineering',
        description: 'Tim pengembangan perangkat lunak',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Human Resource',
        description: 'Tim manajemen sumber daya manusia',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Marketing',
        description: 'Tim pemasaran dan promosi',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'Finance',
        description: 'Tim keuangan dan akuntansi',
        organizationId: organization.id,
      }
    }),
    prisma.department.create({
      data: {
        name: 'IT Support',
        description: 'Tim dukungan teknologi informasi',
        organizationId: organization.id,
      }
    }),
  ])

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('demo123', SALT_ROUNDS)

  // Create Users
  console.log('👥 Creating users...')
  
  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@absensi.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      organizationId: organization.id,
      position: 'System Administrator',
      departmentId: departments[4].id, // IT Support
      isActive: true,
    }
  })

  // HR
  const hr = await prisma.user.create({
    data: {
      email: 'hr@absensi.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: Role.HR,
      organizationId: organization.id,
      position: 'HR Manager',
      departmentId: departments[1].id, // HR
      isActive: true,
    }
  })

  // Update HR department manager
  await prisma.department.update({
    where: { id: departments[1].id },
    data: { managerId: hr.id }
  })

  // Engineering Manager
  const engineeringManager = await prisma.user.create({
    data: {
      email: 'manager.engineering@absensi.com',
      password: hashedPassword,
      name: 'Michael Chen',
      role: Role.MANAGER,
      organizationId: organization.id,
      position: 'Engineering Manager',
      departmentId: departments[0].id, // Engineering
      isActive: true,
    }
  })

  // Update Engineering department manager
  await prisma.department.update({
    where: { id: departments[0].id },
    data: { managerId: engineeringManager.id }
  })

  // Marketing Manager
  const marketingManager = await prisma.user.create({
    data: {
      email: 'manager.marketing@absensi.com',
      password: hashedPassword,
      name: 'David Wilson',
      role: Role.MANAGER,
      organizationId: organization.id,
      position: 'Marketing Manager',
      departmentId: departments[2].id, // Marketing
      isActive: true,
    }
  })

  // Update Marketing department manager
  await prisma.department.update({
    where: { id: departments[2].id },
    data: { managerId: marketingManager.id }
  })

  // Employees
  const employees = await Promise.all([
    // Engineering Team
    prisma.user.create({
      data: {
        email: 'john.doe@absensi.com',
        password: hashedPassword,
        name: 'John Doe',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Senior Software Engineer',
        departmentId: departments[0].id,
        managerId: engineeringManager.id,
        isActive: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@absensi.com',
        password: hashedPassword,
        name: 'Jane Smith',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Software Engineer',
        departmentId: departments[0].id,
        managerId: engineeringManager.id,
        isActive: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'budi.santoso@absensi.com',
        password: hashedPassword,
        name: 'Budi Santoso',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Frontend Developer',
        departmentId: departments[0].id,
        managerId: engineeringManager.id,
        isActive: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'dewi.putri@absensi.com',
        password: hashedPassword,
        name: 'Dewi Putri',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Backend Developer',
        departmentId: departments[0].id,
        managerId: engineeringManager.id,
        isActive: true,
      }
    }),
    // Marketing Team
    prisma.user.create({
      data: {
        email: 'ahmad.wijaya@absensi.com',
        password: hashedPassword,
        name: 'Ahmad Wijaya',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Marketing Specialist',
        departmentId: departments[2].id,
        managerId: marketingManager.id,
        isActive: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'siti.rahayu@absensi.com',
        password: hashedPassword,
        name: 'Siti Rahayu',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Content Creator',
        departmentId: departments[2].id,
        managerId: marketingManager.id,
        isActive: true,
      }
    }),
    // HR Team
    prisma.user.create({
      data: {
        email: 'riski.hidayat@absensi.com',
        password: hashedPassword,
        name: 'Riski Hidayat',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'HR Staff',
        departmentId: departments[1].id,
        managerId: hr.id,
        isActive: true,
      }
    }),
    // Finance Team
    prisma.user.create({
      data: {
        email: 'linda.kusuma@absensi.com',
        password: hashedPassword,
        name: 'Linda Kusuma',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'Finance Staff',
        departmentId: departments[3].id,
        isActive: true,
      }
    }),
    // IT Support Team
    prisma.user.create({
      data: {
        email: 'yoga.pratama@absensi.com',
        password: hashedPassword,
        name: 'Yoga Pratama',
        role: Role.EMPLOYEE,
        organizationId: organization.id,
        position: 'IT Support',
        departmentId: departments[4].id,
        isActive: true,
      }
    }),
  ])

  // Create Leave Quotas for all users
  console.log('📊 Creating leave quotas...')
  const year = new Date().getFullYear()
  const allUsers = [admin, hr, engineeringManager, marketingManager, ...employees]
  
  await Promise.all(
    allUsers.map(user =>
      prisma.leaveQuota.create({
        data: {
          userId: user.id,
          year,
          annualTotal: 12,
          annualUsed: 0,
          sickTotal: 14,
          sickUsed: 0,
          emergencyTotal: 3,
          emergencyUsed: 0,
        }
      })
    )
  )

  // Create Holidays
  console.log('🎉 Creating holidays...')
  await Promise.all([
    prisma.holiday.create({
      data: {
        name: 'Tahun Baru',
        date: new Date(`${year}-01-01`),
        isRecurring: true,
        organizationId: organization.id,
      }
    }),
    prisma.holiday.create({
      data: {
        name: 'Hari Kemerdekaan Indonesia',
        date: new Date(`${year}-08-17`),
        isRecurring: true,
        organizationId: organization.id,
      }
    }),
    prisma.holiday.create({
      data: {
        name: 'Hari Natal',
        date: new Date(`${year}-12-25`),
        isRecurring: true,
        organizationId: organization.id,
      }
    }),
    prisma.holiday.create({
      data: {
        name: 'Hari Buruh Internasional',
        date: new Date(`${year}-05-01`),
        isRecurring: true,
        organizationId: organization.id,
      }
    }),
  ])

  // Create sample attendance for today
  console.log('⏰ Creating sample attendance...')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const now = new Date()
  
  for (const user of allUsers) {
    // Random clock in time between 08:00 and 09:30
    const clockInHour = 8 + Math.floor(Math.random() * 2)
    const clockInMinute = Math.floor(Math.random() * 60)
    const clockIn = new Date(today)
    clockIn.setHours(clockInHour, clockInMinute, 0, 0)
    
    // Determine status
    const workStartMinutes = 9 * 60 // 09:00
    const clockInMinutes = clockInHour * 60 + clockInMinute
    const status = clockInMinutes > workStartMinutes + 15 
      ? AttendanceStatus.LATE 
      : AttendanceStatus.PRESENT

    // Some employees have already clocked out
    const hasClockedOut = Math.random() > 0.4
    let clockOut = null
    let workHours = null

    if (hasClockedOut) {
      const clockOutHour = 17 + Math.floor(Math.random() * 2) // 17:00 - 18:59
      const clockOutMinute = Math.floor(Math.random() * 60)
      clockOut = new Date(today)
      clockOut.setHours(clockOutHour, clockOutMinute, 0, 0)
      workHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
    }

    await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        clockIn,
        clockOut,
        status,
        workHours,
        clockInLat: -6.2088 + (Math.random() * 0.01 - 0.005),
        clockInLng: 106.8456 + (Math.random() * 0.01 - 0.005),
        clockInAddress: 'Jakarta, Indonesia',
      }
    })
  }

  // Create sample leave requests
  console.log('🏖️ Creating sample leave requests...')
  await prisma.leaveRequest.create({
    data: {
      userId: employees[0].id, // John Doe
      type: LeaveType.ANNUAL,
      startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      endDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000),
      totalDays: 3,
      reason: 'Cuti tahunan untuk liburan keluarga',
      status: LeaveStatus.PENDING,
    }
  })

  await prisma.leaveRequest.create({
    data: {
      userId: employees[1].id, // Jane Smith
      type: LeaveType.SICK,
      startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      totalDays: 2,
      reason: 'Sakit demam',
      status: LeaveStatus.APPROVED,
      approvedById: hr.id,
      approvedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📋 Demo Accounts (password: demo123):')
  console.log('├── admin@absensi.com (Admin)')
  console.log('├── hr@absensi.com (HR)')
  console.log('├── manager.engineering@absensi.com (Engineering Manager)')
  console.log('├── manager.marketing@absensi.com (Marketing Manager)')
  console.log('├── john.doe@absensi.com (Employee - Engineering)')
  console.log('├── jane.smith@absensi.com (Employee - Engineering)')
  console.log('└── ... and more employees')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
