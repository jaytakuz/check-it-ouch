import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  User,
  MousePointerClick,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  host_name?: string;
  checked_in?: boolean;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch active events
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("event_date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    // Fetch user's check-ins to see which events they've checked into
    const { data: checkInsData } = await supabase
      .from("check_ins")
      .select("event_id, session_date")
      .eq("user_id", user.id);

    const checkInEventIds = new Set(checkInsData?.map((c) => c.event_id) || []);

    // Map events with check-in status
    const mappedEvents: Event[] = (eventsData || []).map((event) => ({
      ...event,
      checked_in: checkInEventIds.has(event.id),
    }));

    setEvents(mappedEvents);
    setLoading(false);
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

  const isEventLive = (event: Event): boolean => {
    const now = new Date();
    const currentTime = format(now, "HH:mm:ss");
    
    if (event.is_recurring && event.recurring_days) {
      const currentDay = now.getDay();
      return event.recurring_days.includes(currentDay) && 
             currentTime >= event.start_time && 
             currentTime <= event.end_time;
    }
    if (event.event_date && isToday(parseISO(event.event_date))) {
      return currentTime >= event.start_time && currentTime <= event.end_time;
    }
    return false;
  };

  const handleQuickCheckIn = async (event: Event) => {
    if (!user) return;

    if (!isEventLive(event)) {
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

        // Calculate distance using Haversine formula
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
          toast.error(`You're too far from the venue (${Math.round(distance)}m away)`);
          return;
        }

        const now = new Date();
        const today = format(now, "yyyy-MM-dd");
        
        const { data: existingCheckIn } = await supabase
          .from("check_ins")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .eq("session_date", today)
          .single();

        if (existingCheckIn) {
          toast.info("You've already checked in today! 🎉");
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

      {/* Welcome */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Hey there! 👋</h1>
          <p className="text-muted-foreground mt-1">Ready to check in today?</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border hover:bg-accent/50 transition-all"
            onClick={() => navigate("/user/profile")}
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <MousePointerClick size={20} className="text-success" />
            </div>
            <span className="font-medium text-sm">Quick Check-in</span>
          </Button>
        </motion.div>
      </div>

      {/* Upcoming Events */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Available Events</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events available right now</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const isLive = isEventLive(event);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-4 border border-border hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        {isLive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                            ● Live
                          </span>
                        )}
                        {event.checked_in && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            ✓ Checked in
                          </span>
                        )}
                      </div>
                    </div>
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

                  {isLive && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate("/checkin")}
                      >
                        <QrCode size={16} className="mr-2" />
                        Scan QR
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => handleQuickCheckIn(event)}
                        disabled={event.checked_in}
                      >
                        <MousePointerClick size={16} className="mr-2" />
                        {event.checked_in ? "Done" : "Check-in"}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;