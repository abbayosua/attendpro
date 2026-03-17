# 🔒 Liveness Detection + Face Recognition Implementation Plan

## Overview

This document outlines the implementation plan for adding Liveness Detection and Face Recognition to AttendPro. This feature prevents buddy punching by verifying:
1. **Liveness**: A real human is present (not a photo/video)
2. **Identity**: The person is the correct employee

---

## Architecture Decision: Full Client-Side (Option A)

### Why Client-Side?
- ✅ **100% Free** - No API costs
- ✅ **Fast** - No network latency for ML processing
- ✅ **Works Offline** - Can process without internet
- ✅ **Privacy-Friendly** - Face data stays on device until needed

### Trade-offs
- ⚠️ Could be bypassed by tech-savvy users (acceptable for MVP)
- ⚠️ Embedding comparison logic exposed to client

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ MEDIAPIPE FACE MESH (Liveness)                          │ │
│  │ - 468 facial landmarks                                   │ │
│  │ - Eye blink detection                                    │ │
│  │ - Head pose estimation                                   │ │
│  │ - Mouth movement detection                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ FACE-API.JS (Face Recognition)                          │ │
│  │ - Face detection                                         │ │
│  │ - 128-dimension face embedding extraction                │ │
│  │ - Face comparison (Euclidean distance)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ RESULT                                                   │ │
│  │ - Liveness score (0.0 - 1.0)                            │ │
│  │ - Face match score (0.0 - 1.0)                          │ │
│  │ - Verified frame (base64 image)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND (Vercel API)                                         │
├──────────────────────────────────────────────────────────────┤
│ - Verify request integrity                                   │
│ - Store attendance record with liveness/face scores          │
│ - Store photo in Supabase Storage                            │
│ - Store face embedding in database (for registered users)    │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| **Liveness Detection** | MediaPipe Face Mesh | Detect face landmarks, blink, head movement |
| **Face Detection** | face-api.js | Detect face in camera feed |
| **Face Embedding** | face-api.js | Extract 128-dimension face vector |
| **Face Comparison** | face-api.js | Compare embeddings (Euclidean distance) |
| **Camera Access** | Browser MediaDevices API | Access webcam |
| **Model Hosting** | CDN / Vercel Static | Host ML models |

### Dependencies to Install

```bash
bun add @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils
bun add face-api.js
```

---

## Database Schema Changes

### User Model - Add Face Registration Fields

```prisma
model User {
  // ... existing fields
  
  // Face registration
  faceRegistered       Boolean    @default(false)
  faceEmbedding        String?    // Stored as JSON array [128 floats]
  faceRegisteredAt     DateTime?
  facePhotoUrl         String?    // Reference photo URL
}
```

### Attendance Model - Add Liveness & Face Fields

```prisma
model Attendance {
  // ... existing fields
  
  // Liveness Detection
  clockInLivenessScore     Float?
  clockInLivenessChallenge String?   // "blink", "head_turn", "smile"
  
  // Face Recognition  
  clockInFaceMatchScore    Float?    // 0.0 - 1.0 confidence
  clockInFaceVerified      Boolean   @default(false)
  
  // Clock-out fields
  clockOutLivenessScore    Float?
  clockOutLivenessChallenge String?
  clockOutFaceMatchScore   Float?
  clockOutFaceVerified     Boolean   @default(false)
}
```

### Organization Model - Add Face Recognition Settings

```prisma
model Organization {
  // ... existing fields
  
  // Face Recognition Settings (Admin configurable)
  requireFaceRecognition   Boolean   @default(false)
  requireLivenessDetection Boolean   @default(true)
  faceMatchThreshold       Float     @default(0.6)    // 60% match required
  livenessScoreThreshold   Float     @default(0.7)    // 70% liveness required
  
  // Who can register faces
  allowSelfRegistration    Boolean   @default(true)   // Employees can register themselves
}
```

---

