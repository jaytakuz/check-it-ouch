import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Calendar,
  User,
  Users,
  Award,
  Clock
} from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";

interface Session {
  date: string;
  status: "present" | "absent" | "upcoming";
}

interface ActivityEvent {
  id: string;
  eventName: string;
  eventDate: string;
  role: "participant" | "staff";
  sessions: Session[];
  certificateStatus: "pass" | "incomplete" | "pending";
  attendancePercentage: number;
}

interface ActivityTimelineProps {
  activities: ActivityEvent[];
}

const AttendanceStrip = ({ sessions }: { sessions: Session[] }) => {
  return (
    <div className="flex items-center gap-1">
      {sessions.map((session, index) => (
        <div
          key={index}
          className={`
            w-2.5 h-2.5 rounded-full transition-all
            ${session.status === "present" ? "bg-success" : ""}
            ${session.status === "absent" ? "bg-destructive" : ""}
            ${session.status === "upcoming" ? "bg-muted-foreground/30" : ""}
          `}
          title={`${format(parseISO(session.date), "MMM d")} - ${session.status}`}
        />
      ))}
    </div>
  );
};

const CertificateStatusBadge = ({ status }: { status: ActivityEvent["certificateStatus"] }) => {
  const statusConfig = {
    pass: {
      label: "Pass",
      className: "bg-success/10 text-success border-success/20",
      icon: <Award size={12} />,
    },
    incomplete: {
      label: "Incomplete",
      className: "bg-muted text-muted-foreground border-border",
      icon: <Clock size={12} />,
    },
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <Clock size={12} />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.className} gap-1 text-xs`}>
      {config.icon}
      {config.label}
    </Badge>
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
          {activities.map((activity, index) => (
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
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {activity.eventName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{format(parseISO(activity.eventDate), "MMM d, yyyy")}</span>
                    <span className="text-border">•</span>
                    <div className="flex items-center gap-1">
                      {activity.role === "staff" ? <Users size={12} /> : <User size={12} />}
                      <span className="capitalize">{activity.role}</span>
                    </div>
                  </div>
                </div>
                
                {/* Role Badge */}
                <Badge 
                  variant="outline" 
                  className={`
                    text-xs flex-shrink-0
                    ${activity.role === "staff" 
                      ? "bg-primary/10 text-primary border-primary/20" 
                      : "bg-muted text-muted-foreground border-border"
                    }
                  `}
                >
                  {activity.role === "staff" ? "Staff" : "Participant"}
                </Badge>
              </div>

              {/* Attendance Strip */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <AttendanceStrip sessions={activity.sessions} />
                  <span className="text-xs text-muted-foreground">
                    {activity.attendancePercentage}% attendance
                  </span>
                </div>
                <CertificateStatusBadge status={activity.certificateStatus} />
              </div>

              {/* Legend for attendance strip */}
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
    </motion.div>
  );
};

export default ActivityTimeline;
