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
  Download,
  ExternalLink,
  Lightbulb,
  Wrench,
  Star,
  Inbox,
  FileX
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const filterOptions = [
  { value: "all" as const, label: "All" },
  { value: 1 as const, label: "Participation" },
  { value: 2 as const, label: "Practice" },
  { value: 3 as const, label: "Implementation" },
];

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
                  ${session.status === "present" ? "bg-emerald-500" : ""}
                  ${session.status === "absent" ? "bg-amber-300" : ""}
                  ${session.status === "upcoming" ? "bg-slate-200" : ""}
                `}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Session {index + 1}: {format(parseISO(session.date), "MMM d")} - 
                <span className={`ml-1 font-medium ${
                  session.status === "present" ? "text-emerald-600" : 
                  session.status === "absent" ? "text-amber-600" : 
                  "text-slate-500"
                }`}>
                  {session.status === "present" ? "Verified via Dynamic QR" : 
                   session.status.charAt(0).toUpperCase() + session.status.slice(1)}
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
  attendancePercentage,
  tierLevel,
  certificateUrl,
  proofUrl
}: { 
  earned: boolean; 
  attendancePercentage: number;
  tierLevel: 1 | 2 | 3;
  certificateUrl?: string;
  proofUrl?: string;
}) => {
  // Tier 3: Show View Proof button
  if (tierLevel === 3 && proofUrl) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
          <Award size={12} />
          Completed
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          onClick={(e) => {
            e.stopPropagation();
            window.open(proofUrl, '_blank');
          }}
        >
          <ExternalLink size={12} className="mr-1" />
          View Proof
        </Button>
      </div>
    );
  }
  
  // Tier 1 & 2: Show Download Certificate button if certified
  if (earned && certificateUrl) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
          <Award size={12} />
          Certified
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          onClick={(e) => {
            e.stopPropagation();
            // Download certificate logic
            console.log("Downloading certificate:", certificateUrl);
          }}
        >
          <Download size={12} className="mr-1" />
          Download
        </Button>
      </div>
    );
  }
  
  // Just show certified badge without download if no URL
  if (earned) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
        <Award size={12} />
        Certified
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1 text-xs cursor-help">
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

const ActivityTimeline = ({ activities, showDetails = true }: ActivityTimelineProps) => {
  const [activeFilter, setActiveFilter] = useState<"all" | 1 | 2 | 3>("all");

  const filteredActivities = useMemo(() => {
    if (activeFilter === "all") return activities;
    return activities.filter(a => a.tierLevel === activeFilter);
  }, [activities, activeFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5 shadow-sm"
    >
      {/* Header with Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Activity Log</h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
          View All
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Filter Tabs - Horizontally Scrollable */}
      <ScrollArea className="w-full whitespace-nowrap mb-4">
        <div className="flex gap-2">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
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
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <FileX className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No records found in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.slice(0, 5).map((activity, index) => (
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

              {/* Attendance Strip - Only show if showDetails is true */}
              {showDetails && (
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
                    tierLevel={activity.tierLevel}
                    certificateUrl={activity.certificateUrl}
                    proofUrl={activity.proofUrl}
                  />
                </div>
              )}

              {/* Legend for first item only - Only show if showDetails is true */}
              {showDetails && index === 0 && (
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-dashed border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
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
                <span className="font-medium text-foreground">{filteredActivities.length}</span> total events
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {filteredActivities.filter(a => a.certificateEarned).length}
                </span> certificates
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

      {/* Footer Credit */}
      <div className="mt-4 pt-3 border-t border-dashed border-border/50">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Verification Standards • Powered by CMU Check-in
        </p>
      </div>
    </motion.div>
  );
};

export default ActivityTimeline;
