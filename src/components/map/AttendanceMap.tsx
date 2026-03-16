'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

// Custom hook for client-side only rendering
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

// Component to handle map invalidateSize
function MapInvalidator() {
  const map = useMap()
  
  useEffect(() => {
    // Invalidate size after component mounts and a short delay
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)
    
    // Also invalidate on window resize
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [map])
  
  return null
}

interface AttendanceMapProps {
  clockInLocation?: { lat: number; lng: number } | null
  clockOutLocation?: { lat: number; lng: number } | null
  officeLocation?: { lat: number; lng: number } | null
  gpsRadius?: number
  height?: string
}

function AttendanceMapInner({
  clockInLocation,
  clockOutLocation,
  officeLocation,
  gpsRadius = 100,
  height = '300px',
}: AttendanceMapProps) {
  // Calculate center point
  const center = (() => {
    if (clockInLocation) return [clockInLocation.lat, clockInLocation.lng] as [number, number]
    if (clockOutLocation) return [clockOutLocation.lat, clockOutLocation.lng] as [number, number]
    if (officeLocation) return [officeLocation.lat, officeLocation.lng] as [number, number]
    return [-6.2088, 106.8456] as [number, number] // Default: Jakarta
  })()

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {officeLocation && (
          <>
            <Marker position={[officeLocation.lat, officeLocation.lng]} />
            <Circle
              center={[officeLocation.lat, officeLocation.lng]}
              radius={gpsRadius}
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.15, 
                color: '#3b82f6',
                weight: 2
              }}
            />
          </>
        )}

        {clockInLocation && (
          <Marker position={[clockInLocation.lat, clockInLocation.lng]} />
        )}

        {clockOutLocation && (
          <Marker position={[clockOutLocation.lat, clockOutLocation.lng]} />
        )}
      </MapContainer>
    </div>
  )
}

export function AttendanceMap(props: AttendanceMapProps) {
  const isClient = useIsClient()
  const hasLocations = props.clockInLocation || props.clockOutLocation || props.officeLocation

  if (!isClient || !hasLocations) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center"
        style={{ height: props.height || '300px' }}
      >
        <p className="text-muted-foreground text-sm">Memuat peta...</p>
      </div>
    )
  }

  return <AttendanceMapInner {...props} />
}
