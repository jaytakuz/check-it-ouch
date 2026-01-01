import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Calendar,
  Award,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  User,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, parseISO, startOfMonth, endOfMonth } from "date-fns";

interface Event {
  id: string;
  name: string;
  event_date: string | null;
  is_recurring: boolean;
  recurring_days: number[] | null;
  start_time: string;
  end_time: string;
  location_name: string;
  host_name?: string;
  checked_in?: boolean;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyCheckIns, setMonthlyCheckIns] = useState(0);

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

    // Count monthly check-ins
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const { count } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("session_date", monthStart)
      .lte("session_date", monthEnd);

    setMonthlyCheckIns(count || 0);
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

  const isEventToday = (event: Event): boolean => {
    if (event.is_recurring && event.recurring_days) {
      return event.recurring_days.includes(new Date().getDay());
    }
    if (event.event_date) {
      return isToday(parseISO(event.event_date));
    }
    return false;
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

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border"
            onClick={() => navigate("/checkin")}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode size={20} className="text-primary" />
            </div>
            <span className="font-medium">Scan to Check-in</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4 bg-card border-border"
            onClick={() => navigate("/user/profile")}
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Award size={20} className="text-success" />
            </div>
            <span className="font-medium">My Certificates</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary rounded-2xl p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">This Month</p>
              <p className="text-3xl font-bold">{monthlyCheckIns}</p>
              <p className="text-sm text-primary-foreground/80">Check-ins completed</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
          </div>
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
            <p className="text-muted-foreground">No events available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      {event.checked_in && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
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

                {!event.checked_in && isEventToday(event) && (
                  <div className="mt-4">
                    <Button className="w-full" onClick={() => navigate("/checkin")}>
                      Check In Now
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;