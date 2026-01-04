import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Presentation, Users, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type ViewMode = "host" | "attendee";

interface RoleSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function RoleSwitcher({ currentView, onViewChange, className }: RoleSwitcherProps) {
  const { getUserRoles } = useAuth();
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      const { data: roles } = await getUserRoles();
      if (roles) {
        setHasHostRole(roles.some((r: any) => r.role === "host"));
        setHasAttendeeRole(roles.some((r: any) => r.role === "attendee"));
      }
      setLoading(false);
    };
    checkRoles();
  }, [getUserRoles]);

  // If user only has one role, show a simpler indicator
  const hasBothRoles = hasHostRole && hasAttendeeRole;

  if (loading) {
    return (
      <div className={cn("h-9 w-32 bg-muted animate-pulse rounded-lg", className)} />
    );
  }

  // If user only has one role, just show current mode as badge
  if (!hasBothRoles) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50",
          className
        )}
      >
        {currentView === "host" ? (
          <>
            <Presentation size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Host Mode</span>
          </>
        ) : (
          <>
            <Users size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Attendee Mode</span>
          </>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 h-9 px-3 bg-card border-border",
            className
          )}
        >
          {currentView === "host" ? (
            <>
              <Presentation size={16} className="text-primary" />
              <span className="text-sm font-medium">Host</span>
            </>
          ) : (
            <>
              <Users size={16} className="text-primary" />
              <span className="text-sm font-medium">Attendee</span>
            </>
          )}
          <ChevronDown size={14} className="text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          onClick={() => onViewChange("host")}
          className={cn(
            "flex items-center gap-3 py-2.5 cursor-pointer",
            currentView === "host" && "bg-primary/5"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              currentView === "host"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Presentation size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Host Mode</p>
            <p className="text-xs text-muted-foreground">Manage events</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onViewChange("attendee")}
          className={cn(
            "flex items-center gap-3 py-2.5 cursor-pointer",
            currentView === "attendee" && "bg-primary/5"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              currentView === "attendee"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Users size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Attendee Mode</p>
            <p className="text-xs text-muted-foreground">Join events</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
