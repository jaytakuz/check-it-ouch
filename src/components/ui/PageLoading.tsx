import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message, className }: PageLoadingProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col items-center justify-center", className)}>
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
