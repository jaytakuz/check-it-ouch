import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LocationMapProps {
  eventLocation: { lat: number; lng: number };
  radiusMeters: number;
  onLocationVerified?: (isWithinRadius: boolean, distance: number) => void;
  className?: string;
}

const LocationMap = ({ 
  eventLocation, 
  radiusMeters, 
  onLocationVerified,
  className 
}: LocationMapProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = (
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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

        const dist = calculateDistance(
          latitude, longitude,
          eventLocation.lat, eventLocation.lng
        );
        setDistance(dist);

        if (onLocationVerified) {
          onLocationVerified(dist <= radiusMeters, dist);
        }
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
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

  // Simple visual representation without Mapbox
  return (
    <div className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}>
      <div className="relative h-48 bg-muted flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Getting your location...</p>
          </div>
        ) : locationError ? (
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{locationError}</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Visual radius indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute w-32 h-32 rounded-full border-2 border-dashed",
                isWithinRadius ? "border-success bg-success/10" : "border-destructive bg-destructive/10"
              )}
            />
            
            {/* Event location marker */}
            <div className="absolute z-10 flex flex-col items-center">
              <MapPin className="w-8 h-8 text-primary" />
              <span className="text-xs text-muted-foreground mt-1">Event</span>
            </div>

            {/* User location indicator */}
            {userLocation && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute z-20",
                  isWithinRadius ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "top-4 right-4"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    isWithinRadius ? "bg-success" : "bg-destructive"
                  )}>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn(
                        "absolute inset-0 rounded-full",
                        isWithinRadius ? "bg-success/50" : "bg-destructive/50"
                      )}
                    />
                  </div>
                  <Navigation className="absolute -top-1 -right-1 w-3 h-3 text-foreground" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={cn(
        "p-3 flex items-center gap-3",
        isWithinRadius ? "bg-success/10" : locationError ? "bg-destructive/10" : "bg-muted"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isWithinRadius ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
        )}>
          <MapPin size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isLoading ? "Checking location..." : 
             locationError ? "Location unavailable" :
             isWithinRadius ? "Within range ✓" : "Outside range"}
          </p>
          {distance !== null && (
            <p className="text-xs text-muted-foreground">
              {distance < 1000 
                ? `${Math.round(distance)}m from venue`
                : `${(distance / 1000).toFixed(1)}km from venue`
              }
              {` • Required: within ${radiusMeters}m`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
