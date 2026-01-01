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
  MoreVertical,
  Bell,
  Settings,
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

    // Fetch events created by this host
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

    // Fetch check-in counts for each event
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

  const getStatusLabel = (status: "live" | "upcoming" | "completed") => {
    switch (status) {
      case "live":
        return "● Live Now";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeEventsCount = events.filter((e) => e.is_active).length;

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

      {/* Stats */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold text-foreground">{activeEventsCount}</div>
            <div className="text-sm text-muted-foreground">Active Events</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-2xl font-bold text-foreground">{totalCheckIns}</div>
            <div className="text-sm text-muted-foreground">Total Check-ins</div>
          </div>
        </motion.div>
      </div>

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
            <Button className="mt-4" onClick={() => navigate("/host/create-event")}>
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const status = getEventStatus(event);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => navigate(`/host/event/${event.id}`)}
                  className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full border",
                            getStatusStyles(status)
                          )}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {event.is_recurring ? "Recurring" : "One-time"}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
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

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {event.check_in_count}/{event.max_attendees || "∞"}
                      </span>
                    </div>
                    {status === "live" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/host/monitor/${event.id}`);
                        }}
                      >
                        Open Monitor
                      </Button>
                    )}
                  </div>
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