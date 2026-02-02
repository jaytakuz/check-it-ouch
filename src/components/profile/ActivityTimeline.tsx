import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Calendar,
  User,
  Users,
  Award,
  Download,
  Lightbulb,
  Wrench,
  Trophy
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TIER_CONFIG, type ActivityItem, type AttendanceStatus } from "@/data/profileMockData";

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const tierIcons: Record<number, React.ReactNode> = {
  1: <Lightbulb size={12} />,
  2: <Wrench size={12} />,
  3: <Trophy size={12} />,
};

const AttendanceStrip = ({ sessions }: { sessions: { date: string; status: AttendanceStatus }[] }) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {sessions.map((session, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className={`
                  w-2.5 h-2.5 rounded-full transition-all cursor-help
                  ${session.status === "present" ? "bg-success" : ""}
                  ${session.status === "absent" ? "bg-destructive" : ""}
                  ${session.status === "upcoming" ? "bg-muted-foreground/30" : ""}
                `}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Session {index + 1}: {format(parseISO(session.date), "MMM d")} - 
                <span className={`ml-1 font-medium ${
                  session.status === "present" ? "text-success" : 
                  session.status === "absent" ? "text-destructive" : 
                  "text-muted-foreground"
                }`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

const TierBadge = ({ tier }: { tier: 1 | 2 | 3 }) => {
  const config = TIER_CONFIG[tier];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} gap-1 text-xs`}
    >
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
  if (earned) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 text-xs">
          <Award size={12} />
          Certified
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-primary hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            // Download certificate logic
          }}
        >
          <Download size={12} className="mr-1" />
          Download
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 text-xs cursor-help">
            Incomplete
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Attendance: {attendancePercentage}% (Requires 80% for certificate)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Activity History</h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
          View All
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No activities yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              className="p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {activity.eventName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{format(parseISO(activity.eventDate), "MMM d, yyyy")}</span>
                    <span className="text-border">•</span>
                    <div className="flex items-center gap-1">
                      {activity.role === "staff" ? <Users size={12} /> : <User size={12} />}
                      <span className="capitalize">{activity.role}</span>
                    </div>
                  </div>
                </div>
                
                {/* Tier Badge */}
                <TierBadge tier={activity.tierLevel} />
              </div>

              {/* Attendance Strip */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <AttendanceStrip sessions={activity.sessions} />
                  <span className="text-xs text-muted-foreground">
                    {activity.attendancePercentage}% attendance
                  </span>
                </div>
                <CertificateStatusBadge 
                  earned={activity.certificateEarned} 
                  attendancePercentage={activity.attendancePercentage}
                />
              </div>

              {/* Legend for first item only */}
              {index === 0 && (
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-dashed border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <span>Upcoming</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium text-foreground">{activities.length}</span> total events
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {activities.filter(a => a.certificateEarned).length}
                </span> certificates
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[3, 2, 1].map(tier => {
                const count = activities.filter(a => a.tierLevel === tier).length;
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
    </motion.div>
  );
};

export default ActivityTimeline;