## Security Layers Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: GPS Validation                                    │
│  └── Is user within office radius?                          │
│      └── Configurable: yes/no/optional                      │
│                                                             │
│  Layer 2: Liveness Detection                                │
│  └── Is a real human present? (not photo/video)             │
│      └── Challenge: blink, head turn, or smile              │
│      └── Score threshold: 70% (configurable)                │
│                                                             │
│  Layer 3: Face Recognition                                  │
│  └── Is this the correct employee? (identity verification)  │
│      └── Compare with registered face embedding             │
│      └── Score threshold: 60% (configurable)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Flows

### Flow 1: Face Registration

```
┌─────────────────────────────────────────────────────────────┐
│                  FACE REGISTRATION FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WHO: Employee (self) or Admin                              │
│  WHERE: Settings page > Face Registration                   │
│                                                             │
│  Step 1: Initialize Camera                                  │
│  ┌─────────────────────────────────────────┐               │
│  │  ╭─────────────────────────────────╮   │               │
│  │  │                                 │   │               │
│  │  │    Position your face here      │   │               │
│  │  │         📷                      │   │               │
│  │  │                                 │   │               │
│  │  ╰─────────────────────────────────╯   │               │
│  │                                         │               │
│  │  Status: Looking for face...            │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Step 2: Liveness Challenge (3 random challenges)           │
│  ┌─────────────────────────────────────────┐               │
│  │  Challenge 1/3: "Blink your eyes"       │               │
│  │  ─────────●──────────                   │               │
│  │  ✅ Detected!                           │               │
│  │                                         │               │
│  │  Challenge 2/3: "Turn head slightly"    │               │
│  │  ──────────────●──────                  │               │
│  │  ⏳ Waiting...                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Step 3: Capture Multiple Angles                            │
│  - Front facing (required)                                  │
│  - Slight left turn (optional, better accuracy)             │
│  - Slight right turn (optional, better accuracy)            │
│                                                             │
│  Step 4: Extract Face Embedding                             │
│  - face-api.js extracts 128-dimension vector                │
│  - Average multiple captures for better accuracy            │
│                                                             │
│  Step 5: Store in Database                                  │
│  - Save embedding as JSON string                            │
│  - Save reference photo to Supabase Storage                 │
│  - Set faceRegistered = true                                │
│                                                             │
│  Step 6: Success!                                           │
│  ┌─────────────────────────────────────────┐               │
│  │  ✅ Face Registered Successfully!       │               │
│  │                                         │               │
│  │  [Reference Photo]                      │               │
│  │                                         │               │
│  │  You can now use face verification      │               │
│  │  for clock-in.                          │               │
│  │                                         │               │
│  │  [Done]                                 │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Clock-In with Face Verification

```
┌─────────────────────────────────────────────────────────────┐
│           CLOCK-IN WITH FACE VERIFICATION                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TRIGGER: User clicks "Clock In" button                     │
│  CHECK: Is face recognition required for this org?          │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 1: GPS Check                                       ││
│  │                                                         ││
│  │ If GPS required:                                        ││
│  │   ├── Within radius → Continue to Step 2                ││
│  │   └── Outside radius → Show warning, allow continue?    ││
│  │                                                         ││
│  │ If GPS not required:                                    ││
│  │   └── Skip to Step 2                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 2: Initialize Face Camera                         ││
│  │                                                         ││
│  │ ┌───────────────────────────────────────┐              ││
│  │ │  ╭───────────────────────────────╮   │              ││
│  │ │  │                               │   │              ││
│  │ │  │      [Camera Feed]            │   │              ││
│  │ │  │                               │   │              ││
│  │ │  ╰───────────────────────────────╯   │              ││
│  │ │                                       │              ││
│  │ │  Status: 🔄 Loading face detection... │              ││
│  │ └───────────────────────────────────────┘              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 3: Liveness Detection (~2-3 seconds)              ││
│  │                                                         ││
│  │ ┌───────────────────────────────────────┐              ││
│  │ │  Challenge: "Blink your eyes"         │              ││
│  │ │                                       │              ││
│  │ │  ┌───────────────────────────────┐   │              ││
│  │ │  │                               │   │              ││
│  │ │  │      [Camera Feed]            │   │              ││
│  │ │  │      with face box overlay    │   │              ││
│  │ │  │                               │   │              ││
│  │ │  ╰───────────────────────────────╯   │              ││
│  │ │                                       │              ││
│  │ │  Liveness Checks:                     │              ││
│  │ │  ✅ Face detected                     │              ││
│  │ │  ✅ Real person (not photo)           │              ││
│  │ │  ⏳ Waiting for blink...              │              ││
│  │ │                                       │              ││
│  │ │  Score: 0.85 / 0.70 required          │              ││
│  │ └───────────────────────────────────────┘              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 4: Face Recognition (~0.5 seconds)                ││
│  │                                                         ││
│  │ ┌───────────────────────────────────────┐              ││
│  │ │  🔄 Verifying your identity...        │              ││
│  │ │                                       │              ││
│  │ │  [Loading spinner]                    │              ││
│  │ │                                       │              ││
│  │ │  Comparing face with registered       │              ││
│  │ │  profile...                           │              ││
│  │ └───────────────────────────────────────┘              ││
│  │                                                         ││
│  │ Process:                                                ││
│  │ 1. Extract 128-dim embedding from captured frame        ││
│  │ 2. Load user's stored embedding from database           ││
│  │ 3. Calculate Euclidean distance                         ││
│  │ 4. Convert distance to similarity score (0.0 - 1.0)     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 5: Result                                         ││
│  │                                                         ││
│  │ SUCCESS (match score >= threshold):                     ││
│  │ ┌───────────────────────────────────────┐              ││
│  │ │  ✅ Identity Verified!                │              ││
│  │ │                                       │              ││
│  │ │  Liveness: 85% ✓                      │              ││
│  │ │  Face Match: 92% ✓                    │              ││
│  │ │                                       │              ││
│  │ │  Clock-in successful!                 │              ││
│  │ │  Time: 08:45:32                       │              ││
│  │ └───────────────────────────────────────┘              ││
│  │                                                         ││
│  │ FAILURE (match score < threshold):                      ││
│  │ ┌───────────────────────────────────────┐              ││
│  │ │  ❌ Verification Failed               │              ││
│  │ │                                       │              ││
│  │ │  Liveness: 85% ✓                      │              ││
│  │ │  Face Match: 45% ✗                    │              ││
│  │ │                                       │              ││
│  │ │  Face does not match registered       │              ││
│  │ │  profile. Please try again or         │              ││
│  │ │  contact your administrator.          │              ││
│  │ │                                       │              ││
│  │ │  [Try Again]                          │              ││
│  │ └───────────────────────────────────────┘              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Step 6: Store Results                                  ││
│  │                                                         ││
│  │ Attendance Record:                                      ││
│  │ - clockInLivenessScore: 0.85                            ││
│  │ - clockInLivenessChallenge: "blink"                     ││
│  │ - clockInFaceMatchScore: 0.92                           ││
│  │ - clockInFaceVerified: true                             ││
│  │ - clockInPhoto: [stored in Supabase Storage]            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── components/
│   └── face/
│       ├── FaceRegistration.tsx        # Complete registration flow
│       ├── FaceVerification.tsx        # Clock-in verification flow
│       ├── CameraWithGuide.tsx         # Camera + face positioning overlay
│       ├── LivenessChallenge.tsx       # Active challenge UI
│       ├── LivenessIndicator.tsx       # Real-time status display
│       ├── FaceRegistrationStatus.tsx  # Show registration status
│       └── AdminFaceSettings.tsx       # Admin toggle settings
│
├── hooks/
│   └── useFaceDetection.ts             # Hook for face detection logic
│
├── lib/
│   └── face/
│       ├── index.ts                    # Export all face utilities
│       ├── liveness.ts                 # MediaPipe liveness detection
│       ├── recognition.ts              # face-api.js recognition
│       ├── embedding.ts                # Embedding extraction/storage
│       ├── comparison.ts               # Face comparison logic
│       ├── constants.ts                # Thresholds, config
│       └── types.ts                    # TypeScript types
│
├── app/
│   └── api/
│       ├── face/
│       │   ├── register/
│       │   │   └── route.ts            # Save face embedding
│       │   └── verify/
│       │       └── route.ts            # Verify face (optional server-side)
│       └── attendance/
│           └── route.ts                # Updated with face fields
│
└── store/
    └── index.ts                        # Add face-related actions
