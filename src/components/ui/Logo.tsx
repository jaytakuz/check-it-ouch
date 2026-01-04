import * as React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = true, className }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-14 h-14",
    };

    const textClasses = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-3xl",
    };

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            sizeClasses[size],
            "rounded-xl bg-primary flex items-center justify-center shadow-md"
          )}
        >
          <MapPin
            className="text-primary-foreground"
            size={size === "lg" ? 28 : size === "md" ? 20 : 16}
          />
        </div>
        {showText && (
          <span className={cn("font-semibold text-foreground", textClasses[size])}>
            Check-in
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";

