'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStore } from '@/store'

export function DashboardContent() {
  const currentUser = useStore((state) => state.currentUser)
  const fetchReport = useStore((state) => state.fetchReport)
  const fetchAttendanceHistory = useStore((state) => state.fetchAttendanceHistory)
  
  const [stats, setStats] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [reportData, historyData] = await Promise.all([
          fetchReport('overview'),
          fetchAttendanceHistory({})
        ])
        setStats(reportData)
        setAttendanceHistory(historyData || [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [fetchReport, fetchAttendanceHistory])

  if (!currentUser) return null

  const statCards = [
    {
      title: 'Total Karyawan',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Hadir Hari Ini',
      value: stats?.presentToday || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Terlambat',
      value: stats?.lateToday || 0,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Cuti Pending',
      value: stats?.pendingLeaves || 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Selamat Datang, {currentUser.name.split(' ')[0]}! 👋
                </h2>
                <p className="opacity-90">
                  {currentUser.department?.name ? `Departemen ${currentUser.department.name}` : 'Belum ada departemen'}
                  {currentUser.position ? ` • ${currentUser.position}` : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Login sebagai</div>
                <div className="font-semibold capitalize">{currentUser.role.toLowerCase().replace('_', ' ')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      {['ADMIN', 'HR', 'MANAGER'].includes(currentUser.role) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{loading ? '-' : stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Attendance Chart for Managers */}
      {['ADMIN', 'HR', 'MANAGER'].includes(currentUser.role) && stats?.departmentStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kehadiran per Departemen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.departmentStats.map((dept: any) => (
                  <div key={dept.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {dept.present}/{dept.total}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{dept.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={dept.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Attendance History for Employee */}
      {currentUser.role === 'EMPLOYEE' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kehadiran Anda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Tanggal</th>
                      <th className="text-left p-3 text-sm font-medium">Clock In</th>
                      <th className="text-left p-3 text-sm font-medium">Clock Out</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Belum ada riwayat kehadiran
                        </td>
                      </tr>
                    ) : (
                      attendanceHistory.slice(0, 10).map((attendance: any) => (
                        <tr key={attendance.id} className="hover:bg-muted/30">
                          <td className="p-3 text-sm">{new Date(attendance.date).toLocaleDateString('id-ID')}</td>
                          <td className="p-3 text-sm">
                            {attendance.clockIn ? new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3 text-sm">
                            {attendance.clockOut ? new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3">
                            <Badge variant={attendance.status === 'PRESENT' ? 'default' : attendance.status === 'LATE' ? 'destructive' : 'secondary'}>
                              {attendance.status === 'PRESENT' ? 'Hadir' : attendance.status === 'LATE' ? 'Terlambat' : attendance.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