```

---

## Component Specifications

### 1. FaceRegistration.tsx

```typescript
interface FaceRegistrationProps {
  userId: string                    // User to register (for admin use)
  onSuccess?: () => void            // Callback on successful registration
  onCancel?: () => void             // Callback on cancel
  allowMultipleAttempts?: boolean   // Allow re-registration
}

// Features:
// - Camera initialization
// - Face detection with guide overlay
// - Liveness challenge (3 random challenges)
// - Multiple angle capture
// - Progress indicator
// - Success/failure states
// - Retry functionality
```

### 2. FaceVerification.tsx

```typescript
interface FaceVerificationProps {
  userId: string                    // Current user ID
  requiredLivenessScore: number     // Threshold (default: 0.7)
  requiredMatchScore: number        // Threshold (default: 0.6)
  onVerified: (result: VerificationResult) => void
  onCancel: () => void
}

interface VerificationResult {
  success: boolean
  livenessScore: number
  faceMatchScore: number
  capturedPhoto: string             // Base64
  error?: string
}

// Features:
// - Quick liveness check (single challenge)
// - Face comparison with stored embedding
// - Real-time feedback
// - Timeout handling
// - Multiple retry support
```

### 3. CameraWithGuide.tsx

```typescript
interface CameraWithGuideProps {
  onFaceDetected: (face: DetectedFace) => void
  onFaceLost: () => void
  showGuide: boolean                 // Show face positioning oval
  mirrorMode: boolean                // Mirror camera (selfie mode)
  width?: number
  height?: number
}

