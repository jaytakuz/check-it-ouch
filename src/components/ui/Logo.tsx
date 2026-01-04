import * as React from "react";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = true, className }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    const textClasses = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-3xl",
    };

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)}>
        <img
          src={logoImage}
          alt="Check-in Logo"
          className={cn(sizeClasses[size], "object-contain")}
        />
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

