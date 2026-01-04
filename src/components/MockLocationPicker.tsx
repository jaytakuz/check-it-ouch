import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Default mock location (Bangkok, Thailand)
const DEFAULT_LOCATION = { lat: 13.7563, lng: 100.5018 };

interface MockLocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  radius?: number;
  className?: string;
}

const MockLocationPicker = ({ value, onChange, radius = 50, className }: MockLocationPickerProps) => {
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  const handleSetLocation = () => {
    setIsSettingLocation(true);
    // Simulate getting location with a slight delay
    setTimeout(() => {
      onChange(DEFAULT_LOCATION);
      setIsSettingLocation(false);
    }, 500);
  };

  const currentLocation = value || null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mock Map Display */}
      <div className="aspect-video rounded-xl overflow-hidden border border-border relative bg-muted">
        {/* Mock map background with grid pattern */}
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

        {/* Mock location marker and radius */}
        {currentLocation ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Radius circle */}
            <div 
              className="absolute rounded-full bg-primary/20 border-2 border-primary/40"
              style={{
                width: `${Math.min(radius * 2, 200)}px`,
                height: `${Math.min(radius * 2, 200)}px`,
              }}
            />
            {/* Marker */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <MapPin size={20} className="text-primary-foreground" />
              </div>
              <div className="w-2 h-2 bg-primary rounded-full mt-1" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p className="text-sm text-muted-foreground">Click button below to set location</p>
          </div>
        )}

        {/* Map label */}
        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border">
          📍 Mock Map (Demo Mode)
        </div>
      </div>

      {/* Set Location Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleSetLocation}
        disabled={isSettingLocation}
      >
        <Navigation size={18} />
        {isSettingLocation ? "Setting location..." : value ? "Update Location" : "Set Event Location"}
      </Button>

      {/* Coordinates display */}
      {currentLocation && (
        <p className="text-xs text-muted-foreground text-center">
          {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          <span className="ml-2 text-primary">(Demo coordinates)</span>
        </p>
      )}
    </div>
  );
};

export default MockLocationPicker;