// Features:
// - Camera permission handling
// - Face detection overlay
// - Positioning guide (oval)
// - Mirror mode for selfie
// - Error handling for no camera
```

### 4. LivenessChallenge.tsx

```typescript
interface LivenessChallengeProps {
  challenges: Challenge[]            // Array of challenges to perform
  onChallengeComplete: (index: number, success: boolean) => void
  onAllComplete: (results: ChallengeResult[]) => void
  videoElement: HTMLVideoElement     // Reference to video
}

type Challenge = 'blink' | 'turn_left' | 'turn_right' | 'smile' | 'nod'

interface ChallengeResult {
  type: Challenge
  success: boolean
  score: number
  timestamp: number
}

// Features:
// - Random challenge selection
// - Real-time detection
// - Visual feedback
// - Progress tracking
// - Timeout for each challenge
```

---

## Library Implementation Details

### Liveness Detection (MediaPipe Face Mesh)

```typescript
// lib/face/liveness.ts

import { FaceMesh, Results } from '@mediapipe/face_mesh'

export interface LivenessResult {
  isReal: boolean
  score: number
  blinkDetected: boolean
  headMovement: 'none' | 'left' | 'right' | 'nod'
  mouthMovement: boolean
}

export class LivenessDetector {
  private faceMesh: FaceMesh
  
