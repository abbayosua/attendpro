// Face Recognition Types

import { LIVENESS_CHALLENGES } from './constants'

export type LivenessChallengeType = typeof LIVENESS_CHALLENGES[number]

// Face detection result from camera
export interface DetectedFace {
  box: {
    x: number
    y: number
    width: number
    height: number
  }
  landmarks?: FacialLandmarks
  embedding?: number[]
  confidence: number
}

// Facial landmarks for various detections
export interface FacialLandmarks {
  leftEye: { x: number; y: number }[]
  rightEye: { x: number; y: number }[]
  nose: { x: number; y: number }
  mouth: { x: number; y: number }[]
  jawline: { x: number; y: number }[]
}

// Liveness detection result
export interface LivenessResult {
  isReal: boolean
  score: number
  challenge: LivenessChallengeType
  detected: boolean
  timestamp: number
}

// Single challenge result
export interface ChallengeResult {
  type: LivenessChallengeType
  success: boolean
  score: number
  timestamp: number
}

// Face registration result
export interface FaceRegistrationResult {
  success: boolean
  message: string
  embedding?: number[]
  photoUrl?: string
}

// Face verification result
export interface FaceVerificationResult {
  success: boolean
  verified: boolean
  message: string
  matchScore?: number
  livenessScore?: number
  livenessChallenge?: LivenessChallengeType
}

// Eye Aspect Ratio data
export interface EARData {
  left: number
  right: number
  average: number
  timestamp: number
}

// Head pose data
export interface HeadPose {
  yaw: number    // Left-right rotation
  pitch: number  // Up-down rotation (nod)
  roll: number   // Tilt
}

// Props for components
export interface FaceRegistrationProps {
  userId?: string
  onSuccess?: (result: FaceRegistrationResult) => void
  onCancel?: () => void
  allowMultipleAttempts?: boolean
}

export interface FaceVerificationProps {
  userId?: string
  requiredLivenessScore?: number
  requiredMatchScore?: number
  onVerified?: (result: FaceVerificationResult) => void
  onCancel?: () => void
  timeout?: number
}

export interface CameraWithGuideProps {
  onFaceDetected: (face: DetectedFace) => void
  onFaceLost: () => void
  onReady?: () => void
  onError?: (error: string) => void
  showGuide?: boolean
  mirrorMode?: boolean
  width?: number
  height?: number
}

export interface LivenessChallengeProps {
  challenges: LivenessChallengeType[]
  videoRef: React.RefObject<HTMLVideoElement>
  onChallengeComplete: (index: number, result: ChallengeResult) => void
  onAllComplete: (results: ChallengeResult[]) => void
  onTimeout?: () => void
  timeout?: number
}
