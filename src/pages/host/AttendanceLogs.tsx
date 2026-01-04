import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, subDays, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  User,
  MapPin,
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  is_recurring: boolean;
  recurring_days: number[] | null;
  start_time: string;
  end_time: string;
  location_name: string;
  max_attendees: number | null;
  host_id: string;
}

interface SessionLog {
  date: string;
  attendees: number;
  checkIns: CheckInRecord[];
}

interface CheckInRecord {
  id: string;
  user_id: string;
  checked_in_at: string;
  distance_meters: number;
  user_name: string | null;
}

const AttendanceLogs = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalSessions: 0,
    totalCheckIns: 0,
    avgAttendance: 0,
    peakAttendance: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (eventId) {
      fetchEventAndLogs();
    }
  }, [user, authLoading, eventId]);

  const fetchEventAndLogs = async () => {
    if (!eventId || !user) return;

    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("host_id", user.id)
      .maybeSingle();

    if (eventError || !eventData) {
      toast.error("Event not found or you don't have access");
      navigate("/dashboard");
      return;
    }

    setEvent(eventData);

    // Fetch all check-ins for this event
    const { data: checkIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("*")
      .eq("event_id", eventId)
      .order("session_date", { ascending: false });

    if (checkInsError) {
      console.error("Error fetching check-ins:", checkInsError);
      setLoading(false);
      return;
    }

    // Fetch user profiles for names
    const userIds = [...new Set(checkIns?.map((c) => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    // Group check-ins by session_date
    const sessionMap = new Map<string, CheckInRecord[]>();
    checkIns?.forEach((checkIn) => {
      const date = checkIn.session_date;
      if (!sessionMap.has(date)) {
        sessionMap.set(date, []);
      }
      sessionMap.get(date)?.push({
        id: checkIn.id,
        user_id: checkIn.user_id,
        checked_in_at: checkIn.checked_in_at,
        distance_meters: checkIn.distance_meters,
        user_name: profileMap.get(checkIn.user_id) || null,
      });
    });

    // Convert to array and sort
    const logs: SessionLog[] = Array.from(sessionMap.entries())
      .map(([date, checkIns]) => ({
        date,
        attendees: checkIns.length,
        checkIns: checkIns.sort(
          (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setSessionLogs(logs);

    // Calculate overall stats
    const totalSessions = logs.length;
    const totalCheckIns = logs.reduce((sum, log) => sum + log.attendees, 0);
    const avgAttendance = totalSessions > 0 ? Math.round(totalCheckIns / totalSessions) : 0;
    const peakAttendance = logs.length > 0 ? Math.max(...logs.map((l) => l.attendees)) : 0;

    setOverallStats({
      totalSessions,
      totalCheckIns,
      avgAttendance,
      peakAttendance,
    });

    if (logs.length > 0) {
      setSelectedSession(logs[0].date);
    }

    setLoading(false);
  };

  const formatSessionDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM d, yyyy");
  };

  const formatTime = (time: string): string => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const getAttendanceRate = (attendees: number): number => {
    if (!event?.max_attendees) return 0;
    return Math.round((attendees / event.max_attendees) * 100);
  };

  const getSelectedSessionData = (): SessionLog | null => {
    return sessionLogs.find((s) => s.date === selectedSession) || null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const selectedData = getSelectedSessionData();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{event.name}</h1>
              <p className="text-sm text-muted-foreground">Attendance Logs</p>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6"
      >
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">Total Sessions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.totalSessions}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-success" />
              <span className="text-sm text-muted-foreground">Total Check-ins</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.totalCheckIns}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-warning" />
              <span className="text-sm text-muted-foreground">Avg Attendance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.avgAttendance}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">Peak Attendance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.peakAttendance}</p>
          </div>
        </div>

        {/* Event Info */}
        <div className="bg-card rounded-xl p-4 border border-border mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Schedule</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Location</p>
              <p className="text-sm text-muted-foreground">{event.location_name}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Session Tabs */}
      <Tabs
        value={selectedSession || ""}
        onValueChange={setSelectedSession}
        className="px-4"
      >
        <TabsList className="w-full flex overflow-x-auto gap-2 bg-transparent p-0 mb-4">
          {sessionLogs.slice(0, 7).map((session) => (
            <TabsTrigger
              key={session.date}
              value={session.date}
              className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
            >
              <div className="text-center">
                <p className="text-xs font-medium">{formatSessionDate(session.date)}</p>
                <p className="text-xs opacity-70">{session.attendees} attended</p>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {sessionLogs.map((session) => (
          <TabsContent key={session.date} value={session.date} className="space-y-4">
            {/* Session Summary */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">
                  {formatSessionDate(session.date)}
                </h3>
                <Badge
                  variant={getAttendanceRate(session.attendees) >= 70 ? "default" : "secondary"}
                >
                  {getAttendanceRate(session.attendees)}% attendance
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {session.attendees} attendees
                </span>
                {event.max_attendees && (
                  <span>of {event.max_attendees} capacity</span>
                )}
              </div>
            </div>

            {/* Attendee List */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="font-medium text-foreground">Attendee List</h4>
              </div>
              {session.checkIns.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No check-ins recorded for this session
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.checkIns.map((checkIn, index) => (
                      <TableRow key={checkIn.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={14} className="text-primary" />
                            </div>
                            <span className="font-medium text-foreground">
                              {checkIn.user_name || `Attendee ${index + 1}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(checkIn.checked_in_at), "h:mm a")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Math.round(checkIn.distance_meters)}m
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Empty State */}
      {sessionLogs.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No sessions yet</h3>
          <p className="text-muted-foreground mb-6">
            Check-in logs will appear here once attendees start checking in
          </p>
          <Button onClick={() => navigate(`/host/monitor/${eventId}`)}>
            Start Live Monitor
          </Button>
        </div>
      )}

      {/* View All Sessions Link */}
      {sessionLogs.length > 7 && (
        <div className="px-4 mt-4">
          <Button variant="outline" className="w-full" onClick={() => {}}>
            View all {sessionLogs.length} sessions
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AttendanceLogs;
