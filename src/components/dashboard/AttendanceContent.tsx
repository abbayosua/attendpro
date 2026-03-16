'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, MapPin, Calendar, CheckCircle, AlertCircle, LogIn, LogOut, Loader2, Navigation, Camera, Image as ImageIcon, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'
import { AttendanceMap, isWithinRadius } from '@/components/map'
import dynamic from 'next/dynamic'

// Dynamic import for CameraCapture to avoid SSR issues
const CameraCapture = dynamic(
  () => import('@/components/camera/CameraCapture').then((mod) => mod.CameraCapture),
  { ssr: false }
)

export function AttendanceContent() {
  const currentUser = useStore((state) => state.currentUser)
  const clockIn = useStore((state) => state.clockIn)
  const clockOut = useStore((state) => state.clockOut)
  const fetchTodayAttendance = useStore((state) => state.fetchTodayAttendance)
  const fetchAttendanceHistory = useStore((state) => state.fetchAttendanceHistory)
  const settings = useStore((state) => state.settings)
  const fetchSettings = useStore((state) => state.fetchSettings)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [isWithinOfficeRadius, setIsWithinOfficeRadius] = useState(true)
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'clockIn' | 'clockOut' | null>(null)
  
  // Photo viewer state
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  // Get settings from store or use defaults
  const officeLocation = settings?.officeLatitude && settings?.officeLongitude
    ? { lat: settings.officeLatitude, lng: settings.officeLongitude }
    : { lat: -6.2088, lng: 106.8456 }
  const gpsRadius = settings?.gpsRadius || 100
  const requirePhoto = settings?.requirePhoto || false

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentLocation = useCallback(async () => {
    setLocationStatus('loading')
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 10000,
          enableHighAccuracy: true 
        })
      })
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      setCurrentLocation(location)
      setLocationStatus('success')
      
      // Check if within office radius
      const withinRadius = isWithinRadius(
        location.lat,
        location.lng,
        officeLocation.lat,
        officeLocation.lng,
        gpsRadius
      )
      setIsWithinOfficeRadius(withinRadius)
      
      return location
    } catch {
      setLocationStatus('error')
      return null
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch settings first
        await fetchSettings()
        
        const [today, history] = await Promise.all([
          fetchTodayAttendance(),
          fetchAttendanceHistory({})
        ])
        setTodayAttendance(today)
        setAttendanceHistory(history || [])
        
        // Get current location on load
        getCurrentLocation()
      } catch (error) {
        console.error('Error loading attendance data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [fetchTodayAttendance, fetchAttendanceHistory, getCurrentLocation, fetchSettings])

  if (!currentUser) return null

  const handleClockIn = async () => {
    // Check if photo is required
    if (requirePhoto && !capturedPhoto) {
      setPendingAction('clockIn')
      setShowCamera(true)
      return
    }
    
    await processClockIn()
  }

  const processClockIn = async () => {
    setIsProcessing(true)
    try {
      const location = await getCurrentLocation()
      
      if (location) {
        const result = await clockIn({
          latitude: location.lat,
          longitude: location.lng,
          address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        }, capturedPhoto || undefined)
        
        if (result.success) {
          toast({ 
            title: 'Berhasil!', 
            description: `${result.message}${!isWithinOfficeRadius ? ' (Di luar radius kantor)' : ''}` 
          })
          const today = await fetchTodayAttendance()
          setTodayAttendance(today)
          setCapturedPhoto(null)
        } else {
          toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
        }
      } else {
        toast({ 
          title: 'Gagal', 
          description: 'Tidak dapat mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.', 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClockOut = async () => {
    // Check if photo is required
    if (requirePhoto && !capturedPhoto) {
      setPendingAction('clockOut')
      setShowCamera(true)
      return
    }
    
    await processClockOut()
  }

  const processClockOut = async () => {
    setIsProcessing(true)
    try {
      const location = await getCurrentLocation()
      
      if (location) {
        const result = await clockOut({
          latitude: location.lat,
          longitude: location.lng,
          address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        }, capturedPhoto || undefined)
        
        if (result.success) {
          toast({ title: 'Berhasil!', description: result.message })
          const today = await fetchTodayAttendance()
          setTodayAttendance(today)
          setCapturedPhoto(null)
        } else {
          toast({ title: 'Gagal', description: result.message, variant: 'destructive' })
        }
      } else {
        toast({ 
          title: 'Gagal', 
          description: 'Tidak dapat mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.', 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePhotoCapture = (imageData: string) => {
    setCapturedPhoto(imageData)
    setShowCamera(false)
    
    // Process pending action if any
    if (pendingAction === 'clockIn') {
      processClockIn()
    } else if (pendingAction === 'clockOut') {
      processClockOut()
    }
    setPendingAction(null)
  }

  const calculateWorkingHours = () => {
    if (!todayAttendance?.clockIn) return '0j 0m'
    const clockInTime = new Date(todayAttendance.clockIn)
    const now = currentTime
    const diff = now.getTime() - clockInTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}j ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Absensi</h1>
        <p className="text-muted-foreground">Catat kehadiran Anda hari ini</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clock In/Out Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Catat Kehadiran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Display */}
              <div className="text-center py-6 bg-muted/30 rounded-xl">
                <div className="text-5xl font-mono font-bold mb-2">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-muted-foreground">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Location Status */}
              <div className={`rounded-xl p-4 ${
                locationStatus === 'success' 
                  ? isWithinOfficeRadius
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                    : 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900'
                  : locationStatus === 'error' 
                    ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
                    : 'bg-muted/50 border'
              }`}>
                <div className="flex items-center gap-3">
                  {locationStatus === 'loading' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : locationStatus === 'success' ? (
                    isWithinOfficeRadius ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )
                  ) : locationStatus === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Navigation className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">
                      {locationStatus === 'loading' ? 'Mengambil lokasi...' : 
                       locationStatus === 'success' 
                        ? isWithinOfficeRadius 
                          ? 'Lokasi Valid' 
                          : 'Di Luar Radius Kantor'
                        : locationStatus === 'error' 
                          ? 'Gagal Mengambil Lokasi' 
                          : 'Klik untuk mengambil lokasi'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentLocation 
                        ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` 
                        : 'Izin lokasi diperlukan'}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={getCurrentLocation}
                    disabled={locationStatus === 'loading'}
                  >
                    {locationStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Photo Status (if required) */}
              {requirePhoto && (
                <div className={`rounded-xl p-4 ${
                  capturedPhoto 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                    : 'bg-muted/50 border'
                }`}>
                  <div className="flex items-center gap-3">
                    {capturedPhoto ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">
                        {capturedPhoto ? 'Foto Siap' : 'Foto Diperlukan'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {capturedPhoto ? 'Klik Clock In/Out untuk lanjut' : 'Ambil foto selfie terlebih dahulu'}
                      </div>
                    </div>
                    {capturedPhoto && (
                      <img 
                        src={capturedPhoto} 
                        alt="Captured" 
                        className="w-12 h-12 rounded-lg object-cover ml-auto"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Status */}
              <div className={`rounded-xl p-4 ${
                todayAttendance?.clockIn 
                  ? todayAttendance.status === 'LATE' 
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900'
                    : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                  : 'bg-muted/50 border'
              }`}>
                <div className="flex items-center gap-3">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : todayAttendance?.clockIn ? (
                    todayAttendance.status === 'LATE' ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">
                      {loading ? 'Memuat...' : todayAttendance?.clockIn 
                        ? todayAttendance.status === 'LATE' 
                          ? 'Anda Terlambat' 
                          : 'Sudah Clock In'
                        : 'Belum Clock In'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {loading ? '' : todayAttendance?.clockIn 
                        ? `Clock in: ${new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Tekan tombol di bawah untuk mencatat kehadiran'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clock In/Out Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-16"
                  disabled={!!todayAttendance?.clockIn || isProcessing || loading}
                  onClick={handleClockIn}
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <LogIn className="h-5 w-5 mr-2" />}
                  Clock In
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16"
                  disabled={!todayAttendance?.clockIn || !!todayAttendance?.clockOut || isProcessing || loading}
                  onClick={handleClockOut}
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <LogOut className="h-5 w-5 mr-2" />}
                  Clock Out
                </Button>
              </div>

              {/* Take Photo Button (optional) */}
              {!requirePhoto && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-4 w-4" />
                  {capturedPhoto ? 'Ganti Foto Selfie' : 'Ambil Foto Selfie (Opsional)'}
                </Button>
              )}

              {/* Captured Photo Preview */}
              {capturedPhoto && (
                <div className="rounded-xl border overflow-hidden">
                  <img 
                    src={capturedPhoto} 
                    alt="Captured selfie" 
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Working Hours */}
              {todayAttendance?.clockIn && !todayAttendance?.clockOut && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Jam kerja hari ini: </span>
                  <span className="font-semibold">{calculateWorkingHours()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Map Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lokasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AttendanceMap
                clockInLocation={todayAttendance?.clockInLat && todayAttendance?.clockInLng 
                  ? { lat: todayAttendance.clockInLat, lng: todayAttendance.clockInLng }
                  : null}
                clockOutLocation={todayAttendance?.clockOutLat && todayAttendance?.clockOutLng 
                  ? { lat: todayAttendance.clockOutLat, lng: todayAttendance.clockOutLng }
                  : null}
                officeLocation={officeLocation}
                gpsRadius={gpsRadius}
                height="350px"
              />
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-muted-foreground">Kantor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">Clock In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-muted-foreground">Clock Out</span>
                </div>
              </div>

              {/* Work Schedule */}
              <div className="border rounded-xl p-4">
                <h4 className="font-medium mb-3">Jadwal Kerja</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jam Kerja</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Radius GPS</span>
                    <span>{gpsRadius} meter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toleransi Keterlambatan</span>
                    <span>15 menit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Tanggal</th>
                      <th className="text-left p-3 text-sm font-medium">Clock In</th>
                      <th className="text-left p-3 text-sm font-medium">Clock Out</th>
                      <th className="text-left p-3 text-sm font-medium">Jam Kerja</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Belum ada riwayat kehadiran
                        </td>
                      </tr>
                    ) : (
                      attendanceHistory.slice(0, 20).map((attendance: any) => (
                        <tr key={attendance.id} className="hover:bg-muted/30">
                          <td className="p-3 text-sm">{new Date(attendance.date).toLocaleDateString('id-ID')}</td>
                          <td className="p-3 text-sm">
                            {attendance.clockIn ? new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3 text-sm">
                            {attendance.clockOut ? new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3 text-sm">
                            {attendance.workHours ? `${attendance.workHours.toFixed(1)}j` : '-'}
                          </td>
                          <td className="p-3">
                            <Badge variant={attendance.status === 'PRESENT' ? 'default' : attendance.status === 'LATE' ? 'destructive' : 'secondary'}>
                              {attendance.status === 'PRESENT' ? 'Hadir' : attendance.status === 'LATE' ? 'Terlambat' : attendance.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {(attendance.clockInPhoto || attendance.clockOutPhoto) ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setViewingPhoto(attendance.clockInPhoto || attendance.clockOutPhoto)
                                  setPhotoViewerOpen(true)
                                }}
                              >
                                <ImageIcon className="h-4 w-4 text-primary" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">Tidak ada</span>
                            )}
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
      </motion.div>

      {/* Camera Dialog */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => {
          setShowCamera(false)
          setPendingAction(null)
        }}
        onCapture={handlePhotoCapture}
      />
      
      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Foto Absensi</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <div className="relative">
              <img 
                src={viewingPhoto} 
                alt="Foto Absensi" 
                className="w-full rounded-lg"
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => setPhotoViewerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
