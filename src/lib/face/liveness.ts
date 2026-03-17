'use client'

import { FaceMesh, Results } from '@mediapipe/face_mesh'
import {
  LIVENESS_CHALLENGES,
  EAR_THRESHOLD,
  EAR_CONSECUTIVE_FRAMES,
  HEAD_TURN_THRESHOLD,
  HEAD_NOD_THRESHOLD,
  DETECTION_INTERVAL,
  CHALLENGE_TIMEOUT,
} from './constants'
import type { LivenessChallengeType, LivenessResult, EARData, HeadPose, ChallengeResult } from './types'

// Eye landmark indices from MediaPipe Face Mesh
const LEFT_EYE_INDICES = {
  upper: [159, 158, 157, 156],  // Upper eyelid
  lower: [145, 144, 143, 142],  // Lower eyelid
  outer: 33,   // Outer corner
  inner: 133,  // Inner corner
}

const RIGHT_EYE_INDICES = {
  upper: [386, 385, 384, 383],
  lower: [374, 373, 372, 371],
  outer: 362,
  inner: 263,
}

// Key landmark indices
const NOSE_TIP = 1
const CHIN = 152
const FOREHEAD = 10
const LEFT_CHEEK = 234
const RIGHT_CHEEK = 454

export class LivenessDetector {
  private faceMesh: FaceMesh | null = null
  private initialized = false
  private earHistory: EARData[] = []
  private headPoseHistory: HeadPose[] = []
  private lastDetectionTime = 0
  
  constructor() {
    this.init = this.init.bind(this)
    this.detect = this.detect.bind(this)
    this.detectBlink = this.detectBlink.bind(this)
    this.detectHeadTurn = this.detectHeadTurn.bind(this)
    this.detectNod = this.detectNod.bind(this)
    this.detectSmile = this.detectSmile.bind(this)
  }

