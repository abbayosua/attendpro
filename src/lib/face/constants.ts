// Face Recognition Constants

// Liveness Detection
export const LIVENESS_CHALLENGES = ['blink', 'turn_left', 'turn_right', 'smile', 'nod'] as const
export type LivenessChallengeType = typeof LIVENESS_CHALLENGES[number]

// Default thresholds
export const DEFAULT_FACE_MATCH_THRESHOLD = 0.6        // 60% match required
export const DEFAULT_LIVENESS_SCORE_THRESHOLD = 0.7    // 70% liveness required

// Face detection constraints
export const MIN_FACE_SIZE = 80           // Minimum face size in pixels
export const MAX_FACE_SIZE = 800          // Maximum face size in pixels
export const EMBEDDING_DIMENSIONS = 128   // face-api.js produces 128-dimension embeddings

// Timing
export const CHALLENGE_TIMEOUT = 5000     // 5 seconds per challenge
export const DETECTION_INTERVAL = 100     // Check every 100ms

// Eye Aspect Ratio (EAR) for blink detection
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
// Lower EAR = closed eyes
export const EAR_THRESHOLD = 0.2          // Below this = eyes closed
export const EAR_CONSECUTIVE_FRAMES = 3   // Number of frames eyes must be closed

// Head pose thresholds
export const HEAD_TURN_THRESHOLD = 15     // Degrees of turn required
export const HEAD_NOD_THRESHOLD = 10      // Degrees of nod required

// Model URLs (loaded from CDN)
export const FACE_API_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
export const MEDIAPIPE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh'

// Error messages
export const ERROR_MESSAGES = {
  NO_CAMERA: 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.',
  CAMERA_PERMISSION: 'Izin kamera ditolak. Berikan izin kamera untuk menggunakan fitur ini.',
  NO_FACE: 'Wajah tidak terdeteksi. Posisikan wajah Anda di dalam bingkai.',
  MULTIPLE_FACES: 'Terdeteksi lebih dari satu wajah. Pastikan hanya satu orang dalam bingkai.',
  FACE_TOO_SMALL: 'Wajah terlalu jauh. Mendekatlah ke kamera.',
  FACE_TOO_LARGE: 'Wajah terlalu dekat. Jauhi sedikit dari kamera.',
  LIVENESS_FAILED: 'Verifikasi liveness gagal. Pastikan Anda adalah orang asli.',
  CHALLENGE_TIMEOUT: 'Waktu habis. Silakan coba lagi.',
  EMBEDDING_FAILED: 'Gagal mengekstrak fitur wajah. Coba dengan pencahayaan yang lebih baik.',
  NOT_REGISTERED: 'Wajah belum terdaftar. Silakan daftarkan wajah terlebih dahulu.',
  FACE_NOT_MATCHED: 'Wajah tidak cocok dengan data terdaftar.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  FACE_DETECTED: 'Wajah terdeteksi',
  REGISTERED: 'Wajah berhasil didaftarkan',
  VERIFIED: 'Verifikasi wajah berhasil',
  LIVENESS_PASSED: 'Liveness verification berhasil',
}
