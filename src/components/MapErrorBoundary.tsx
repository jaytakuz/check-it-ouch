import * as React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface in console for debugging while keeping the UI usable.
    console.error("MapErrorBoundary caught an error:", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4",
          this.props.className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Map failed to load</p>
            <p className="text-xs text-muted-foreground">You can retry, or continue in demo mode.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={this.handleRetry}>
          <RotateCw size={14} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }
}
