import { useState, useRef, useCallback, useEffect } from "react";
import { Move, Maximize2, QrCode, Award, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CertificateZones {
  eventName: Zone;
  attendeeName: Zone;
  verification: Zone;
}

interface ZoneConfig {
  key: keyof CertificateZones;
  label: string;
  icon: typeof Move;
  color: string;
  bgColor: string;
  borderColor: string;
  resizable: boolean;
}

const ZONE_CONFIGS: ZoneConfig[] = [
  {
    key: "eventName",
    label: "Event Name",
    icon: Award,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-400",
    resizable: false,
  },
  {
    key: "attendeeName",
    label: "Attendee Name",
    icon: Type,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-400",
    resizable: true,
  },
  {
    key: "verification",
    label: "Verification",
    icon: QrCode,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-400",
    resizable: false,
  },
];

interface CertificateMultiZoneEditorProps {
  imageUrl: string;
  zones: CertificateZones;
  onZonesChange: (zones: CertificateZones) => void;
  className?: string;
}

const MIN_SIZE = 5;

const CertificateMultiZoneEditor = ({
  imageUrl,
  zones,
  onZonesChange,
  className,
}: CertificateMultiZoneEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeZone, setActiveZone] = useState<keyof CertificateZones | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialZone, setInitialZone] = useState<Zone | null>(null);

  const getContainerBounds = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, zoneKey: keyof CertificateZones, action: "drag" | "resize", handle?: string) => {
      e.preventDefault();
      e.stopPropagation();

      setActiveZone(zoneKey);

      if (action === "drag") {
        setIsDragging(true);
      } else {
        setIsResizing(true);
        setResizeHandle(handle || null);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialZone({ ...zones[zoneKey] });
    },
    [zones]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if ((!isDragging && !isResizing) || !activeZone || !initialZone) return;

      const bounds = getContainerBounds();
      if (!bounds.width || !bounds.height) return;

      const deltaX = ((e.clientX - dragStart.x) / bounds.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / bounds.height) * 100;
      const currentZone = zones[activeZone];

      if (isDragging) {
        let newX = initialZone.x + deltaX;
        let newY = initialZone.y + deltaY;

        newX = Math.max(0, Math.min(100 - currentZone.width, newX));
        newY = Math.max(0, Math.min(100 - currentZone.height, newY));

        onZonesChange({
          ...zones,
          [activeZone]: {
            ...currentZone,
            x: newX,
            y: newY,
          },
        });
      } else if (isResizing && resizeHandle) {
        const config = ZONE_CONFIGS.find((c) => c.key === activeZone);
        if (!config?.resizable) return;

        let newZone = { ...initialZone };

        if (resizeHandle.includes("e")) {
          newZone.width = Math.max(MIN_SIZE, initialZone.width + deltaX);
          newZone.width = Math.min(100 - initialZone.x, newZone.width);
        }
        if (resizeHandle.includes("w")) {
          const newWidth = initialZone.width - deltaX;
          if (newWidth >= MIN_SIZE) {
            newZone.x = initialZone.x + deltaX;
            newZone.width = newWidth;
            newZone.x = Math.max(0, newZone.x);
            newZone.width = Math.min(100 - newZone.x, newZone.width);
          }
        }
        if (resizeHandle.includes("s")) {
          newZone.height = Math.max(MIN_SIZE, initialZone.height + deltaY);
          newZone.height = Math.min(100 - initialZone.y, newZone.height);
        }
        if (resizeHandle.includes("n")) {
          const newHeight = initialZone.height - deltaY;
          if (newHeight >= MIN_SIZE) {
            newZone.y = initialZone.y + deltaY;
            newZone.height = newHeight;
            newZone.y = Math.max(0, newZone.y);
            newZone.height = Math.min(100 - newZone.y, newZone.height);
          }
        }

        onZonesChange({
          ...zones,
          [activeZone]: newZone,
        });
      }
    },
    [isDragging, isResizing, resizeHandle, dragStart, initialZone, zones, activeZone, getContainerBounds, onZonesChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const resizeHandles = [
    { position: "nw", cursor: "nwse-resize", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2" },
    { position: "n", cursor: "ns-resize", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
    { position: "ne", cursor: "nesw-resize", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2" },
    { position: "e", cursor: "ew-resize", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2" },
    { position: "se", cursor: "nwse-resize", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2" },
    { position: "s", cursor: "ns-resize", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
    { position: "sw", cursor: "nesw-resize", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2" },
    { position: "w", cursor: "ew-resize", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2" },
  ];

  return (
    <div className={cn("relative select-none", className)}>
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden"
      >
        {/* Certificate Image */}
        <img
          src={imageUrl}
          alt="Certificate template"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Render all zones */}
        {ZONE_CONFIGS.map((config) => {
          const zone = zones[config.key];
          const Icon = config.icon;
          const isActive = activeZone === config.key && (isDragging || isResizing);

          return (
            <div
              key={config.key}
              className={cn(
                "absolute border-2 transition-shadow",
                config.borderColor,
                config.bgColor,
                isActive ? "cursor-grabbing shadow-lg z-20" : "cursor-grab z-10",
                activeZone === config.key ? "z-20" : ""
              )}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, config.key, "drag")}
            >
              {/* Center indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={cn("flex flex-col items-center gap-0.5 text-xs font-medium bg-background/90 px-2 py-1 rounded", config.color)}>
                  <Icon size={12} />
                  <span className="text-[10px] whitespace-nowrap">{config.label}</span>
                </div>
              </div>

              {/* Resize Handles - only for resizable zones */}
              {config.resizable &&
                resizeHandles.map((handle) => (
                  <div
                    key={handle.position}
                    className={cn(
                      "absolute w-3 h-3 bg-green-500 border-2 border-background rounded-full z-10",
                      handle.className
                    )}
                    style={{ cursor: handle.cursor }}
                    onMouseDown={(e) => handleMouseDown(e, config.key, "resize", handle.position)}
                  />
                ))}

              {/* Move indicator for non-resizable */}
              {!config.resizable && (
                <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                  <Move size={10} className={config.color} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zone Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        {ZONE_CONFIGS.map((config) => (
          <div key={config.key} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", config.key === "eventName" ? "bg-blue-500" : config.key === "attendeeName" ? "bg-green-500" : "bg-purple-500")} />
            <span className="text-muted-foreground">{config.label}</span>
            {config.resizable && (
              <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-1 rounded">resize</span>
            )}
          </div>
        ))}
      </div>

      {/* Active zone info */}
      {activeZone && (
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>
            Position: {zones[activeZone].x.toFixed(1)}%, {zones[activeZone].y.toFixed(1)}%
          </span>
          <span>
            Size: {zones[activeZone].width.toFixed(1)}% × {zones[activeZone].height.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Instructions */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Drag any box to move • Only <span className="text-green-600 dark:text-green-400 font-medium">Attendee Name</span> can be resized
      </p>
    </div>
  );
};

export default CertificateMultiZoneEditor;