  constructor() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    })
    
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
  }
  
  // Detect blink using eye aspect ratio (EAR)
  async detectBlink(landmarks: Landmark[]): Promise<boolean> {
    // Left eye landmarks: 33, 160, 158, 133, 153, 144
    // Right eye landmarks: 362, 385, 387, 263, 373, 380
    // Calculate EAR and detect if below threshold
  }
  
  // Detect head turn using nose tip position
  async detectHeadTurn(landmarks: Landmark[]): Promise<'left' | 'right' | 'none'> {
    // Compare nose tip (landmark 1) position relative to face center
  }
  
  // Detect nod using chin position over time
  async detectNod(landmarks: Landmark[]): Promise<boolean> {
    // Track chin landmark (152) vertical movement
  }
  
  // Detect smile using mouth corners
  async detectSmile(landmarks: Landmark[]): Promise<boolean> {
    // Compare mouth corner distances (61, 291) with mouth height
  }
}
```

### Face Recognition (face-api.js)

```typescript
// lib/face/recognition.ts

import * as faceapi from 'face-api.js'

export interface FaceEmbedding {
  embedding: number[]              // 128-dimension vector
  timestamp: number
}

export class FaceRecognizer {
  private initialized = false
  
  async init(): Promise<void> {
    // Load models from CDN
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    this.initialized = true
  }
  
  // Extract face embedding from image/video
  async extractEmbedding(image: HTMLVideoElement | HTMLCanvasElement): Promise<number[] | null> {
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
    
    return detection ? Array.from(detection.descriptor) : null
  }
  
  // Compare two embeddings
  compareEmbeddings(embedding1: number[], embedding2: number[]): number {
    // Euclidean distance
    const distance = faceapi.euclideanDistance(embedding1, embedding2)
    
    // Convert to similarity score (0-1)
    // Lower distance = higher similarity
    // Typical threshold: 0.6 (distance < 0.6 = same person)
    const maxDistance = 1.0
    const similarity = Math.max(0, 1 - (distance / maxDistance))
    
    return similarity
  }
  
  // Check if match meets threshold
  isMatch(score: number, threshold: number = 0.6): boolean {
    return score >= threshold
  }
}
```

---

## Admin Settings UI

### Settings Page Addition

```typescript
// Add to SettingsContent.tsx

