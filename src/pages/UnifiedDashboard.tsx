import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Calendar,
  Users,
  Clock,
  MapPin,
  Bell,
  User,
  Plus,
  Play,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, parseISO } from "date-fns";
import { toast } from "sonner";
import { RoleSwitcher } from "@/components/RoleSwitcher";

type ViewMode = "host" | "attendee";

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  is_recurring: boolean;
  recurring_days: number[] | null;
  start_time: string;
  end_time: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  max_attendees: number | null;
  is_active: boolean;
  host_id: string;
  check_in_count?: number;
  user_checked_in?: boolean;
}

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, getUserRoles } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("attendee");
  const [hasHostRole, setHasHostRole] = useState(false);
  const [hasAttendeeRole, setHasAttendeeRole] = useState(false);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    checkRolesAndFetch();
  }, [user, authLoading, navigate]);

  const checkRolesAndFetch = async () => {
    if (!user) return;
    
    const { data: roles } = await getUserRoles();
    if (roles) {
      const isHost = roles.some((r: any) => r.role === "host");
      const isAttendee = roles.some((r: any) => r.role === "attendee");
      setHasHostRole(isHost);
      setHasAttendeeRole(isAttendee);
      
      // Set default view based on roles
      if (isHost && !isAttendee) {
        setViewMode("host");
      } else if (!isHost && isAttendee) {
        setViewMode("attendee");
      }
      // If both or neither, default to attendee (already set)
    }
    
    await fetchData();
  };

  const fetchData = async () => {
    if (!user) return;

    // Fetch all active events
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      setLoading(false);
      return;
    }

    // Fetch user's check-ins
    const { data: checkInsData } = await supabase
      .from("check_ins")
      .select("event_id, session_date")
      .eq("user_id", user.id);

    const checkInEventIds = new Set(checkInsData?.map((c) => c.event_id) || []);

    // Fetch check-in counts for hosted events
    const eventsWithDetails = await Promise.all(
      (eventsData || []).map(async (event) => {
        let checkInCount = 0;
        if (event.host_id === user.id) {
          const { count } = await supabase
            .from("check_ins")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);
          checkInCount = count || 0;
        }
        
        return {
          ...event,
          user_checked_in: checkInEventIds.has(event.id),
          check_in_count: checkInCount,
        };
      })
    );

    setEvents(eventsWithDetails);
    setTotalCheckIns(eventsWithDetails
      .filter(e => e.host_id === user?.id)
      .reduce((sum, e) => sum + (e.check_in_count || 0), 0)
    );
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
      const now = new Date();
      const currentDay = now.getDay();
      if (event.recurring_days.includes(currentDay)) return "Today";
      const dayNames = event.recurring_days.map((d) => days[d]).join(", ");
      return `Every ${dayNames}`;
    }
    if (event.event_date) {
      const date = parseISO(event.event_date);
      if (isToday(date)) return "Today";
      return format(date, "MMM d, yyyy");
    }
    return "TBD";
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

  const handleQuickCheckIn = async (event: Event) => {
    if (!user) return;

    const now = new Date();
    const currentTime = format(now, "HH:mm:ss");
    
    let isValidTime = false;
    if (event.is_recurring && event.recurring_days) {
      const currentDay = now.getDay();
      isValidTime = event.recurring_days.includes(currentDay) && 
                    currentTime >= event.start_time && 
                    currentTime <= event.end_time;
    } else if (event.event_date && isToday(parseISO(event.event_date))) {
      isValidTime = currentTime >= event.start_time && currentTime <= event.end_time;
    }

    if (!isValidTime) {
      toast.error("This event is not currently active");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const R = 6371e3;
        const φ1 = (event.location_lat * Math.PI) / 180;
        const φ2 = (latitude * Math.PI) / 180;
        const Δφ = ((latitude - event.location_lat) * Math.PI) / 180;
        const Δλ = ((longitude - event.location_lng) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > event.radius_meters) {
          toast.error(`You're too far from the venue (${Math.round(distance)}m away, must be within ${event.radius_meters}m)`);
          return;
        }

        const today = format(now, "yyyy-MM-dd");
        const { data: existingCheckIn } = await supabase
          .from("check_ins")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .eq("session_date", today)
          .single();

        if (existingCheckIn) {
          toast.info("You've already checked in today!");
          return;
        }

        const { error } = await supabase.from("check_ins").insert({
          event_id: event.id,
          user_id: user.id,
          location_lat: latitude,
          location_lng: longitude,
          distance_meters: Math.round(distance),
          qr_code_used: "quick-checkin",
          session_date: today,
        });

        if (error) {
          toast.error("Failed to check in. Please try again.");
          return;
        }

        toast.success("Check-in successful! 🎉");
        fetchData();
      },
      () => {
        toast.error("Could not get your location. Please enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Filter events based on view mode
  const hostingEvents = events.filter((e) => e.host_id === user?.id);
  const participatingEvents = events.filter((e) => e.host_id !== user?.id);
  const displayEvents = viewMode === "host" ? hostingEvents : participatingEvents;
  
  const liveEvents = hostingEvents.filter((e) => getEventStatus(e) === "live");
  const activeEventsCount = hostingEvents.filter((e) => e.is_active).length;
  const avgAttendance = hostingEvents.length > 0 
    ? Math.round(hostingEvents.reduce((sum, e) => sum + getAttendanceRate(e), 0) / hostingEvents.length)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <RoleSwitcher 
                currentView={viewMode} 
                onViewChange={setViewMode}
              />
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/user/profile")}>
                <User size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">
            {viewMode === "host" ? "Host Dashboard 🎯" : "Welcome back! 👋"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === "host" ? "Here's your event overview" : "Here's what's happening today"}
          </p>
        </motion.div>

        {/* Host Stats (only in host mode) */}
        {viewMode === "host" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
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
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: viewMode === "host" ? 0.2 : 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border hover:bg-accent/50 transition-all"
            onClick={() => navigate("/checkin")}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode size={20} className="text-primary" />
            </div>
            <span className="font-medium text-sm">Scan QR Code</span>
          </Button>
          {viewMode === "host" || hasHostRole ? (
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 bg-card border-border hover:bg-accent/50 transition-all"
              onClick={() => navigate("/host/create-event")}
            >
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Plus size={20} className="text-success" />
              </div>
              <span className="font-medium text-sm">Create Event</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 bg-card border-border hover:bg-accent/50 transition-all"
              onClick={() => navigate("/user/profile")}
            >
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-success" />
              </div>
              <span className="font-medium text-sm">My Check-ins</span>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Live Events Alert (host mode) */}
      {viewMode === "host" && liveEvents.length > 0 && (
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {viewMode === "host" ? "Your Events" : "Available Events"}
          </h2>
        </div>

        {displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {viewMode === "host" ? "No events created yet" : "No events available"}
            </p>
            {viewMode === "host" && (
              <Button className="mt-4" onClick={() => navigate("/host/create-event")}>
                Create Your First Event
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event, index) => {
              const status = getEventStatus(event);
              const isHost = event.host_id === user?.id;
              const attendanceRate = getAttendanceRate(event);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => navigate(isHost ? `/host/event/${event.id}` : `/event/${event.id}`)}
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
                        {!isHost && event.user_checked_in && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                            ✓ Checked in
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {event.is_recurring ? "Recurring" : "One-time"}
                      </span>
                    </div>
                  </div>

                  {/* Quick info row */}
                  <div className="space-y-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{formatEventDate(event)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{formatTime(event.start_time, event.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{event.location_name}</span>
                    </div>
                  </div>

                  {/* Host view: attendance bar */}
                  {isHost && (
                    <div className="bg-muted rounded-lg p-3 mb-3">
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
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {isHost ? (
                      <>
                        {status === "live" ? (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/host/monitor/${event.id}`);
                            }}
                          >
                            <BarChart3 size={14} className="mr-2" />
                            Live Monitor
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant={status === "live" ? "outline" : "default"}
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/host/attendance/${event.id}`);
                          }}
                        >
                          <FileText size={14} className="mr-2" />
                          View Logs
                        </Button>
                      </>
                    ) : status === "live" ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/checkin");
                          }}
                        >
                          <QrCode size={16} className="mr-2" />
                          Scan QR
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickCheckIn(event);
                          }}
                          disabled={event.user_checked_in}
                        >
                          <MousePointerClick size={16} className="mr-2" />
                          {event.user_checked_in ? "Done" : "Check-in"}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB for host mode */}
      {(viewMode === "host" || hasHostRole) && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
          onClick={() => navigate("/host/create-event")}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
};

export default UnifiedDashboard;
