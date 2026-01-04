import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, AlertCircle, Loader2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

// Demo/Mock Map component for fallback
function MockMapFallback({
  eventLocation,
  radiusMeters,
  onLocationVerified,
  className,
}: LocationMapProps) {
  const [demoState, setDemoState] = useState<"in_range" | "out_of_range">("in_range");

  const toggleDemoState = () => {
    const newState = demoState === "in_range" ? "out_of_range" : "in_range";
    setDemoState(newState);
    const dist = newState === "in_range" ? radiusMeters * 0.5 : radiusMeters * 2;
    onLocationVerified?.(newState === "in_range", dist);
  };

  useEffect(() => {
    // Initialize as in-range for demo
    onLocationVerified?.(true, radiusMeters * 0.5);
  }, [onLocationVerified, radiusMeters]);

  const isWithinRadius = demoState === "in_range";

  return (
    <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
      <div className="h-48 relative bg-muted">
        {/* Mock map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Event marker and radius */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={cn(
              "absolute rounded-full border-2",
              isWithinRadius 
                ? "bg-success/20 border-success/40" 
                : "bg-destructive/20 border-destructive/40"
            )}
            style={{ width: `${Math.min(radiusMeters * 1.5, 150)}px`, height: `${Math.min(radiusMeters * 1.5, 150)}px` }}
          />
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
            <MapPin size={20} className="text-primary-foreground" />
          </div>
          
          {/* User marker */}
          <div 
            className={cn(
              "absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg",
              isWithinRadius ? "translate-x-6 translate-y-4" : "translate-x-24 translate-y-16"
            )}
          >
            <div className="absolute inset-0 w-4 h-4 bg-blue-500/50 rounded-full animate-ping" />
          </div>
        </div>

        {/* Demo mode badge */}
        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border">
          📍 Demo Mode
        </div>

        {/* Toggle button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-3 right-3"
          onClick={toggleDemoState}
        >
          <Navigation size={14} className="mr-1" />
          Toggle Position
        </Button>
      </div>

      {/* Status bar */}
      <div
        className={cn(
          "p-3 flex items-center gap-3",
          isWithinRadius ? "bg-success/10" : "bg-destructive/10"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isWithinRadius ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}
        >
          <MapPin size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isWithinRadius ? "Within range ✓ (Demo)" : "Outside range (Demo)"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isWithinRadius 
              ? `~${Math.round(radiusMeters * 0.5)}m from venue`
              : `~${Math.round(radiusMeters * 2)}m from venue`
            }
            {` • Required: within ${radiusMeters}m`}
          </p>
        </div>
      </div>
    </div>
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
  const [useDemoMode, setUseDemoMode] = useState(false);

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
    const timer = setTimeout(() => setMapReady(true), 100);
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

  // Show demo mode fallback if there's an error or user chooses demo mode
  if (locationError || useDemoMode) {
    return (
      <div className="space-y-2">
        <MockMapFallback
          eventLocation={eventLocation}
          radiusMeters={radiusMeters}
          onLocationVerified={onLocationVerified}
          className={className}
        />
        {locationError && !useDemoMode && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle size={16} className="text-destructive" />
              {locationError}
            </div>
            <Button size="sm" variant="outline" onClick={() => setUseDemoMode(true)}>
              Use Demo Mode
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
      <div className="h-48 relative bg-muted">
        {mapReady ? (
          <MapContainer
            key="location-map"
            center={mapCenter}
            zoom={17}
            scrollWheelZoom={false}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
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
                    color: isWithinRadius ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
                    fillColor: isWithinRadius ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
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
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className={cn(
          "p-3 flex items-center gap-3",
          isWithinRadius ? "bg-success/10" : "bg-muted"
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