const faceRecognitionSettings = {
  icon: Shield,
  title: 'Face Recognition',
  description: 'Pengaturan verifikasi wajah untuk absensi',
  content: (
    <div className="space-y-6">
      {/* Enable/Disable Face Recognition */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Aktifkan Face Recognition</p>
          <p className="text-sm text-muted-foreground">
            Karyawan harus verifikasi wajah saat clock in/out
          </p>
        </div>
        <Switch 
          checked={settings.requireFaceRecognition}
          onCheckedChange={(checked) => updateSetting('requireFaceRecognition', checked)}
        />
      </div>
      
      <Separator />
      
      {/* Enable/Disable Liveness Detection */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Liveness Detection</p>
          <p className="text-sm text-muted-foreground">
            Deteksi apakah wajah asli (bukan foto/video)
          </p>
        </div>
        <Switch 
          checked={settings.requireLivenessDetection}
          onCheckedChange={(checked) => updateSetting('requireLivenessDetection', checked)}
        />
      </div>
      
      <Separator />
      
      {/* Face Match Threshold */}
      <div className="space-y-2">
        <Label>Tingkat Kecocokan Wajah: {Math.round(settings.faceMatchThreshold * 100)}%</Label>
        <Input 
          type="range"
          min="0.4"
          max="0.9"
          step="0.05"
          value={settings.faceMatchThreshold}
          onChange={(e) => updateSetting('faceMatchThreshold', parseFloat(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Lebih tinggi = lebih ketat, lebih rendah = lebih toleran
        </p>
      </div>
      
      <Separator />
      
      {/* Allow Self Registration */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Pendaftaran Mandiri</p>
          <p className="text-sm text-muted-foreground">
            Karyawan dapat mendaftarkan wajah sendiri
          </p>
        </div>
        <Switch 
          checked={settings.allowSelfRegistration}
          onCheckedChange={(checked) => updateSetting('allowSelfRegistration', checked)}
        />
      </div>
    </div>
  )
}
```

---

## Store Actions Addition

```typescript
// Add to store/index.ts

interface AppState {
  // ... existing fields
  
  // Face-related actions
  registerFace: (embedding: number[], photoUrl: string) => Promise<{ success: boolean; message: string }>
  getFaceStatus: () => Promise<{ registered: boolean; registeredAt?: string }>
}

// Implementation
registerFace: async (embedding, photoUrl) => {
  try {
    const data = await apiCall('/api/face/register', {
      method: 'POST',
      body: JSON.stringify({ 
        embedding, 
        photoUrl 
      }),
    })
    
    if (data.success) {
      // Update local user state
      set((state) => ({
        currentUser: state.currentUser 
          ? { ...state.currentUser, faceRegistered: true, faceRegisteredAt: new Date().toISOString() }
          : null
      }))
    }
    
    return { success: data.success, message: data.message }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
},
```

---

## API Endpoints

### POST /api/face/register

```typescript
// app/api/face/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    const { embedding, photoUrl } = await request.json()
    
    // Validate embedding (should be 128 numbers)
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json({ success: false, message: 'Invalid face embedding' }, { status: 400 })
    }
    
    // Store embedding as JSON string
    await db.user.update({
      where: { id: user.id },
      data: {
        faceRegistered: true,
        faceEmbedding: JSON.stringify(embedding),
        faceRegisteredAt: new Date(),
        facePhotoUrl: photoUrl,
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Face registered successfully' 
    })
  } catch (error) {
    console.error('Face registration error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to register face' 
    }, { status: 500 })
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (2 days)
- [ ] Install dependencies (MediaPipe, face-api.js)
- [ ] Create database schema migrations
- [ ] Add face settings to Organization model
- [ ] Create basic API endpoints

### Phase 2: Face Registration (3 days)
- [ ] Create CameraWithGuide component
- [ ] Implement LivenessDetector class
- [ ] Build FaceRegistration component
- [ ] Connect to API and store
- [ ] Add UI for viewing registration status

### Phase 3: Face Verification (3 days)
- [ ] Create FaceRecognizer class
- [ ] Build FaceVerification component
- [ ] Integrate with clock-in flow
- [ ] Handle success/failure states

### Phase 4: Admin Settings (1 day)
- [ ] Add face recognition settings to Settings page
- [ ] Toggle enable/disable
- [ ] Configure thresholds
- [ ] Manage self-registration permission

### Phase 5: Testing & Polish (2 days)
- [ ] Test on various devices (iOS, Android, desktop)
- [ ] Test in different lighting conditions
- [ ] Optimize model loading
- [ ] Handle edge cases (no camera, permission denied)
- [ ] Add loading states and error handling

### Phase 6: Documentation (0.5 days)
- [ ] Update README with feature documentation
- [ ] Add user guide for face registration
- [ ] Document API endpoints

---

## Total Estimated Time: ~11.5 days

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Model loading slow** | Use CDN, show loading progress, lazy load |
| **Poor detection in low light** | Show warning, suggest better lighting |
| **No camera permission** | Clear error message with instructions |
| **Old browser incompatibility** | Feature detection, fallback to GPS-only |
| **False positives/negatives** | Adjustable thresholds, multiple attempts |
| **Privacy concerns** | Clear consent, local processing, encrypted storage |

---

## Success Metrics

- Registration success rate > 95%
- Verification speed < 3 seconds
- False rejection rate < 5%
- False acceptance rate < 1%
- User satisfaction score > 4.5/5

---

## Future Enhancements

1. **Passive Liveness** - No challenges required, AI detects automatically
2. **3D Face Maps** - More accurate depth-based detection
3. **Voice Verification** - Additional security layer
4. **Multi-factor** - Combine with PIN or password
5. **Audit Logs** - Track all face verification attempts

---

*Last updated: 2025*
