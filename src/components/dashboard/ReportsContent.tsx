'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, Calendar, Users, TrendingUp, TrendingDown, Loader2, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'

export function ReportsContent() {
  const currentUser = useStore((state) => state.currentUser)
  const fetchReport = useStore((state) => state.fetchReport)
  const fetchDepartments = useStore((state) => state.fetchDepartments)
  
  const [overview, setOverview] = useState<any>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [overviewData, weeklyData, deptData] = await Promise.all([
          fetchReport('overview', { departmentId: selectedDept === 'all' ? undefined : selectedDept }),
          fetchReport('weekly', { departmentId: selectedDept === 'all' ? undefined : selectedDept }),
          fetchDepartments()
        ])
        setOverview(overviewData)
        setWeeklyData(weeklyData || [])
        setDepartments(deptData)
      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser) loadData()
  }, [currentUser, fetchReport, fetchDepartments, selectedDept])

  if (!currentUser) return null

  const handleExport = async (type: 'attendance' | 'leave' | 'employees') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ type })
      if (selectedDept !== 'all') {
        params.set('departmentId', selectedDept)
      }
      
      // Get current month date range
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      params.set('startDate', firstDay.toISOString().split('T')[0])
      params.set('endDate', lastDay.toISOString().split('T')[0])
      
      // Make request and download file
      const response = await fetch(`/api/reports/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `laporan-${type}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: 'Berhasil', description: 'Laporan berhasil diunduh' })
    } catch (error) {
      toast({ title: 'Gagal', description: 'Gagal mengekspor laporan', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const stats = [
    {
      title: 'Hadir Hari Ini',
      value: overview?.presentToday || 0,
      total: overview?.totalEmployees || 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
    },
    {
      title: 'Terlambat',
      value: overview?.lateToday || 0,
      icon: Calendar,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      trend: '-3',
    },
    {
      title: 'Cuti',
      value: overview?.onLeaveToday || 0,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Tidak Hadir',
      value: overview?.absentToday || 0,
      icon: Users,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Analisis kehadiran dan performa karyawan</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Dept" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('attendance')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Kehadiran
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('leave')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Cuti
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('employees')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Karyawan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      {stat.total && (
                        <p className="text-xs text-muted-foreground mt-1">dari {stat.total} karyawan</p>
                      )}
                      {stat.trend && (
                        <p className={`text-xs mt-1 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {stat.trend} dari kemarin
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Kehadiran Mingguan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {weeklyData.map((day, index) => {
                    const total = overview?.totalEmployees || 50
                    const percentage = Math.round((day.present / total) * 100)
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{day.day}</span>
                          <span className="text-muted-foreground">
                            {day.present} hadir, {day.late} terlambat
                          </span>
                        </div>
                        <div className="flex gap-1 h-4">
                          <div 
                            className="bg-green-500 rounded-l"
                            style={{ width: `${(day.present / total) * 100}%` }}
                          />
                          <div 
                            className="bg-yellow-500"
                            style={{ width: `${(day.late / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm text-muted-foreground">Hadir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span className="text-sm text-muted-foreground">Terlambat</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Kehadiran per Departemen</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {overview?.departmentStats?.map((dept: any) => (
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
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground">Tingkat Kehadiran Hari Ini</p>
                <p className="text-4xl font-bold text-green-500">{overview?.attendanceRate || 0}%</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{overview?.presentToday || 0}</p>
                  <p className="text-sm text-muted-foreground">Hadir</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{overview?.onLeaveToday || 0}</p>
                  <p className="text-sm text-muted-foreground">Cuti</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{overview?.absentToday || 0}</p>
                  <p className="text-sm text-muted-foreground">Absen</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
