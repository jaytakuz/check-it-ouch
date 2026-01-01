import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  Settings,
  TrendingUp,
  Play,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, parseISO } from "date-fns";

interface Event {
  id: string;
  name: string;
  is_recurring: boolean;
  event_date: string | null;
  recurring_days: number[] | null;
  start_time: string;
  end_time: string;
  location_name: string;
  max_attendees: number | null;
  is_active: boolean;
  check_in_count?: number;
}

const HostDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchEvents();
  }, [user, authLoading, navigate]);

  const fetchEvents = async () => {
    if (!user) return;

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      setLoading(false);
      return;
    }

    const eventsWithCounts = await Promise.all(
      (eventsData || []).map(async (event) => {
        const { count } = await supabase
          .from("check_ins")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        return { ...event, check_in_count: count || 0 };
      })
    );

    setEvents(eventsWithCounts);
    setTotalCheckIns(eventsWithCounts.reduce((sum, e) => sum + (e.check_in_count || 0), 0));
    setLoading(false);
  };

  const getEventStatus = (event: Event): "live" | "upcoming" | "completed" => {
    if (!event.is_active) return "completed";
    
    const now = new Date();
    const currentTime = format(now, "HH:mm:ss");
    
    if (event.is_recurring) {
      const currentDay = now.getDay();
      if (event.recurring_days?.includes(currentDay)) {
        if (currentTime >= event.start_time && currentTime <= event.end_time) {
          return "live";
        }
      }
      return "upcoming";
    } else if (event.event_date) {
      const eventDate = parseISO(event.event_date);
      if (isToday(eventDate)) {
        if (currentTime >= event.start_time && currentTime <= event.end_time) {
          return "live";
        }
        if (currentTime > event.end_time) return "completed";
      }
      if (eventDate < now) return "completed";
    }
    return "upcoming";
  };

  const formatEventDate = (event: Event): string => {
    if (event.is_recurring && event.recurring_days) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayNames = event.recurring_days.map((d) => days[d]).join(", ");
      return `Every ${dayNames}`;
    }
    if (event.event_date) {
      const date = parseISO(event.event_date);
      if (isToday(date)) return "Today";
      return format(date, "MMM d, yyyy");
    }
    return "No date set";
  };

  const formatTime = (start: string, end: string): string => {
    const formatTimeStr = (t: string) => {
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };
    return `${formatTimeStr(start)} - ${formatTimeStr(end)}`;
  };

  const getStatusStyles = (status: "live" | "upcoming" | "completed") => {
    switch (status) {
      case "live":
        return "bg-success/10 text-success border-success/20";
      case "upcoming":
        return "bg-primary/10 text-primary border-primary/20";
      case "completed":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getAttendanceRate = (event: Event): number => {
    if (!event.max_attendees) return 0;
    return Math.round((event.check_in_count || 0) / event.max_attendees * 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeEventsCount = events.filter((e) => e.is_active).length;
  const liveEvents = events.filter((e) => getEventStatus(e) === "live");
  const avgAttendance = events.length > 0 
    ? Math.round(events.reduce((sum, e) => sum + getAttendanceRate(e), 0) / events.length)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome & Quick Stats */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Host Dashboard 🎯</h1>
          <p className="text-muted-foreground mt-1">Here's your event overview</p>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <div className="text-2xl font-bold text-foreground">{activeEventsCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <div className="text-2xl font-bold text-foreground">{totalCheckIns}</div>
            <div className="text-xs text-muted-foreground">Check-ins</div>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <div className="text-2xl font-bold text-foreground">{avgAttendance}%</div>
            <div className="text-xs text-muted-foreground">Avg Rate</div>
          </div>
        </motion.div>
      </div>

      {/* Live Events Alert */}
      {liveEvents.length > 0 && (
        <div className="px-4 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/10 border border-success/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-success">
                    {liveEvents.length} event{liveEvents.length > 1 ? "s" : ""} live now
                  </p>
                  <p className="text-sm text-success/80">{liveEvents[0].name}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-success hover:bg-success/90"
                onClick={() => navigate(`/host/monitor/${liveEvents[0].id}`)}
              >
                <Play size={14} className="mr-1" />
                Monitor
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Events Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Events</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first event to get started</p>
            <Button onClick={() => navigate("/host/create-event")}>
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const status = getEventStatus(event);
              const attendanceRate = getAttendanceRate(event);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => navigate(`/host/event/${event.id}`)}
                  className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:shadow-md transition-all"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full border",
                            getStatusStyles(status)
                          )}
                        >
                          {status === "live" ? "● Live" : status === "upcoming" ? "Upcoming" : "Done"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {event.is_recurring ? "Recurring" : "One-time"}
                      </span>
                    </div>
                  </div>

                  {/* Quick info row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatEventDate(event)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatTime(event.start_time, event.end_time)}</span>
                    </div>
                  </div>

                  {/* Attendance bar - Quick skim feature */}
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {event.check_in_count} / {event.max_attendees || "∞"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className={attendanceRate >= 50 ? "text-success" : "text-warning"} />
                        <span className={cn(
                          "text-sm font-medium",
                          attendanceRate >= 50 ? "text-success" : "text-warning"
                        )}>
                          {attendanceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, attendanceRate)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          attendanceRate >= 75 ? "bg-success" : attendanceRate >= 50 ? "bg-primary" : "bg-warning"
                        )}
                      />
                    </div>
                  </div>

                  {/* Action button for live events */}
                  {status === "live" && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/host/monitor/${event.id}`);
                        }}
                      >
                        <BarChart3 size={14} className="mr-2" />
                        Open Live Monitor
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        onClick={() => navigate("/host/create-event")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
};

export default HostDashboard;