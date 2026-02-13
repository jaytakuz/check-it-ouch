import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  ChevronRight, 
  Calendar,
  User,
  Users,
  Award,
  Lightbulb,
  Wrench,
  Star,
  Sparkles,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TIER_CONFIG, type ActivityItem, type AttendanceStatus } from "@/data/profileMockData";

interface ActivityTimelineProps {
  activities: ActivityItem[];
  showDetails?: boolean;
}

const tierIcons: Record<number, React.ReactNode> = {
  1: <Lightbulb size={12} />,
  2: <Wrench size={12} />,
  3: <Star size={12} className="fill-current" />,
};

const MAX_VISIBLE_DOTS = 5;

const AttendanceStrip = ({ sessions }: { sessions: { date: string; status: AttendanceStatus }[] }) => {
  const visibleSessions = sessions.slice(0, MAX_VISIBLE_DOTS);
  const remaining = sessions.length - MAX_VISIBLE_DOTS;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {visibleSessions.map((session, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className={`
                  w-2.5 h-2.5 rounded-full transition-all cursor-help
                  ${session.status === "present" ? "bg-emerald-500" : ""}
                  ${session.status === "absent" ? "bg-amber-300" : ""}
                  ${session.status === "upcoming" ? "bg-muted" : ""}
                `}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Session {index + 1}: {format(parseISO(session.date), "MMM d")} - 
                <span className={`ml-1 font-medium ${
                  session.status === "present" ? "text-emerald-600" : 
                  session.status === "absent" ? "text-amber-600" : 
                  "text-muted-foreground"
                }`}>
                  {session.status === "present" ? "Verified" : 
                   session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] text-muted-foreground ml-0.5">+{remaining}</span>
        )}
      </div>
    </TooltipProvider>
  );
};

const TierBadge = ({ tier }: { tier: 1 | 2 | 3 }) => {
  const config = TIER_CONFIG[tier];
  return (
    <Badge variant="outline" className={`${config.color} gap-1 text-xs`}>
      {tierIcons[tier]}
      {config.label}
    </Badge>
  );
};

const CertificateStatusBadge = ({ 
  earned, 
  attendancePercentage 
}: { 
  earned: boolean; 
  attendancePercentage: number;
}) => {
  const [showCert, setShowCert] = useState(false);

  if (earned) {
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); setShowCert(true); }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
        >
          <Award size={12} />
          <Eye size={12} />
          Certified
        </button>
        <Dialog open={showCert} onOpenChange={setShowCert}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                Certificate
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Award size={36} className="text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Certificate earned with {attendancePercentage}% attendance.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Full certificate view coming soon.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border gap-1 text-xs cursor-help">
            Incomplete
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Attendance: {attendancePercentage}% (Requires 80%)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ActivityTimeline = ({ activities, showDetails = true }: ActivityTimelineProps) => {
  const [activeFilters, setActiveFilters] = useState<Set<1 | 2 | 3>>(new Set());

  const isAllSelected = activeFilters.size === 0 || activeFilters.size === 3;

  const handleFilterToggle = (tier: 1 | 2 | 3) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      // If all 3 selected, clear to show "All"
      if (next.size === 3) return new Set<1 | 2 | 3>();
      return next;
    });
  };

  const handleAllClick = () => {
    setActiveFilters(new Set<1 | 2 | 3>());
  };

  const filteredActivities = useMemo(() => {
    if (isAllSelected) return activities;
    return activities.filter(a => activeFilters.has(a.tierLevel));
  }, [activities, activeFilters, isAllSelected]);

  const filterOptions: { value: "all" | 1 | 2 | 3; label: string }[] = [
    { value: "all", label: "All" },
    { value: 1, label: "Participation" },
    { value: 2, label: "Practice" },
    { value: 3, label: "Implementation" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Activity Log</h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
          View All
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Multi-select Filter Tabs */}
      <ScrollArea className="w-full whitespace-nowrap mb-4">
        <div className="flex gap-2">
          {filterOptions.map((option) => {
            const isActive = option.value === "all" 
              ? isAllSelected 
              : activeFilters.has(option.value as 1 | 2 | 3);
            return (
              <button
                key={option.value}
                onClick={() => option.value === "all" ? handleAllClick() : handleFilterToggle(option.value as 1 | 2 | 3)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      {/* Empty State */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-foreground mb-2">No activities yet</h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Join your first event to start building your passport!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.slice(0, 5).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              className="p-3 md:p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {activity.eventName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Calendar size={11} />
                    <span>{format(parseISO(activity.eventDate), "MMM d, yyyy")}</span>
                    <span className="text-border">•</span>
                    <div className="flex items-center gap-1">
                      {activity.role === "staff" ? <Users size={11} /> : <User size={11} />}
                      <span className="capitalize">{activity.role}</span>
                    </div>
                  </div>
                </div>
                <TierBadge tier={activity.tierLevel} />
              </div>

              {/* Attendance Strip */}
              {showDetails && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <AttendanceStrip sessions={activity.sessions} />
                    <span className="text-xs text-muted-foreground">
                      {activity.attendancePercentage}%
                    </span>
                  </div>
                  <CertificateStatusBadge 
                    earned={activity.certificateEarned} 
                    attendancePercentage={activity.attendancePercentage}
                  />
                </div>
              )}

              {/* Legend for first item only */}
              {showDetails && index === 0 && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed border-border/50 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    <span>Upcoming</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium text-foreground">{filteredActivities.length}</span> events
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {filteredActivities.filter(a => a.certificateEarned).length}
                </span> certs
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[3, 2, 1].map(tier => {
                const count = filteredActivities.filter(a => a.tierLevel === tier).length;
                if (count === 0) return null;
                return (
                  <span key={tier} className="flex items-center gap-1">
                    {tierIcons[tier]}
                    <span className="font-medium">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-dashed border-border/50">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Taxonomy developed by CMU Check-in Project, referencing frameworks from WEF and LinkedIn for educational purposes.
        </p>
      </div>
    </motion.div>
  );
};

export default ActivityTimeline;
