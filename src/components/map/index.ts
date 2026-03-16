'use client'

import dynamic from 'next/dynamic'

// Export MapPicker as dynamic component
export const MapPicker = dynamic(
  () => import('./MapPicker').then((mod) => mod.MapPicker),
  { ssr: false }
)

// Export AttendanceMap as dynamic component
export const AttendanceMap = dynamic(
  () => import('./AttendanceMap').then((mod) => mod.AttendanceMap),
  { ssr: false }
)

// Export helper functions from separate utility file (SSR-safe)
export { calculateDistance, isWithinRadius } from './mapUtils'
