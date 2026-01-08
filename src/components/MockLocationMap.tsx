import { useState, useEffect } from "react";
import { MapPin, Navigation, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mockMapBg from "@/assets/mock-map-bg.png";

interface MockLocationMapProps {
  eventLocation: { lat: number; lng: number };
  radiusMeters: number;
  onLocationVerified?: (isWithinRadius: boolean, distance: number) => void;
  className?: string;
}

type DemoState = "checking" | "in_range" | "out_of_range";

const MockLocationMap = ({ 
  eventLocation, 
  radiusMeters, 
  onLocationVerified, 
  className 
}: MockLocationMapProps) => {
  const [demoState, setDemoState] = useState<DemoState>("checking");
  const [mockDistance, setMockDistance] = useState<number>(0);

  // Auto-set to in_range after initial "checking" animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Default to in-range for demo purposes (allows check-in)
      setDemoState("in_range");
      setMockDistance(Math.round(radiusMeters * 0.3)); // 30% of radius
      onLocationVerified?.(true, radiusMeters * 0.3);
    }, 1500);
    return () => clearTimeout(timer);
  }, [radiusMeters, onLocationVerified]);

  const isWithinRange = demoState === "in_range";
  const isOutOfRange = demoState === "out_of_range";

  // Toggle demo state for testing both scenarios
  const toggleDemoState = () => {
    if (demoState === "in_range") {
      const outDistance = radiusMeters * 2.5; // 250% of radius (outside)
      setDemoState("out_of_range");
      setMockDistance(Math.round(outDistance));
      onLocationVerified?.(false, outDistance);
    } else {
      const inDistance = radiusMeters * 0.3; // 30% of radius (inside)
      setDemoState("in_range");
      setMockDistance(Math.round(inDistance));
      onLocationVerified?.(true, inDistance);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mock Map Display */}
      <div className="aspect-video rounded-xl overflow-hidden border border-border relative bg-muted">
        {/* Mock map background with real map image */}
        <img 
          src={mockMapBg} 
          alt="Map" 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Center of map - Event location with radius */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Radius circle */}
          <div 
            className={cn(
              "absolute rounded-full border-2 transition-colors duration-300",
              isWithinRange 
                ? "bg-success/20 border-success/40" 
                : isOutOfRange 
                ? "bg-destructive/20 border-destructive/40"
                : "bg-primary/20 border-primary/40"
            )}
            style={{
              width: '140px',
              height: '140px',
            }}
          />

          {/* Event marker (center) */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
              isWithinRange ? "bg-success" : isOutOfRange ? "bg-destructive" : "bg-primary"
            )}>
              <MapPin size={20} className="text-primary-foreground" />
            </div>
          </div>

          {/* User marker (simulated position) */}
          {demoState !== "checking" && (
            <div 
              className={cn(
                "absolute flex flex-col items-center animate-pulse transition-all duration-500",
                isWithinRange ? "translate-x-8 translate-y-6" : "translate-x-24 translate-y-20"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-background",
                isWithinRange ? "bg-success" : "bg-destructive"
              )}>
                <Navigation size={12} className="text-primary-foreground" />
              </div>
              <span className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-background/80 text-foreground font-medium">
                You
              </span>
            </div>
          )}
        </div>

        {/* Checking state overlay */}
        {demoState === "checking" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Checking location...</p>
            </div>
          </div>
        )}

        {/* Map label */}
        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border">
          📍 Map View
        </div>
      </div>

      {/* Status bar */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-colors duration-300",
        isWithinRange 
          ? "bg-success/10 border-success/30" 
          : isOutOfRange 
          ? "bg-destructive/10 border-destructive/30"
          : "bg-muted border-border"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isWithinRange 
              ? "bg-success text-success-foreground" 
              : isOutOfRange 
              ? "bg-destructive text-destructive-foreground"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}>
            {demoState === "checking" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isWithinRange ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              isWithinRange ? "text-success" : isOutOfRange ? "text-destructive" : "text-muted-foreground"
            )}>
              {demoState === "checking" 
                ? "Verifying location..." 
                : isWithinRange 
                ? "Within check-in range" 
                : "Outside check-in range"}
            </p>
            {demoState !== "checking" && (
              <p className="text-xs text-muted-foreground">
                {mockDistance}m away • Required: within {radiusMeters}m
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground hover:text-foreground"
        onClick={toggleDemoState}
        disabled={demoState === "checking"}
      >
        🔄 Toggle position: {isWithinRange ? "In Range → Out of Range" : "Out of Range → In Range"}
      </Button>
    </div>
  );
};

export default MockLocationMap;
