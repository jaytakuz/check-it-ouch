import { useState, useRef, useCallback, useEffect } from "react";
import { Move, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NameZone {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of image width
  height: number; // percentage of image height
}

interface CertificateNameZoneEditorProps {
  imageUrl: string;
  zone: NameZone;
  onZoneChange: (zone: NameZone) => void;
  className?: string;
}

const MIN_SIZE = 5; // minimum 5% size

const CertificateNameZoneEditor = ({
  imageUrl,
  zone,
  onZoneChange,
  className,
}: CertificateNameZoneEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialZone, setInitialZone] = useState<NameZone>(zone);

  const getContainerBounds = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (action === "drag") {
        setIsDragging(true);
      } else {
        setIsResizing(true);
        setResizeHandle(handle || null);
      }

      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialZone({ ...zone });
    },
    [zone]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const bounds = getContainerBounds();
      if (!bounds.width || !bounds.height) return;

      const deltaX = ((e.clientX - dragStart.x) / bounds.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / bounds.height) * 100;

      if (isDragging) {
        // Move the box
        let newX = initialZone.x + deltaX;
        let newY = initialZone.y + deltaY;

        // Constrain to container bounds
        newX = Math.max(0, Math.min(100 - zone.width, newX));
        newY = Math.max(0, Math.min(100 - zone.height, newY));

        onZoneChange({
          ...zone,
          x: newX,
          y: newY,
        });
      } else if (isResizing && resizeHandle) {
        let newZone = { ...initialZone };

        // Handle different resize directions
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

        onZoneChange(newZone);
      }
    },
    [
      isDragging,
      isResizing,
      resizeHandle,
      dragStart,
      initialZone,
      zone,
      getContainerBounds,
      onZoneChange,
    ]
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

        {/* Overlay to darken non-selected area */}
        <div
          className="absolute inset-0 bg-background/40 pointer-events-none"
          style={{
            clipPath: `polygon(0% 0%, 0% 100%, ${zone.x}% 100%, ${zone.x}% ${zone.y}%, ${zone.x + zone.width}% ${zone.y}%, ${zone.x + zone.width}% ${zone.y + zone.height}%, ${zone.x}% ${zone.y + zone.height}%, ${zone.x}% 100%, 100% 100%, 100% 0%)`,
          }}
        />

        {/* Crop Box */}
        <div
          className={cn(
            "absolute border-2 border-primary bg-primary/10 transition-shadow",
            isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab"
          )}
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, "drag")}
        >
          {/* Center indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-1 text-primary text-xs font-medium bg-background/80 px-2 py-1 rounded">
              <Move size={14} />
              <span>Name Zone</span>
            </div>
          </div>

          {/* Resize Handles */}
          {resizeHandles.map((handle) => (
            <div
              key={handle.position}
              className={cn(
                "absolute w-3 h-3 bg-primary border-2 border-background rounded-full z-10",
                handle.className
              )}
              style={{ cursor: handle.cursor }}
              onMouseDown={(e) => handleMouseDown(e, "resize", handle.position)}
            />
          ))}

          {/* Dashed center lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-primary/50" />
            <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-primary/50" />
          </div>
        </div>
      </div>

      {/* Zone info */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Maximize2 size={12} />
          <span>
            Position: {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}%
          </span>
        </div>
        <span>
          Size: {zone.width.toFixed(1)}% × {zone.height.toFixed(1)}%
        </span>
      </div>

      {/* Instructions */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Drag to move • Drag corners to resize • This zone will display attendee names
      </p>
    </div>
  );
};

export default CertificateNameZoneEditor;
