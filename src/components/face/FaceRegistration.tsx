'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Eye, 
  RotateCcw, 
  Smile,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CameraWithGuide, captureVideoFrame } from './CameraWithGuide'
import { getLivenessDetector, destroyLivenessDetector } from '@/lib/face/liveness'
import { getFaceRecognizer, destroyFaceRecognizer, videoToBase64 } from '@/lib/face/recognition'
import { 
  LIVENESS_CHALLENGES, 
  CHALLENGE_TIMEOUT,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '@/lib/face/constants'
import type { LivenessChallengeType, ChallengeResult, LivenessResult } from '@/lib/face/types'

interface FaceRegistrationProps {
  onSuccess?: (result: { success: boolean; message: string }) => void
  onCancel?: () => void
  onBack?: () => void
  userId?: string
  requireMultipleAngles?: boolean
}

// Challenge display configuration
const CHALLENGE_CONFIG: Record<LivenessChallengeType, { 
  icon: React.ReactNode
  instruction: string
  instructionEn: string 
}> = {
  blink: {
    icon: <Eye className="h-6 w-6" />,
    instruction: 'Kedipkan mata Anda',
    instructionEn: 'Blink your eyes',
  },
  turn_left: {
    icon: <RotateCcw className="h-6 w-6" />,
    instruction: 'Putar kepala ke kiri',
    instructionEn: 'Turn your head left',
  },
  turn_right: {
    icon: <RotateCcw className="h-6 w-6 scale-x-[-1]" />,
    instruction: 'Putar kepala ke kanan',
    instructionEn: 'Turn your head right',
  },
  nod: {
    icon: <ArrowLeft className="h-6 w-6 rotate-[-90deg]" />,
    instruction: 'Anggukkan kepala',
    instructionEn: 'Nod your head',
  },
  smile: {
    icon: <Smile className="h-6 w-6" />,
    instruction: 'Tersenyum',
    instructionEn: 'Smile',
  },
}

// Select random challenges
function selectChallenges(count: number = 3): LivenessChallengeType[] {
  const shuffled = [...LIVENESS_CHALLENGES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count) as LivenessChallengeType[]
}

export function FaceRegistration({
  onSuccess,
  onCancel,
  onBack,
  userId,
  requireMultipleAngles = false,
}: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  
  // Registration state
  const [step, setStep] = useState<'intro' | 'camera' | 'challenges' | 'capturing' | 'registering' | 'success' | 'error'>('intro')
  const [challenges, setChallenges] = useState<LivenessChallengeType[]>([])
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>([])
  const [challengeProgress, setChallengeProgress] = useState(0)
  const [currentLivenessScore, setCurrentLivenessScore] = useState(0)
  
  // Capturing state
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<number[][]>([])
  const [captureProgress, setCaptureProgress] = useState(0)
  
  // Final state
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)

  // Camera ready callback
  const handleCameraReady = useCallback(() => {
    // Get video element from camera
    const video = document.querySelector('video')
    if (video) {
      videoRef.current = video
    }
  }, [])

  // Initialize detectors
  const initializeDetectors = async () => {
    setIsInitializing(true)
    setInitError(null)
    
    try {
      // Initialize both detectors in parallel
      await Promise.all([
        getLivenessDetector().init(),
        getFaceRecognizer().init(),
      ])
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize detectors:', error)
      setInitError('Gagal memuat komponen deteksi wajah. Silakan refresh halaman.')
    } finally {
      setIsInitializing(false)
    }
  }

  // Start registration process
  const startRegistration = async () => {
    setStep('camera')
    await initializeDetectors()
  }

  // Begin challenges
  const beginChallenges = () => {
    const selectedChallenges = selectChallenges(3)
    setChallenges(selectedChallenges)
    setCurrentChallengeIndex(0)
    setChallengeResults([])
    setStep('challenges')
  }

  // Run current challenge
  useEffect(() => {
    if (step !== 'challenges' || !isInitialized || currentChallengeIndex >= challenges.length) {
      return
    }

    const runChallenge = async () => {
      const currentChallenge = challenges[currentChallengeIndex]
      const livenessDetector = getLivenessDetector()
      
      if (!videoRef.current) {
        // Wait for video to be available
        const video = document.querySelector('video')
        if (video) {
          videoRef.current = video
        } else {
          return
        }
      }

      const result = await livenessDetector.runChallenge(
        videoRef.current!,
        currentChallenge,
        (progress) => {
          setCurrentLivenessScore(progress.score)
          setChallengeProgress(progress.score * 100)
        },
        CHALLENGE_TIMEOUT
      )

      // Store result
      const challengeResult: ChallengeResult = {
        type: currentChallenge,
        success: result.detected,
        score: result.score,
        timestamp: result.timestamp,
      }
      
      setChallengeResults(prev => [...prev, challengeResult])

      if (result.detected) {
        // Move to next challenge
        setTimeout(() => {
          if (currentChallengeIndex + 1 >= challenges.length) {
            // All challenges complete, start capturing embeddings
            startCapturing()
          } else {
            setCurrentChallengeIndex(prev => prev + 1)
            setChallengeProgress(0)
            setCurrentLivenessScore(0)
          }
        }, 500)
      } else {
        // Challenge failed - allow retry or show error
        const allFailed = challengeResults.filter(r => !r.success).length >= 2
        if (allFailed) {
          setRegistrationError('Verifikasi liveness gagal. Silakan coba lagi dengan pencahayaan yang lebih baik.')
          setStep('error')
        } else {
          // Allow retry current challenge
          setTimeout(() => {
            setChallengeProgress(0)
            setCurrentLivenessScore(0)
          }, 1000)
        }
      }
    }

    runChallenge()
  }, [step, isInitialized, currentChallengeIndex, challenges, challengeResults])

  // Start capturing face embeddings
  const startCapturing = async () => {
    setStep('capturing')
    setCapturedEmbeddings([])
    setCaptureProgress(0)

    if (!videoRef.current) {
      const video = document.querySelector('video')
      if (video) {
        videoRef.current = video
      }
    }

    if (!videoRef.current) {
      setRegistrationError('Kamera tidak tersedia')
      setStep('error')
      return
    }

    const recognizer = getFaceRecognizer()
    const embeddings: number[][] = []
    const targetCaptures = requireMultipleAngles ? 5 : 3
    let lastCaptureTime = 0

    // Capture multiple embeddings
    while (embeddings.length < targetCaptures) {
      const now = Date.now()
      
      // Wait at least 300ms between captures
      if (now - lastCaptureTime < 300) {
        await new Promise(r => setTimeout(r, 100))
        continue
      }

      const result = await recognizer.detectAndExtract(videoRef.current!)
      
      if (result) {
        embeddings.push(result.embedding)
        setCapturedEmbeddings([...embeddings])
        setCaptureProgress((embeddings.length / targetCaptures) * 100)
        lastCaptureTime = now
        
        // Capture reference photo from first successful detection
        if (!capturedPhoto) {
          const photo = videoToBase64(videoRef.current!)
          setCapturedPhoto(photo)
        }
      }

      await new Promise(r => setTimeout(r, 300))
    }

    // Average embeddings for better accuracy
    if (embeddings.length >= targetCaptures) {
      await registerFace(embeddings, capturedPhoto!)
    }
  }

  // Register face with backend
  const registerFace = async (embeddings: number[][], photoUrl: string) => {
    setStep('registering')
    setIsRegistering(true)
    setRegistrationError(null)

    try {
      // Average the embeddings
      const recognizer = getFaceRecognizer()
      const avgEmbedding = recognizer.averageEmbeddings(embeddings)

      // Send to backend
      const response = await fetch('/api/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding: avgEmbedding,
          photoUrl,
          userId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStep('success')
        onSuccess?.({ success: true, message: data.message })
      } else {
        setRegistrationError(data.message || 'Gagal mendaftarkan wajah')
        setStep('error')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegistrationError('Terjadi kesalahan jaringan. Silakan coba lagi.')
      setStep('error')
    } finally {
      setIsRegistering(false)
    }
  }

  // Retry from beginning
  const retryRegistration = () => {
    setStep('intro')
    setChallenges([])
    setCurrentChallengeIndex(0)
    setChallengeResults([])
    setChallengeProgress(0)
    setCurrentLivenessScore(0)
    setCapturedEmbeddings([])
    setCaptureProgress(0)
    setCapturedPhoto(null)
    setRegistrationError(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy on unmount to allow reuse
      // destroyLivenessDetector()
      // destroyFaceRecognizer()
    }
  }, [])

  // Render based on step
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Pendaftaran Wajah
        </CardTitle>
        <CardDescription>
          Daftarkan wajah Anda untuk verifikasi kehadiran
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Intro Step */}
        {step === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Pendaftaran wajah akan memverifikasi identitas Anda untuk keamanan absensi.
              </p>
              <ul className="text-left text-sm space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Pastikan pencahayaan yang baik</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Posisikan wajah di tengah bingkai</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Ikuti instruksi yang diberikan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Lepaskan kacamata/masker jika ada</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Kembali
                </Button>
              )}
              <Button onClick={startRegistration} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Mulai Pendaftaran
              </Button>
            </div>
          </motion.div>
        )}

        {/* Camera Initialization */}
        {step === 'camera' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isInitializing ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Memuat komponen deteksi wajah...
                </p>
              </div>
            ) : initError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{initError}</AlertDescription>
              </Alert>
            ) : (
              <>
                <CameraWithGuide
                  onReady={handleCameraReady}
                  showGuide={true}
                  mirrorMode={true}
                  autoStart={true}
                />
                <Button onClick={beginChallenges} className="w-full">
                  Lanjutkan
                </Button>
              </>
            )}
            
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="w-full">
                Batal
              </Button>
            )}
          </motion.div>
        )}

        {/* Challenges Step */}
        {step === 'challenges' && (
          <motion.div
            key={currentChallengeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <CameraWithGuide
              onReady={handleCameraReady}
              showGuide={true}
              mirrorMode={true}
              autoStart={true}
            />
            
            {/* Challenge Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tantangan {currentChallengeIndex + 1} dari {challenges.length}</span>
                <span>{Math.round(challengeProgress)}%</span>
              </div>
              <Progress value={challengeProgress} className="h-2" />
            </div>
            
            {/* Current Challenge */}
            {challenges[currentChallengeIndex] && (
              <div className="text-center py-4">
                <div className="mb-3">
                  {CHALLENGE_CONFIG[challenges[currentChallengeIndex]].icon}
                </div>
                <p className="font-medium text-lg">
                  {CHALLENGE_CONFIG[challenges[currentChallengeIndex]].instruction}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {CHALLENGE_CONFIG[challenges[currentChallengeIndex]].instructionEn}
                </p>
              </div>
            )}
            
            {/* Challenge Results */}
            <div className="flex justify-center gap-2">
              {challengeResults.map((result, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Capturing Step */}
        {step === 'capturing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <CameraWithGuide
              onReady={handleCameraReady}
              showGuide={true}
              mirrorMode={true}
              autoStart={true}
            />
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mengambil data wajah...</span>
                <span>{capturedEmbeddings.length} / {requireMultipleAngles ? 5 : 3}</span>
              </div>
              <Progress value={captureProgress} className="h-2" />
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Tahan posisi wajah Anda
            </p>
          </motion.div>
        )}

        {/* Registering Step */}
        {step === 'registering' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Menyimpan data wajah...
            </p>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Pendaftaran Berhasil!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Wajah Anda telah berhasil didaftarkan. Anda sekarang dapat menggunakan verifikasi wajah untuk absensi.
            </p>
            {onBack && (
              <Button onClick={onBack} className="w-full">
                Selesai
              </Button>
            )}
          </motion.div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Pendaftaran Gagal</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {registrationError}
            </p>
            <div className="flex gap-2">
              <Button onClick={retryRegistration} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              {onBack && (
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Kembali
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export default FaceRegistration
