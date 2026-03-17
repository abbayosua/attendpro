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

// Custom icon for current location (yellow/amber with pulse effect)
const currentLocationIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="position: relative;">
      <div style="
        background-color: #f59e0b;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
        z-index: 2;
      "></div>
      <div style="
        background-color: rgba(245, 158, 11, 0.3);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        position: absolute;
        top: -8px;
        left: -8px;
        animation: pulse 2s infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    </style>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Custom icon for clock-in location (green)
const clockInIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #22c55e;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// Custom icon for clock-out location (red)
const clockOutIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #ef4444;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// Custom icon for office location (blue)
const officeIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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

// Component to recenter map when location changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [map, center])
  
  return null
}

interface AttendanceMapProps {
  currentLocation?: { lat: number; lng: number } | null
  clockInLocation?: { lat: number; lng: number } | null
  clockOutLocation?: { lat: number; lng: number } | null
  officeLocation?: { lat: number; lng: number }
  gpsRadius?: number
  height?: string
}

function AttendanceMapInner({
  currentLocation,
  clockInLocation,
  clockOutLocation,
  officeLocation,
  gpsRadius = 100,
  height = '300px',
}: AttendanceMapProps) {
  // Calculate center point - prioritize current location
  const center = (() => {
    if (currentLocation) return [currentLocation.lat, currentLocation.lng] as [number, number]
    if (clockInLocation) return [clockInLocation.lat, clockInLocation.lng] as [number, number]
    if (clockOutLocation) return [clockOutLocation.lat, clockOutLocation.lng] as [number, number]
    if (officeLocation) return [officeLocation.lat, officeLocation.lng] as [number, number]
    return [-6.2088, 106.8456] as [number, number] // Default: Jakarta
  })()

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapInvalidator />
        <MapRecenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Office location with radius circle */}
        {officeLocation && (
          <>
            <Marker 
              position={[officeLocation.lat, officeLocation.lng]} 
              icon={officeIcon}
            />
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

        {/* Current location marker - highest priority to show user's real position */}
        {currentLocation && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]} 
            icon={currentLocationIcon}
          />
        )}

        {/* Clock-in location marker */}
        {clockInLocation && (
          <Marker 
            position={[clockInLocation.lat, clockInLocation.lng]} 
            icon={clockInIcon}
          />
        )}

        {/* Clock-out location marker */}
        {clockOutLocation && (
          <Marker 
            position={[clockOutLocation.lat, clockOutLocation.lng]} 
            icon={clockOutIcon}
          />
        )}
      </MapContainer>
    </div>
  )
}

export function AttendanceMap(props: AttendanceMapProps) {
  const isClient = useIsClient()
  const hasLocations = props.currentLocation || props.clockInLocation || props.clockOutLocation || props.officeLocation

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
