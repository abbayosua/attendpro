'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Video, VideoOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  MIN_FACE_SIZE, 
  MAX_FACE_SIZE, 
  ERROR_MESSAGES 
} from '@/lib/face/constants'
import type { DetectedFace, CameraState, FaceDetectionState } from '@/lib/face/types'

interface CameraWithGuideProps {
  onFaceDetected?: (face: DetectedFace | null) => void
  onReady?: () => void
  onError?: (error: string) => void
  showGuide?: boolean
  mirrorMode?: boolean
  width?: number
  height?: number
  autoStart?: boolean
}

export function CameraWithGuide({
  onFaceDetected,
  onReady,
  onError,
  showGuide = true,
  mirrorMode = true,
  width = 640,
  height = 480,
  autoStart = true,
}: CameraWithGuideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const hasStartedRef = useRef(false)
  
  const [cameraState, setCameraState] = useState<CameraState>({
    isReady: false,
    isStreaming: false,
  })
  
  const [faceState, setFaceState] = useState<FaceDetectionState>({
    faceDetected: false,
    facePosition: 'none',
    faceSize: 'ok',
    multipleFaces: false,
  })

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraState({ isReady: false, isStreaming: false })
    hasStartedRef.current = false
  }, [])

  const startCamera = useCallback(async () => {
    // Prevent multiple starts
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = ERROR_MESSAGES.NO_CAMERA
        setCameraState({ isReady: false, isStreaming: false, error })
        onError?.(error)
        hasStartedRef.current = false
        return
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        setCameraState({ 
          isReady: true, 
          isStreaming: true,
          deviceId: stream.getVideoTracks()[0]?.getSettings()?.deviceId,
        })
        onReady?.()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      let errorMessage = ERROR_MESSAGES.NO_CAMERA
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = ERROR_MESSAGES.CAMERA_PERMISSION
      }
      
      setCameraState({ isReady: false, isStreaming: false, error: errorMessage })
      onError?.(errorMessage)
      hasStartedRef.current = false
    }
  }, [width, height, onReady, onError])

  // Auto-start camera on mount
  useEffect(() => {
    if (autoStart) {
      // Use setTimeout to defer state updates outside of the effect
      const timer = setTimeout(() => {
        startCamera()
      }, 0)
      
      return () => {
        clearTimeout(timer)
        stopCamera()
      }
    }
    
    return () => {
      stopCamera()
    }
  }, [autoStart, startCamera, stopCamera])

  // Simulate face detection state updates
  // In real implementation, this would be connected to face-api.js
  const updateFaceState = useCallback((face: DetectedFace | null) => {
    if (!face) {
      setFaceState({
        faceDetected: false,
        facePosition: 'none',
        faceSize: 'ok',
        multipleFaces: false,
      })
      onFaceDetected?.(null)
      return
    }

    const centerX = width / 2
    const centerY = height / 2
    const faceCenterX = face.box.x + face.box.width / 2
    const faceCenterY = face.box.y + face.box.height / 2

    // Determine position
    let position: FaceDetectionState['facePosition'] = 'center'
    if (faceCenterX < centerX - 100) position = 'left'
    else if (faceCenterX > centerX + 100) position = 'right'
    else if (faceCenterY < centerY - 80) position = 'top'
    else if (faceCenterY > centerY + 80) position = 'bottom'

    // Determine size
    let size: FaceDetectionState['faceSize'] = 'ok'
    if (face.box.width < MIN_FACE_SIZE || face.box.height < MIN_FACE_SIZE) {
      size = 'too_small'
    } else if (face.box.width > MAX_FACE_SIZE || face.box.height > MAX_FACE_SIZE) {
      size = 'too_large'
    }

    setFaceState({
      faceDetected: true,
      facePosition: position,
      faceSize: size,
      multipleFaces: false,
    })
    
    onFaceDetected?.(face)
  }, [width, height, onFaceDetected])

  // Capture frame from video
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return null
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Mirror the image if in mirror mode
    if (mirrorMode) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    
    ctx.drawImage(video, 0, 0)
    
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [mirrorMode])

  // Get video element reference for external use
  const getVideoElement = useCallback(() => videoRef.current, [])

  return (
    <div className="relative" style={{ width: '100%', maxWidth: width }}>
      {/* Camera View */}
      <div 
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}
          playsInline
          muted
        />
        
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Face Guide Overlay */}
        {showGuide && cameraState.isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Oval face guide */}
            <div 
              className="border-2 border-dashed rounded-full transition-colors duration-300"
              style={{
                width: '60%',
                height: '75%',
                borderColor: faceState.faceDetected && faceState.facePosition === 'center' && faceState.faceSize === 'ok'
                  ? '#22c55e' // green when good
                  : faceState.faceDetected 
                    ? '#f59e0b' // amber when detected but not in position
                    : 'rgba(255,255,255,0.5)', // muted when no face
              }}
            />
          </div>
        )}
        
        {/* Status Indicators */}
        {cameraState.isStreaming && (
          <>
            {/* Recording indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white">Live</span>
            </div>
            
            {/* Face status indicator */}
            <div className="absolute top-3 right-3">
              {faceState.faceDetected ? (
                faceState.facePosition === 'center' && faceState.faceSize === 'ok' ? (
                  <div className="bg-green-500/80 px-2 py-1 rounded-full">
                    <span className="text-xs text-white">Wajah Terdeteksi</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/80 px-2 py-1 rounded-full">
                    <span className="text-xs text-white">
                      {faceState.faceSize === 'too_small' && 'Mendekat'}
                      {faceState.faceSize === 'too_large' && 'Menjauh'}
                      {faceState.facePosition !== 'center' && faceState.faceSize === 'ok' && 'Posisikan Tengah'}
                    </span>
                  </div>
                )
              ) : (
                <div className="bg-black/50 px-2 py-1 rounded-full">
                  <span className="text-xs text-white">Mencari Wajah...</span>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Error State */}
        {cameraState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-white text-sm mb-3">{cameraState.error}</p>
              <Button variant="outline" size="sm" onClick={startCamera}>
                Coba Lagi
              </Button>
            </div>
          </div>
        )}
        
        {/* Not Started State */}
        {!cameraState.isStreaming && !cameraState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">Kamera tidak aktif</p>
              <Button variant="outline" size="sm" onClick={startCamera}>
                <Video className="h-4 w-4 mr-2" />
                Aktifkan Kamera
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      {cameraState.isStreaming && showGuide && (
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            Posisikan wajah Anda di dalam lingkaran
          </p>
        </div>
      )}
      
      {/* Export methods via ref pattern - using window for simplicity */}
      {/* In a real app, use useImperativeHandle with forwardRef */}
    </div>
  )
}

// Export utility to capture frame from video element
export function captureVideoFrame(video: HTMLVideoElement, mirror: boolean = true): string | null {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return null
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  
  ctx.drawImage(video, 0, 0)
  
  return canvas.toDataURL('image/jpeg', 0.8)
}

export default CameraWithGuide
