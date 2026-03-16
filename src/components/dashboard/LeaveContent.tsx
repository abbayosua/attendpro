'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus, CheckCircle, XCircle, Clock as ClockIcon, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'

export function LeaveContent() {
  const currentUser = useStore((state) => state.currentUser)
  const fetchLeaveRequests = useStore((state) => state.fetchLeaveRequests)
  const createLeaveRequest = useStore((state) => state.createLeaveRequest)
  const approveLeaveRequest = useStore((state) => state.approveLeaveRequest)
  const rejectLeaveRequest = useStore((state) => state.rejectLeaveRequest)
  
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [leaveQuota, setLeaveQuota] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [myRequests, pending, quotaResponse] = await Promise.all([
          fetchLeaveRequests({}),
          ['ADMIN', 'HR', 'MANAGER'].includes(currentUser?.role || '') 
            ? fetchLeaveRequests({ pending: true })
            : Promise.resolve([]),
          fetch('/api/leave/quota').then(r => r.json())
        ])
        setLeaveRequests(myRequests)
        setPendingRequests(pending)
        if (quotaResponse.success) {
          setLeaveQuota(quotaResponse.data)
        }
      } catch (error) {
        console.error('Error loading leave requests:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser) loadData()
  }, [currentUser, fetchLeaveRequests])

  if (!currentUser) return null

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast({ title: 'Error', description: 'Mohon lengkapi semua field', variant: 'destructive' })
      return
    }

    const result = await createLeaveRequest(formData)
    if (result.success) {
      toast({ title: 'Berhasil', description: result.message })
      setIsDialogOpen(false)
      setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
      const myRequests = await fetchLeaveRequests({})
      setLeaveRequests(myRequests)
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
  }

  const handleApprove = async (id: string) => {
    const result = await approveLeaveRequest(id)
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Cuti disetujui' })
      const [myRequests, pending] = await Promise.all([
        fetchLeaveRequests({}),
        fetchLeaveRequests({ pending: true })
      ])
      setLeaveRequests(myRequests)
      setPendingRequests(pending)
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
  }

  const handleReject = async (id: string) => {
    const result = await rejectLeaveRequest(id)
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Cuti ditolak' })
      const [myRequests, pending] = await Promise.all([
        fetchLeaveRequests({}),
        fetchLeaveRequests({ pending: true })
      ])
      setLeaveRequests(myRequests)
      setPendingRequests(pending)
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
  }

  const getLeaveTypeName = (type: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Disetujui</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Dibatalkan</Badge>
      default:
        return <Badge variant="outline"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Cuti</h1>
          <p className="text-muted-foreground">Ajukan dan kelola cuti Anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajukan Cuti
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajukan Cuti</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Jenis Cuti</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Cuti Tahunan</SelectItem>
                    <SelectItem value="SICK">Cuti Sakit</SelectItem>
                    <SelectItem value="EMERGENCY">Cuti Darurat</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alasan</Label>
                <Textarea
                  placeholder="Jelaskan alasan cuti Anda..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Ajukan Cuti
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Quota Cards */}
      {leaveQuota && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <Badge variant="outline" className="text-blue-500">
                  {leaveQuota.annualTotal - leaveQuota.annualUsed} tersisa
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Cuti Tahunan</p>
              <p className="text-2xl font-bold">{leaveQuota.annualUsed}/{leaveQuota.annualTotal} hari</p>
              <Progress 
                value={(leaveQuota.annualUsed / leaveQuota.annualTotal) * 100} 
                className="h-2 mt-3"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <Badge variant="outline" className="text-red-500">
                  {leaveQuota.sickTotal - leaveQuota.sickUsed} tersisa
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Cuti Sakit</p>
              <p className="text-2xl font-bold">{leaveQuota.sickUsed}/{leaveQuota.sickTotal} hari</p>
              <Progress 
                value={(leaveQuota.sickUsed / leaveQuota.sickTotal) * 100} 
                className="h-2 mt-3"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-orange-500">
                  {leaveQuota.emergencyTotal - leaveQuota.emergencyUsed} tersisa
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Cuti Darurat</p>
              <p className="text-2xl font-bold">{leaveQuota.emergencyUsed}/{leaveQuota.emergencyTotal} hari</p>
              <Progress 
                value={(leaveQuota.emergencyUsed / leaveQuota.emergencyTotal) * 100} 
                className="h-2 mt-3"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Approvals for Managers */}
      {['ADMIN', 'HR', 'MANAGER'].includes(currentUser.role) && pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Menunggu Persetujuan ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-500/10 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium">{request.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {getLeaveTypeName(request.type)} • {request.startDate} - {request.endDate}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(request.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Setujui
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Leave History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengajuan Cuti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Jenis</th>
                      <th className="text-left p-3 text-sm font-medium">Tanggal</th>
                      <th className="text-left p-3 text-sm font-medium">Durasi</th>
                      <th className="text-left p-3 text-sm font-medium">Alasan</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Belum ada pengajuan cuti
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-muted/30">
                          <td className="p-3 text-sm">{getLeaveTypeName(request.type)}</td>
                          <td className="p-3 text-sm">{request.startDate} - {request.endDate}</td>
                          <td className="p-3 text-sm">{request.totalDays} hari</td>
                          <td className="p-3 text-sm max-w-[200px] truncate">{request.reason}</td>
                          <td className="p-3">{getStatusBadge(request.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
