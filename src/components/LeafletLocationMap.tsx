import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for default marker icons
const eventIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="relative">
    <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
    <div class="absolute inset-0 w-4 h-4 bg-blue-500/50 rounded-full animate-ping"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface LocationMapProps {
  eventLocation: { lat: number; lng: number };
  radiusMeters: number;
  onLocationVerified?: (isWithinRadius: boolean, distance: number) => void;
  className?: string;
}

// Component to update map view
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Inner map content component
function MapContent({
  eventLocation,
  radiusMeters,
  userLocation,
  isWithinRadius,
  hasValidEventLocation,
  mapCenter,
}: {
  eventLocation: { lat: number; lng: number };
  radiusMeters: number;
  userLocation: { lat: number; lng: number } | null;
  isWithinRadius: boolean;
  hasValidEventLocation: boolean;
  mapCenter: [number, number];
}) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={mapCenter} zoom={17} />
      
      {hasValidEventLocation && (
        <>
          <Circle
            center={[eventLocation.lat, eventLocation.lng]}
            radius={radiusMeters}
            pathOptions={{
              color: isWithinRadius ? "hsl(var(--success))" : "hsl(var(--destructive))",
              fillColor: isWithinRadius ? "hsl(var(--success))" : "hsl(var(--destructive))",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
          <Marker position={[eventLocation.lat, eventLocation.lng]} icon={eventIcon} />
        </>
      )}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
      )}
    </>
  );
}

const LeafletLocationMap = ({
  eventLocation,
  radiusMeters,
  onLocationVerified,
  className,
}: LocationMapProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Delay map render to avoid React 18 strict mode issues
  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        setIsLoading(false);

        if (eventLocation.lat !== 0 && eventLocation.lng !== 0) {
          const dist = calculateDistance(
            latitude,
            longitude,
            eventLocation.lat,
            eventLocation.lng
          );
          setDistance(dist);

          if (onLocationVerified) {
            onLocationVerified(dist <= radiusMeters, dist);
          }
        }
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("Unknown error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [eventLocation, radiusMeters, onLocationVerified]);

  const isWithinRadius = distance !== null && distance <= radiusMeters;
  const hasValidEventLocation = eventLocation.lat !== 0 && eventLocation.lng !== 0;

  // Determine map center
  const mapCenter: [number, number] = hasValidEventLocation
    ? [eventLocation.lat, eventLocation.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [13.7563, 100.5018]; // Bangkok default

  if (isLoading) {
    return (
      <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
        <div className="h-48 flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Getting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
        <div className="h-48 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{locationError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
      <div className="h-48 relative bg-muted">
        {mapReady && (
          <MapContainer
            center={mapCenter}
            zoom={17}
            scrollWheelZoom={false}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <MapContent
              eventLocation={eventLocation}
              radiusMeters={radiusMeters}
              userLocation={userLocation}
              isWithinRadius={isWithinRadius}
              hasValidEventLocation={hasValidEventLocation}
              mapCenter={mapCenter}
            />
          </MapContainer>
        )}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className={cn(
          "p-3 flex items-center gap-3",
          isWithinRadius ? "bg-success/10" : locationError ? "bg-destructive/10" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isWithinRadius ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
          )}
        >
          <MapPin size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {!hasValidEventLocation
              ? "Waiting for event location..."
              : isWithinRadius
              ? "Within range ✓"
              : "Outside range"}
          </p>
          {distance !== null && hasValidEventLocation && (
            <p className="text-xs text-muted-foreground">
              {distance < 1000
                ? `${Math.round(distance)}m from venue`
                : `${(distance / 1000).toFixed(1)}km from venue`}
              {` • Required: within ${radiusMeters}m`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeafletLocationMap;