  async init(): Promise<void> {
    if (this.initialized) return

    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    })

    await this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    this.initialized = true
  }

  // Calculate Eye Aspect Ratio (EAR)
  private calculateEAR(landmarks: Results['multiFaceLandmarks'][0], isLeft: boolean): number {
    const eye = isLeft ? LEFT_EYE_INDICES : RIGHT_EYE_INDICES
    
    // Get eye landmarks
    const upper = landmarks[eye.upper[0]]
    const lower = landmarks[eye.lower[0]]
    const outer = landmarks[eye.outer]
    const inner = landmarks[eye.inner]
    
    if (!upper || !lower || !outer || !inner) return 1.0
    
    // Calculate vertical distance
    const vertical = Math.abs(upper.y - lower.y)
    
    // Calculate horizontal distance
    const horizontal = Math.abs(outer.x - inner.x)
    
    // EAR = vertical / horizontal
    return vertical / (horizontal || 0.001)
  }

  // Detect blink using EAR
  detectBlink(landmarks: Results['multiFaceLandmarks'][0]): { detected: boolean; ear: number } {
    const leftEAR = this.calculateEAR(landmarks, true)
    const rightEAR = this.calculateEAR(landmarks, false)
    const avgEAR = (leftEAR + rightEAR) / 2
    
    // Store EAR history
    const now = Date.now()
    this.earHistory.push({
      left: leftEAR,
      right: rightEAR,
      average: avgEAR,
      timestamp: now,
    })
    
    // Keep only recent history (last 1 second)
    this.earHistory = this.earHistory.filter(d => now - d.timestamp < 1000)
    
    // Check for blink: consecutive frames with low EAR
    let consecutiveClosed = 0
    for (let i = this.earHistory.length - 1; i >= 0; i--) {
      if (this.earHistory[i].average < EAR_THRESHOLD) {
        consecutiveClosed++
      } else {
        break
      }
    }
    
    // Also check for eyes returning to open state after being closed
    const hadClosedEyes = this.earHistory.some(d => d.average < EAR_THRESHOLD)
    const eyesNowOpen = avgEAR >= EAR_THRESHOLD
    
    return {
      detected: hadClosedEyes && eyesNowOpen && consecutiveClosed >= EAR_CONSECUTIVE_FRAMES,
      ear: avgEAR,
    }
  }

  // Calculate head pose from landmarks
  private calculateHeadPose(landmarks: Results['multiFaceLandmarks'][0]): HeadPose {
    const nose = landmarks[NOSE_TIP]
    const forehead = landmarks[FOREHEAD]
    const chin = landmarks[CHIN]
    const leftCheek = landmarks[LEFT_CHEEK]
    const rightCheek = landmarks[RIGHT_CHEEK]
    
    if (!nose || !forehead || !chin || !leftCheek || !rightCheek) {
      return { yaw: 0, pitch: 0, roll: 0 }
    }
    
    // Yaw (left-right rotation): based on nose position relative to cheeks
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x)
    const noseFromCenter = (nose.x - (leftCheek.x + rightCheek.x) / 2) / faceWidth
    const yaw = noseFromCenter * 90 // Approximate degrees
    
    // Pitch (up-down rotation): based on nose position relative to forehead and chin
    const faceHeight = Math.abs(chin.y - forehead.y)
    const noseFromCenterY = (nose.y - (forehead.y + chin.y) / 2) / faceHeight
    const pitch = noseFromCenterY * 60 // Approximate degrees
    
    // Roll (tilt): based on eye line
    const roll = 0 // Simplified - would need eye landmarks for accurate calculation
    
    return { yaw, pitch, roll }
  }

  // Detect head turn (left or right)
  detectHeadTurn(landmarks: Results['multiFaceLandmarks'][0], direction: 'left' | 'right'): { detected: boolean; yaw: number } {
    const pose = this.calculateHeadPose(landmarks)
    
    const now = Date.now()
    this.headPoseHistory.push({ ...pose, timestamp: now } as any)
    
    // Keep only recent history
    this.headPoseHistory = this.headPoseHistory.filter((d: any) => now - d.timestamp < 2000)
    
    // Check for turn in specified direction
    const hadNeutralPose = this.headPoseHistory.some((d: any) => Math.abs(d.yaw) < 10)
    const turnedEnough = direction === 'left' 
      ? pose.yaw < -HEAD_TURN_THRESHOLD 
      : pose.yaw > HEAD_TURN_THRESHOLD
    
    return {
      detected: hadNeutralPose && turnedEnough,
      yaw: pose.yaw,
    }
  }

  // Detect nod (up-down movement)
  detectNod(landmarks: Results['multiFaceLandmarks'][0]): { detected: boolean; pitch: number } {
    const pose = this.calculateHeadPose(landmarks)
    
    // Check for nod movement in history
    const now = Date.now()
    this.headPoseHistory.push({ ...pose, timestamp: now } as any)
    this.headPoseHistory = this.headPoseHistory.filter((d: any) => now - d.timestamp < 2000)
    
    // Look for up then down or down then up pattern
    const pitchValues = this.headPoseHistory.map((d: any) => d.pitch)
    const minPitch = Math.min(...pitchValues)
    const maxPitch = Math.max(...pitchValues)
    
    // Nod detected if there's significant vertical movement
    return {
      detected: maxPitch - minPitch > HEAD_NOD_THRESHOLD,
      pitch: pose.pitch,
    }
  }

  // Detect smile (mouth corner movement)
  detectSmile(landmarks: Results['multiFaceLandmarks'][0]): { detected: boolean; score: number } {
    // Mouth corner landmarks
    const leftMouth = landmarks[61]
    const rightMouth = landmarks[291]
    const upperLip = landmarks[13]
    const lowerLip = landmarks[14]
    
    if (!leftMouth || !rightMouth || !upperLip || !lowerLip) {
      return { detected: false, score: 0 }
    }
    
    // Calculate mouth width to height ratio
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x)
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y)
    
    // Smile typically has wider mouth relative to height
    const smileRatio = mouthWidth / (mouthHeight || 0.01)
    
    // Threshold for smile detection (empirically determined)
    const isSmiling = smileRatio > 8 && mouthHeight < 0.02
    
    return {
      detected: isSmiling,
      score: Math.min(1, smileRatio / 10),
    }
  }

  // Process video frame for liveness detection
  async detect(
    video: HTMLVideoElement,
    challenge: LivenessChallengeType
  ): Promise<LivenessResult | null> {
    if (!this.faceMesh || !this.initialized) {
      await this.init()
    }

    return new Promise((resolve) => {
      if (!this.faceMesh) {
        resolve(null)
        return
      }

      this.faceMesh.onResults((results: Results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          resolve(null)
          return
        }

        const landmarks = results.multiFaceLandmarks[0]
        let detected = false
        let score = 0

        switch (challenge) {
          case 'blink': {
            const result = this.detectBlink(landmarks)
            detected = result.detected
            score = result.detected ? 1 : (result.ear < EAR_THRESHOLD ? 0.5 : 0.2)
            break
          }
          case 'turn_left': {
            const result = this.detectHeadTurn(landmarks, 'left')
            detected = result.detected
            score = Math.min(1, Math.abs(result.yaw) / HEAD_TURN_THRESHOLD)
            break
          }
          case 'turn_right': {
            const result = this.detectHeadTurn(landmarks, 'right')
            detected = result.detected
            score = Math.min(1, Math.abs(result.yaw) / HEAD_TURN_THRESHOLD)
            break
          }
          case 'nod': {
            const result = this.detectNod(landmarks)
            detected = result.detected
            score = result.detected ? 1 : 0.3
            break
          }
          case 'smile': {
            const result = this.detectSmile(landmarks)
            detected = result.detected
            score = result.score
            break
          }
        }

        resolve({
          isReal: detected,
          score,
          challenge,
          detected,
          timestamp: Date.now(),
        })
      })

      this.faceMesh.send({ image: video })
    })
  }

  // Run challenge with timeout
  async runChallenge(
    video: HTMLVideoElement,
    challenge: LivenessChallengeType,
    onProgress?: (result: LivenessResult) => void,
    timeout: number = CHALLENGE_TIMEOUT
  ): Promise<LivenessResult> {
    const startTime = Date.now()
    let bestResult: LivenessResult = {
      isReal: false,
      score: 0,
      challenge,
      detected: false,
      timestamp: startTime,
    }

    while (Date.now() - startTime < timeout) {
      const result = await this.detect(video, challenge)
      
      if (result) {
        if (result.score > bestResult.score) {
          bestResult = result
        }
        onProgress?.(result)
        
        if (result.detected) {
          return result
        }
      }

      // Wait for next detection interval
      await new Promise(resolve => setTimeout(resolve, DETECTION_INTERVAL))
    }

    return bestResult
  }

  // Cleanup
  destroy(): void {
    if (this.faceMesh) {
      this.faceMesh.close()
      this.faceMesh = null
    }
    this.initialized = false
    this.earHistory = []
    this.headPoseHistory = []
  }
}

// Singleton instance
let livenessDetectorInstance: LivenessDetector | null = null

export function getLivenessDetector(): LivenessDetector {
  if (!livenessDetectorInstance) {
    livenessDetectorInstance = new LivenessDetector()
  }
  return livenessDetectorInstance
}

export function destroyLivenessDetector(): void {
  if (livenessDetectorInstance) {
    livenessDetectorInstance.destroy()
    livenessDetectorInstance = null
  }
}
