// Face Recognition Library Exports

export * from './constants'
export * from './types'

// Re-export types from face-api.js and mediapipe
export type { FaceDetection, FaceLandmarks68, WithFaceDescriptor } from 'face-api.js'
