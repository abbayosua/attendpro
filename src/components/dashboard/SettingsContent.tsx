'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Clock, Bell, Shield, Globe, Loader2, Save, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useStore, type Settings as SettingsType } from '@/store'
import { toast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'

// Dynamically import MapPicker to avoid SSR issues
const MapPicker = dynamic(
  () => import('@/components/map/MapPicker').then((mod) => mod.MapPicker),
  { ssr: false }
)

const defaultSettings: SettingsType = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  lateTolerance: 15,
  notifyClockIn: true,
  notifyClockOut: true,
  notifyLate: true,
  notifyLeave: true,
  requireGps: true,
  requirePhoto: false,
  gpsRadius: 100,
  officeLatitude: -6.2088,
  officeLongitude: 106.8456,
  officeAddress: 'Jakarta, Indonesia',
  orgName: '',
  orgAddress: '',
  orgPhone: '',
  orgEmail: '',
  orgLogo: null,
}

export function SettingsContent() {
  const currentUser = useStore((state) => state.currentUser)
  const fetchSettings = useStore((state) => state.fetchSettings)
  const updateSettings = useStore((state) => state.updateSettings)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsType>(defaultSettings)

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      const data = await fetchSettings()
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          orgName: data.orgName || currentUser?.organization?.name || '',
        })
      }
      setLoading(false)
    }
    
    if (currentUser) {
      loadSettings()
    }
  }, [currentUser, fetchSettings])

  if (!currentUser) return null

  const handleSave = async () => {
    setSaving(true)
    const result = await updateSettings(settings)
    
    if (result.success) {
      toast({ title: 'Berhasil', description: result.message })
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleOfficeLocationChange = (lat: number, lng: number) => {
    setSettings(prev => ({
      ...prev,
      officeLatitude: lat,
      officeLongitude: lng,
    }))
  }

  const settingSections = [
    {
      icon: Clock,
      title: 'Jam Kerja',
      description: 'Atur jam kerja default untuk seluruh karyawan',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jam Masuk</Label>
              <Input 
                type="time" 
                value={settings.workStartTime}
                onChange={(e) => updateSetting('workStartTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jam Pulang</Label>
              <Input 
                type="time" 
                value={settings.workEndTime}
                onChange={(e) => updateSetting('workEndTime', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Istirahat Mulai</Label>
              <Input 
                type="time" 
                value={settings.breakStartTime}
                onChange={(e) => updateSetting('breakStartTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Istirahat Selesai</Label>
              <Input 
                type="time" 
                value={settings.breakEndTime}
                onChange={(e) => updateSetting('breakEndTime', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Toleransi Keterlambatan (menit)</Label>
            <Input 
              type="number" 
              value={settings.lateTolerance}
              onChange={(e) => updateSetting('lateTolerance', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )
    },
    {
      icon: Bell,
      title: 'Notifikasi',
      description: 'Atur preferensi notifikasi sistem',
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reminder Clock In</p>
              <p className="text-sm text-muted-foreground">Ingatkan karyawan untuk clock in</p>
            </div>
            <Switch 
              checked={settings.notifyClockIn}
              onCheckedChange={(checked) => updateSetting('notifyClockIn', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reminder Clock Out</p>
              <p className="text-sm text-muted-foreground">Ingatkan karyawan untuk clock out</p>
            </div>
            <Switch 
              checked={settings.notifyClockOut}
              onCheckedChange={(checked) => updateSetting('notifyClockOut', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifikasi Keterlambatan</p>
              <p className="text-sm text-muted-foreground">Kirim notifikasi saat terlambat</p>
            </div>
            <Switch 
              checked={settings.notifyLate}
              onCheckedChange={(checked) => updateSetting('notifyLate', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifikasi Cuti</p>
              <p className="text-sm text-muted-foreground">Kirim notifikasi untuk pengajuan cuti</p>
            </div>
            <Switch 
              checked={settings.notifyLeave}
              onCheckedChange={(checked) => updateSetting('notifyLeave', checked)}
            />
          </div>
        </div>
      )
    },
    {
      icon: Shield,
      title: 'Keamanan',
      description: 'Pengaturan keamanan sistem',
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Validasi GPS</p>
              <p className="text-sm text-muted-foreground">Wajib aktifkan GPS saat clock in</p>
            </div>
            <Switch 
              checked={settings.requireGps}
              onCheckedChange={(checked) => updateSetting('requireGps', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Foto Selfie</p>
              <p className="text-sm text-muted-foreground">Wajib foto saat clock in/out</p>
            </div>
            <Switch 
              checked={settings.requirePhoto}
              onCheckedChange={(checked) => updateSetting('requirePhoto', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label>Radius Lokasi Kantor (meter)</Label>
            <Input 
              type="number" 
              value={settings.gpsRadius}
              onChange={(e) => updateSetting('gpsRadius', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Karyawan harus berada dalam radius ini saat clock in
            </p>
          </div>
        </div>
      )
    },
    {
      icon: MapPin,
      title: 'Lokasi Kantor',
      description: 'Atur lokasi kantor untuk validasi GPS',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input 
                type="number"
                step="0.000001"
                value={settings.officeLatitude || ''}
                onChange={(e) => updateSetting('officeLatitude', parseFloat(e.target.value) || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input 
                type="number"
                step="0.000001"
                value={settings.officeLongitude || ''}
                onChange={(e) => updateSetting('officeLongitude', parseFloat(e.target.value) || null)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Alamat Kantor</Label>
            <Input 
              value={settings.officeAddress || ''}
              onChange={(e) => updateSetting('officeAddress', e.target.value)}
              placeholder="Masukkan alamat kantor"
            />
          </div>

          <div className="space-y-2">
            <Label>Pilih di Peta</Label>
            <div className="border rounded-lg overflow-hidden">
              <MapPicker
                initialPosition={settings.officeLatitude && settings.officeLongitude 
                  ? [settings.officeLatitude, settings.officeLongitude] 
                  : undefined}
                onPositionChange={handleOfficeLocationChange}
                gpsRadius={settings.gpsRadius}
                height="250px"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Klik pada peta untuk memilih lokasi kantor. Area biru menunjukkan radius GPS yang diizinkan.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Globe,
      title: 'Informasi Perusahaan',
      description: 'Data perusahaan untuk laporan dan dokumen',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Perusahaan</Label>
            <Input 
              value={settings.orgName}
              onChange={(e) => updateSetting('orgName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input 
              value={settings.orgAddress || ''}
              onChange={(e) => updateSetting('orgAddress', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input 
                value={settings.orgPhone || ''}
                onChange={(e) => updateSetting('orgPhone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={settings.orgEmail || ''}
                onChange={(e) => updateSetting('orgEmail', e.target.value)}
              />
            </div>
          </div>
        </div>
      )
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola konfigurasi sistem</p>
      </div>

      {/* Settings Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {settingSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.content}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium">Simpan Perubahan</p>
                <p className="text-sm text-muted-foreground">
                  Pastikan semua pengaturan sudah benar sebelum menyimpan
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
