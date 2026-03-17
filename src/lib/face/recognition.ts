'use client'

import * as faceapi from 'face-api.js'
import { 
  DEFAULT_FACE_MATCH_THRESHOLD, 
  EMBEDDING_DIMENSIONS,
  DETECTION_INTERVAL,
  ERROR_MESSAGES,
} from './constants'
import type { DetectedFace } from './types'

// Model URL - using a CDN that hosts face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

export class FaceRecognizer {
  private initialized = false
  private loading = false
  private loadPromise: Promise<void> | null = null

  constructor() {
    this.init = this.init.bind(this)
    this.detectFace = this.detectFace.bind(this)
    this.extractEmbedding = this.extractEmbedding.bind(this)
    this.compareFaces = this.compareFaces.bind(this)
  }

  // Initialize and load models
  async init(): Promise<void> {
    if (this.initialized) return
    if (this.loading && this.loadPromise) {
      return this.loadPromise
    }

    this.loading = true
    this.loadPromise = this.loadModels()
    await this.loadPromise
    this.loading = false
  }

  private async loadModels(): Promise<void> {
    try {
      // Load required models in parallel
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to load face-api.js models:', error)
      throw new Error('Gagal memuat model deteksi wajah')
    }
  }

  // Check if models are loaded
  isInitialized(): boolean {
    return this.initialized
  }

  // Detect face in video/image
  async detectFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectedFace | null> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks()

      if (!detection) {
        return null
      }

      const { box } = detection.detection
      const { landmarks } = detection

      return {
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        landmarks: {
          leftEye: landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y })),
          rightEye: landmarks.getRightEye().map(p => ({ x: p.x, y: p.y })),
          nose: landmarks.getNose()[0] ? { x: landmarks.getNose()[0].x, y: landmarks.getNose()[0].y } : { x: 0, y: 0 },
          mouth: landmarks.getMouth().map(p => ({ x: p.x, y: p.y })),
          jawline: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y })),
        },
        confidence: detection.detection.score,
      }
    } catch (error) {
      console.error('Face detection error:', error)
      return null
    }
  }

  // Extract face embedding (128-dimension vector)
  async extractEmbedding(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<number[] | null> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        return null
      }

      // Convert Float32Array to regular array
      return Array.from(detection.descriptor) as number[]
    } catch (error) {
      console.error('Face embedding extraction error:', error)
      return null
    }
  }

  // Detect face and extract embedding in one call
  async detectAndExtract(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<{ face: DetectedFace; embedding: number[] } | null> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        return null
      }

      const { box } = detection.detection
      const { landmarks } = detection

      const face: DetectedFace = {
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        landmarks: {
          leftEye: landmarks.getLeftEye().map(p => ({ x: p.x, y: p.y })),
          rightEye: landmarks.getRightEye().map(p => ({ x: p.x, y: p.y })),
          nose: landmarks.getNose()[0] ? { x: landmarks.getNose()[0].x, y: landmarks.getNose()[0].y } : { x: 0, y: 0 },
          mouth: landmarks.getMouth().map(p => ({ x: p.x, y: p.y })),
          jawline: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y })),
        },
        confidence: detection.detection.score,
        embedding: Array.from(detection.descriptor) as number[],
      }

      return {
        face,
        embedding: Array.from(detection.descriptor) as number[],
      }
    } catch (error) {
      console.error('Face detection and extraction error:', error)
      return null
    }
  }

  // Compare two face embeddings
  compareFaces(
    embedding1: number[],
    embedding2: number[],
    threshold: number = DEFAULT_FACE_MATCH_THRESHOLD
  ): { match: boolean; score: number; distance: number } {
    // Validate embeddings
    if (!embedding1 || !embedding2 || 
        embedding1.length !== EMBEDDING_DIMENSIONS || 
        embedding2.length !== EMBEDDING_DIMENSIONS) {
      return { match: false, score: 0, distance: 1 }
    }

    // Calculate Euclidean distance
    let sum = 0
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)

    // Convert distance to similarity score (0-1)
    // Typical threshold: distance < 0.6 = same person
    // Lower distance = higher similarity
    const maxDistance = 1.0
    const score = Math.max(0, 1 - (distance / maxDistance))

    return {
      match: score >= threshold,
      score,
      distance,
    }
  }

  // Calculate average embedding from multiple captures
  averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []
    if (embeddings.length === 1) return embeddings[0]

    const avgEmbedding: number[] = new Array(EMBEDDING_DIMENSIONS).fill(0)

    for (const emb of embeddings) {
      for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
        avgEmbedding[i] += emb[i]
      }
    }

    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      avgEmbedding[i] /= embeddings.length
    }

    return avgEmbedding
  }

  // Create face canvas from video frame
  createFaceCanvas(
    input: HTMLVideoElement | HTMLImageElement,
    faceBox: { x: number; y: number; width: number; height: number },
    padding: number = 0.2
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return canvas

    // Add padding around face
    const padW = faceBox.width * padding
    const padH = faceBox.height * padding
    
    const sx = Math.max(0, faceBox.x - padW)
    const sy = Math.max(0, faceBox.y - padH)
    const sw = faceBox.width + padW * 2
    const sh = faceBox.height + padH * 2

    canvas.width = sw
    canvas.height = sh

    ctx.drawImage(input, sx, sy, sw, sh, 0, 0, sw, sh)

    return canvas
  }

  // Cleanup
  destroy(): void {
    this.initialized = false
    this.loading = false
    this.loadPromise = null
  }
}

// Singleton instance
let faceRecognizerInstance: FaceRecognizer | null = null

export function getFaceRecognizer(): FaceRecognizer {
  if (!faceRecognizerInstance) {
    faceRecognizerInstance = new FaceRecognizer()
  }
  return faceRecognizerInstance
}

export function destroyFaceRecognizer(): void {
  if (faceRecognizerInstance) {
    faceRecognizerInstance.destroy()
    faceRecognizerInstance = null
  }
}

// Utility functions

// Convert base64 image to HTMLImageElement
export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = base64
  })
}

// Convert video frame to base64
export function videoToBase64(video: HTMLVideoElement, mirror: boolean = true): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  
  ctx.drawImage(video, 0, 0)
  
  return canvas.toDataURL('image/jpeg', 0.8)
}

// Calculate embedding from stored JSON string
export function parseEmbedding(embeddingJson: string): number[] | null {
  try {
    const embedding = JSON.parse(embeddingJson)
    if (Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSIONS) {
      return embedding
    }
    return null
  } catch {
    return null
  }
}

// Stringify embedding for storage
export function stringifyEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding)
}
