'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'

export function DepartmentsContent() {
  const currentUser = useStore((state) => state.currentUser)
  const fetchDepartments = useStore((state) => state.fetchDepartments)
  const createDepartment = useStore((state) => state.createDepartment)
  const updateDepartment = useStore((state) => state.updateDepartment)
  const deleteDepartment = useStore((state) => state.deleteDepartment)
  const fetchEmployees = useStore((state) => state.fetchEmployees)
  
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [deptData, empData] = await Promise.all([
          fetchDepartments(),
          fetchEmployees({})
        ])
        setDepartments(deptData)
        // Only show managers (MANAGER role) as options
        setEmployees(empData.filter((e: any) => e.role === 'MANAGER' || e.role === 'ADMIN'))
      } catch (error) {
        console.error('Error loading departments:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser) loadData()
  }, [currentUser, fetchDepartments, fetchEmployees])

  if (!currentUser) return null

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Nama departemen diperlukan', variant: 'destructive' })
      return
    }

    const result = editingDepartment
      ? await updateDepartment(editingDepartment.id, formData)
      : await createDepartment(formData)

    if (result.success) {
      toast({ title: 'Berhasil', description: result.message })
      setIsDialogOpen(false)
      setEditingDepartment(null)
      setFormData({ name: '', description: '', managerId: '' })
      const deptData = await fetchDepartments()
      setDepartments(deptData)
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
  }

  const handleEdit = (department: any) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      managerId: department.manager?.id || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus departemen ini?')) return
    
    const result = await deleteDepartment(id)
    if (result.success) {
      toast({ title: 'Berhasil', description: result.message })
      const deptData = await fetchDepartments()
      setDepartments(deptData)
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
  }

  const totalEmployees = departments.reduce((sum, d) => sum + (d.userCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Departemen</h1>
          <p className="text-muted-foreground">Kelola departemen perusahaan</p>
        </div>
        <Button onClick={() => { 
          setEditingDepartment(null)
          setFormData({ name: '', description: '', managerId: '' })
          setIsDialogOpen(true) 
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Departemen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Departemen', value: departments.length, icon: Building2 },
          { label: 'Total Karyawan', value: totalEmployees, icon: Users },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari departemen..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Department List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Departemen ({filteredDepartments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Departemen</th>
                    <th className="text-left p-3 text-sm font-medium">Manager</th>
                    <th className="text-center p-3 text-sm font-medium">Karyawan</th>
                    <th className="text-right p-3 text-sm font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        {searchQuery ? 'Tidak ada departemen ditemukan' : 'Belum ada departemen'}
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((department) => (
                      <tr key={department.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{department.name}</p>
                              {department.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {department.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {department.manager ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {department.manager.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{department.manager.name}</p>
                                <p className="text-xs text-muted-foreground">{department.manager.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {department.userCount || 0}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(department)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(department.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingDepartment(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Departemen' : 'Tambah Departemen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nama Departemen *</Label>
              <Input
                placeholder="Contoh: Engineering"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi singkat departemen..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Manager Departemen</Label>
              <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value === 'none' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Manager</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSubmit}>
              {editingDepartment ? 'Simpan Perubahan' : 'Tambah Departemen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
