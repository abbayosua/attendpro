'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Camera, 
  Trash2, 
  Loader2, 
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FaceRegistration } from './FaceRegistration'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'
import type { FaceRecognitionSettings } from '@/lib/face/types'

interface FaceRegistrationStatusProps {
  onRegisterClick?: () => void
  showSettings?: boolean
}

export function FaceRegistrationStatus({
  onRegisterClick,
  showSettings = true,
}: FaceRegistrationStatusProps) {
  const currentUser = useStore((state) => state.currentUser)
  const deleteFaceRegistration = useStore((state) => state.deleteFaceRegistration)
  const getFaceStatus = useStore((state) => state.getFaceStatus)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredAt, setRegisteredAt] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState<FaceRecognitionSettings | null>(null)
  
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch face status
  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const status = await getFaceStatus()
        setIsRegistered(status.registered)
        setRegisteredAt(status.registeredAt || null)
        setPhotoUrl(status.photoUrl || null)
        setSettings(status.settings || null)
      } catch (error) {
        console.error('Failed to fetch face status:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStatus()
  }, [getFaceStatus])

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    setShowRegistrationDialog(false)
    setIsRegistered(true)
    setRegisteredAt(new Date().toISOString())
    toast({
      title: 'Berhasil',
      description: 'Wajah Anda berhasil didaftarkan',
    })
    onRegisterClick?.()
  }

  // Handle face deletion
  const handleDeleteFace = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteFaceRegistration()
      
      if (result.success) {
        setIsRegistered(false)
        setRegisteredAt(null)
        setPhotoUrl(null)
        setShowDeleteDialog(false)
        toast({
          title: 'Berhasil',
          description: 'Data wajah Anda berhasil dihapus',
        })
      } else {
        toast({
          title: 'Gagal',
          description: result.message || 'Gagal menghapus data wajah',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus data wajah',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRegistered ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Wajah Terdaftar
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Wajah Belum Terdaftar
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isRegistered
              ? 'Wajah Anda telah terdaftar untuk verifikasi kehadiran'
              : 'Daftarkan wajah Anda untuk mengaktifkan verifikasi wajah'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Content */}
          {isRegistered ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Registration Info */}
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Verifikasi Wajah Aktif
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Wajah Anda dapat digunakan untuk clock-in/out dengan verifikasi wajah
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Registration Details */}
              <div className="space-y-3">
                {registeredAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Terdaftar pada:</span>
                    <span className="font-medium">{formatDate(registeredAt)}</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRegistrationDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Perbarui Data Wajah
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Warning for not registered */}
              {settings?.requireFaceRecognition && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Organisasi Anda mewajibkan verifikasi wajah untuk absensi. 
                    Silakan daftarkan wajah Anda.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Registration Prompt */}
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Daftarkan wajah Anda untuk mengaktifkan fitur verifikasi wajah saat clock-in/out.
                </p>
                <Button onClick={() => setShowRegistrationDialog(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Daftarkan Wajah
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Organization Settings Info */}
          {showSettings && settings && (
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-2">Pengaturan Organisasi:</p>
              <div className="flex flex-wrap gap-2">
                {settings.requireFaceRecognition && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Verifikasi Wajah Wajib
                  </span>
                )}
                {settings.requireLivenessDetection && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Liveness Detection
                  </span>
                )}
                {settings.allowSelfFaceRegistration && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Pendaftaran Mandiri
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Registration Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pendaftaran Wajah</DialogTitle>
            <DialogDescription>
              Ikuti instruksi untuk mendaftarkan wajah Anda
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FaceRegistration
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setShowRegistrationDialog(false)}
              onBack={() => setShowRegistrationDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Wajah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data wajah Anda? Anda perlu mendaftarkan ulang wajah untuk menggunakan verifikasi wajah.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFace}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Data Wajah
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FaceRegistrationStatus
