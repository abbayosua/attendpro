'use client'

import { useSyncExternalStore, useCallback, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import { MapPin, Loader2 } from 'lucide-react'
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

interface MapPickerProps {
  initialPosition?: [number, number]
  onPositionChange?: (lat: number, lng: number) => void
  officeLocation?: { lat: number; lng: number }
  gpsRadius?: number
  height?: string
  showRadius?: boolean
  readOnly?: boolean
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

function MapPickerInner({
  initialPosition,
  onPositionChange,
  officeLocation,
  gpsRadius = 100,
  height = '300px',
  showRadius = true,
  readOnly = false,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition || null
  )
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  // Default center (Jakarta)
  const defaultCenter: [number, number] = officeLocation 
    ? [officeLocation.lat, officeLocation.lng]
    : initialPosition || [-6.2088, 106.8456]

  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung browser ini')
      return
    }

    setIsLoadingLocation(true)
    setError(null)

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        })
      })
      
      const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      setPosition(newPosition)
      
      if (!readOnly && onPositionChange) {
        onPositionChange(pos.coords.latitude, pos.coords.longitude)
      }
      
      // Center map on new position
      if (mapInstance) {
        mapInstance.setView(newPosition, 17)
      }
    } catch {
      setError('Tidak dapat mengambil lokasi. Pastikan izin lokasi diaktifkan.')
    } finally {
      setIsLoadingLocation(false)
    }
  }, [readOnly, onPositionChange, mapInstance])

  const handleMapClick = useCallback((e: any) => {
    if (readOnly) return
    
    const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng]
    setPosition(newPosition)
    
    if (onPositionChange) {
      onPositionChange(e.latlng.lat, e.latlng.lng)
    }
  }, [readOnly, onPositionChange])

  // Setup map click handler
  useEffect(() => {
    if (!mapInstance || readOnly) return
    
    mapInstance.on('click', handleMapClick)
    return () => {
      mapInstance.off('click', handleMapClick)
    }
  }, [mapInstance, handleMapClick, readOnly])

  return (
    <div className="relative" style={{ height }}>
      {isLoadingLocation && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[1000] rounded-lg">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Mendapatkan lokasi...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 z-[1000]">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            ⚠️ {error}
          </p>
        </div>
      )}

      <MapContainer
        center={position || defaultCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={!readOnly}
        whenCreated={(map) => setMapInstance(map)}
      >
        <MapInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current/Selected Position Marker */}
        {position && <Marker position={position} />}

        {/* Office Location with Radius */}
        {officeLocation && showRadius && (
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
      </MapContainer>

      {/* Get Location Button */}
      {!readOnly && (
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          className="absolute top-2 right-2 z-[1000] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isLoadingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span>Lokasi Saya</span>
        </button>
      )}

      {/* Position Display */}
      {position && (
        <div className="absolute bottom-2 left-2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md">
            <p className="text-xs text-muted-foreground">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function MapPicker(props: MapPickerProps) {
  const isClient = useIsClient()

  if (!isClient) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center"
        style={{ height: props.height || '300px' }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <MapPickerInner {...props} />
}

export default MapPicker
