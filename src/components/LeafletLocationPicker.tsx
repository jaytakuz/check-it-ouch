import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  radius?: number;
  className?: string;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const LeafletLocationPicker = ({ value, onChange, radius = 50, className }: LocationPickerProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const defaultCenter: [number, number] = value 
    ? [value.lat, value.lng] 
    : userLocation 
    ? [userLocation.lat, userLocation.lng]
    : [13.7563, 100.5018]; // Bangkok default

  const handleMapClick = (lat: number, lng: number) => {
    onChange({ lat, lng });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        onChange({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="aspect-video rounded-xl overflow-hidden border border-border relative">
        <MapContainer
          center={defaultCenter}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} />
              <Circle
                center={[value.lat, value.lng]}
                radius={radius}
                pathOptions={{
                  color: "hsl(var(--primary))",
                  fillColor: "hsl(var(--primary))",
                  fillOpacity: 0.2,
                }}
              />
              <RecenterMap center={[value.lat, value.lng]} />
            </>
          )}
        </MapContainer>

        {!value && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <p className="text-sm text-muted-foreground">Click on the map to set location</p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleUseCurrentLocation}
        disabled={isGettingLocation}
      >
        <Crosshair size={18} />
        {isGettingLocation ? "Getting location..." : "Use Current Location"}
      </Button>

      {value && (
        <p className="text-xs text-muted-foreground text-center">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default LeafletLocationPicker;
