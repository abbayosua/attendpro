'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { Camera, FlipHorizontal, X, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageData: string) => void
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      
      setStream(mediaStream)
      streamRef.current = mediaStream
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.')
      toast({
        title: 'Error',
        description: 'Tidak dapat mengakses kamera',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  // Handle dialog open/close
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null)
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  // Switch camera
  const handleFlipCamera = useCallback(async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  // Start camera when facing mode changes
  useEffect(() => {
    if (isOpen && !stream) {
      startCamera()
    }
  }, [facingMode, isOpen, stream, startCamera])

  // Capture photo
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
  }, [])

  // Retake photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
  }, [])

  // Confirm and use photo
  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage)
      onClose()
    }
  }, [capturedImage, onCapture, onClose])

  // Close dialog
  const handleClose = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    onClose()
  }, [stopCamera, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto Selfie
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {isLoading && (
            <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Memulai kamera...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-[300px] bg-destructive/10 rounded-lg">
              <div className="text-center">
                <Camera className="h-12 w-12 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={startCamera}
                >
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}
          
          {!isLoading && !error && (
            <>
              {/* Video Preview */}
              {!capturedImage && (
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[300px] object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  
                  {/* Overlay Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-full" />
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black/50 inline-block px-4 py-1 rounded-full">
                      Posisikan wajah Anda di dalam lingkaran
                    </p>
                  </div>
                </div>
              )}
              
              {/* Captured Image Preview */}
              {capturedImage && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-[300px] object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                </div>
              )}
              
              {/* Hidden Canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
        
        {/* Controls */}
        {!isLoading && !error && (
          <div className="flex items-center justify-center gap-4 pt-4">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlipCamera}
                  title="Ganti kamera"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16"
                  onClick={handleCapture}
                >
                  <Camera className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClose}
                  title="Tutup"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Ulangi
                </Button>
                
                <Button
                  onClick={handleConfirm}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Gunakan Foto
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
