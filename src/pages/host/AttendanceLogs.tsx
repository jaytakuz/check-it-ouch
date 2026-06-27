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
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  User,
  MapPin,
  UserCheck,
  UsersRound,
  Mail,
  Download,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Check,
  X,
  Shield,
} from "lucide-react";
import { PageLoading } from "@/components/ui/PageLoading";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type VerificationStatus = "verified" | "warning" | "failed";
type EffectiveStatus = VerificationStatus | "verified-manual";

const LATE_GRACE_MINUTES = 15;
const RADIUS_METERS = 100;

/** Derive raw verification status from objective signals. */
const deriveStatus = (distance: number, isLate: boolean): VerificationStatus => {
  if (distance > RADIUS_METERS) return "failed";
  if (isLate) return "warning";
  return "verified";
};

const StatusBadge = ({ status }: { status: EffectiveStatus }) => {
  if (status === "verified") {
    return (
      <Badge className="bg-success text-success-foreground hover:bg-success/90 gap-1 border-transparent">
        <ShieldCheck size={12} /> Verified
      </Badge>
    );
  }
  if (status === "verified-manual") {
    return (
      <Badge className="bg-success/70 text-success-foreground hover:bg-success/60 gap-1 border border-success/40">
        <Shield size={12} /> Verified (Manual)
      </Badge>
    );
  }
  if (status === "warning") {
    return (
      <Badge className="bg-warning text-warning-foreground hover:bg-warning/90 gap-1 border-transparent">
        <AlertTriangle size={12} /> Warning
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1 border-transparent">
      <XCircle size={12} /> Failed
    </Badge>
  );
};

const ActionButton = ({
  effective,
  onApprove,
  onUndo,
}: {
  effective: EffectiveStatus;
  onApprove: () => void;
  onUndo: () => void;
}) => {
  if (effective === "verified") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (effective === "verified-manual") {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-destructive" onClick={onUndo}>
              <X size={14} /> Undo
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Revert manual override</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 border-success/40 text-success hover:bg-success/10 hover:text-success" onClick={onApprove}>
            <Check size={14} /> Approve
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Manually approve check-in</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

type TrackingMode = "count_only" | "full_tracking";

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
  tracking_mode: TrackingMode;
}

interface SessionLog {
  date: string;
  sessionLabel: string;
  attendees: number;
  registeredExpected: number;
  registeredCount: number;
  guestCount: number;
  checkIns: CheckInRecord[];
  guestCheckIns: GuestCheckInRecord[];
}

interface CheckInRecord {
  id: string;
  user_id: string;
  student_id: string;
  checked_in_at: string;
  distance_meters: number;
  user_name: string | null;
  user_email?: string | null;
}

interface GuestCheckInRecord {
  id: string;
  guestName: string;
  guestEmail?: string | null;
  checkedInAt: string;
  sessionDate?: string;
  distance: number;
  trackingMode: string;
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
    avgAttendanceRate: 0,
    peakAttendance: 0,
    registeredTotal: 0,
    guestTotal: 0,
  });
  // Pre-seed mock-2 as a manual override so the UI demos the "Verified (Manual)" + Undo state.
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(new Set(["mock-2"]));

  const handleApprove = (id: string, name: string) => {
    setManualOverrides((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    toast.success(`Manually approved ${name}`);
  };

  const handleUndo = (id: string, name: string) => {
    setManualOverrides((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.message(`Undid manual approval for ${name}`);
  };

  /** Returns true when a check-in's clock time is past the event start + grace window. */
  const isCheckInLate = (checkedInIso: string): boolean => {
    if (!event) return false;
    const [h, m] = event.start_time.split(":").map((v) => parseInt(v, 10));
    const t = new Date(checkedInIso);
    const startMinutes = h * 60 + m + LATE_GRACE_MINUTES;
    const checkinMinutes = t.getHours() * 60 + t.getMinutes();
    return checkinMinutes > startMinutes;
  };

  const resolveEffectiveStatus = (id: string, distance: number, checkedInIso: string): EffectiveStatus => {
    const raw = deriveStatus(distance, isCheckInLate(checkedInIso));
    if (raw === "verified") return "verified";
    if (manualOverrides.has(id)) return "verified-manual";
    return raw;
  };

  /** Visualise the strictness rule attached to the event's tracking mode. */
  const strictnessLabel = (): { level: string; rule: string } => {
    if (!event) return { level: "Level 1", rule: "Time" };
    return event.tracking_mode === "full_tracking"
      ? { level: "Level 3", rule: "Time + QR + GPS" }
      : { level: "Level 1", rule: "Time" };
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (eventId) {
      fetchEventAndLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, eventId]);

  const fetchEventAndLogs = async () => {
    if (!eventId || !user) return;

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

    const trackingMode = (eventData.tracking_mode === "full_tracking" ? "full_tracking" : "count_only") as TrackingMode;
    const evt: Event = { ...eventData, tracking_mode: trackingMode };
    setEvent(evt);

    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("event_id", eventId)
      .order("session_date", { ascending: false });

    const userIds = [...new Set(checkIns?.map((c) => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    const { data: guestCheckInsData } = await supabase
      .from("guest_check_ins")
      .select("*")
      .eq("event_id", eventId)
      .order("session_date", { ascending: false });

    const guestCheckIns: GuestCheckInRecord[] = (guestCheckInsData || []).map((g) => ({
      id: g.id,
      guestName: g.guest_name || "Anonymous Guest",
      guestEmail: g.guest_email,
      checkedInAt: g.checked_in_at,
      sessionDate: g.session_date,
      distance: g.distance_meters || 0,
      trackingMode: g.tracking_mode || "count_only",
    }));

    const sessionMap = new Map<string, { registered: CheckInRecord[]; guests: GuestCheckInRecord[] }>();

    checkIns?.forEach((checkIn, idx) => {
      const date = checkIn.session_date;
      if (!sessionMap.has(date)) sessionMap.set(date, { registered: [], guests: [] });
      sessionMap.get(date)?.registered.push({
        id: checkIn.id,
        user_id: checkIn.user_id,
        student_id: `STD-${66001 + idx}`,
        checked_in_at: checkIn.checked_in_at,
        distance_meters: checkIn.distance_meters,
        user_name: profileMap.get(checkIn.user_id) || null,
      });
    });

    guestCheckIns.forEach((guest) => {
      const date = guest.sessionDate || new Date(guest.checkedInAt).toISOString().split("T")[0];
      if (!sessionMap.has(date)) sessionMap.set(date, { registered: [], guests: [] });
      sessionMap.get(date)?.guests.push(guest);
    });

    let logs: SessionLog[] = Array.from(sessionMap.entries())
      .map(([date, data], idx) => ({
        date,
        sessionLabel: `Session ${idx + 1}`,
        attendees: data.registered.length + data.guests.length,
        registeredExpected: data.registered.length + data.guests.length,
        registeredCount: data.registered.length,
        guestCount: data.guests.length,
        checkIns: data.registered.sort(
          (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
        ),
        guestCheckIns: data.guests.sort(
          (a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Inject demo data covering every status. For recurring events seed 3 sessions.
    if (logs.length === 0) {
      const sessionCount = evt.is_recurring ? 3 : 1;
      const startHour = parseInt(evt.start_time.split(":")[0], 10) || 9;
      const startMin = parseInt(evt.start_time.split(":")[1], 10) || 0;

      logs = Array.from({ length: sessionCount }).map((_, sIdx) => {
        const d = new Date();
        d.setDate(d.getDate() - (sessionCount - 1 - sIdx) * 7);
        const dateStr = d.toISOString().split("T")[0];

        const mkTime = (h: number, m: number) => {
          const dt = new Date(d);
          dt.setHours(h, m, 0, 0);
          return dt.toISOString();
        };

        // Most recent session shows the full mixed-state showcase.
        const isLatest = sIdx === sessionCount - 1;
        const mockCheckIns: CheckInRecord[] = isLatest
          ? [
              { id: "mock-1", user_id: "u1", student_id: "STD-66001", checked_in_at: mkTime(startHour, startMin + 2),  distance_meters: 18,  user_name: "Nattapong Sukjai",   user_email: "nattapong@example.com" },
              { id: "mock-2", user_id: "u2", student_id: "STD-66002", checked_in_at: mkTime(startHour, startMin + 22), distance_meters: 32,  user_name: "Pimchanok Wongthep", user_email: "pim@example.com" },
              { id: "mock-3", user_id: "u3", student_id: "STD-66003", checked_in_at: mkTime(startHour, startMin + 5),  distance_meters: 41,  user_name: "Kittipong Aroon",    user_email: "kittipong@example.com" },
              { id: "mock-4", user_id: "u4", student_id: "STD-66004", checked_in_at: mkTime(startHour, startMin + 18), distance_meters: 47,  user_name: "Suthida Phromma",    user_email: "suthida@example.com" },
              { id: "mock-5", user_id: "u5", student_id: "STD-66005", checked_in_at: mkTime(startHour, startMin + 9),  distance_meters: 134, user_name: "Anucha Boonmee",     user_email: "anucha@example.com" },
              { id: "mock-6", user_id: "u6", student_id: "STD-66006", checked_in_at: mkTime(startHour, startMin + 7),  distance_meters: 26,  user_name: "Pattaranan Srisuk",  user_email: "pattaranan@example.com" },
            ]
          : [
              { id: `mock-s${sIdx}-1`, user_id: "u1", student_id: "STD-66001", checked_in_at: mkTime(startHour, startMin + 3), distance_meters: 20, user_name: "Nattapong Sukjai",   user_email: "nattapong@example.com" },
              { id: `mock-s${sIdx}-2`, user_id: "u2", student_id: "STD-66002", checked_in_at: mkTime(startHour, startMin + 6), distance_meters: 35, user_name: "Pimchanok Wongthep", user_email: "pim@example.com" },
              { id: `mock-s${sIdx}-3`, user_id: "u3", student_id: "STD-66003", checked_in_at: mkTime(startHour, startMin + 8), distance_meters: 42, user_name: "Kittipong Aroon",    user_email: "kittipong@example.com" },
              { id: `mock-s${sIdx}-4`, user_id: "u4", student_id: "STD-66004", checked_in_at: mkTime(startHour, startMin + 4), distance_meters: 28, user_name: "Suthida Phromma",    user_email: "suthida@example.com" },
              { id: `mock-s${sIdx}-5`, user_id: "u5", student_id: "STD-66005", checked_in_at: mkTime(startHour, startMin + 11), distance_meters: 38, user_name: "Anucha Boonmee",    user_email: "anucha@example.com" },
              { id: `mock-s${sIdx}-6`, user_id: "u6", student_id: "STD-66006", checked_in_at: mkTime(startHour, startMin + 5), distance_meters: 24, user_name: "Pattaranan Srisuk", user_email: "pattaranan@example.com" },
            ];

        return {
          date: dateStr,
          sessionLabel: `Session ${sIdx + 1}`,
          attendees: mockCheckIns.length,
          registeredExpected: mockCheckIns.length,
          registeredCount: mockCheckIns.length,
          guestCount: 0,
          checkIns: mockCheckIns,
          guestCheckIns: [],
        };
      }).reverse(); // latest first
    }

    setSessionLogs(logs);

    const totalSessions = logs.length;
    const totalCheckIns = logs.reduce((sum, log) => sum + log.attendees, 0);
    const registeredTotal = logs.reduce((sum, log) => sum + log.registeredCount, 0);
    const guestTotal = logs.reduce((sum, log) => sum + log.guestCount, 0);
    const avgAttendanceRate = totalSessions > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + (l.registeredExpected > 0 ? (l.attendees / l.registeredExpected) * 100 : 0), 0) / totalSessions
        )
      : 0;
    const peakAttendance = logs.length > 0 ? Math.max(...logs.map((l) => l.attendees)) : 0;

    setOverallStats({
      totalSessions,
      totalCheckIns,
      avgAttendanceRate,
      peakAttendance,
      registeredTotal,
      guestTotal,
    });

    if (logs.length > 0) setSelectedSession(logs[0].date);
    setLoading(false);
  };

  const exportToExcel = () => {
    if (sessionLogs.length === 0) {
      toast.error("No data to export");
      return;
    }
    const rows: Record<string, string | number>[] = [];
    sessionLogs.forEach((session) => {
      session.checkIns.forEach((c) => {
        rows.push({
          Date: session.date,
          "Student ID": c.student_id,
          Name: c.user_name || "Unknown",
          Email: c.user_email || "-",
          Type: "Registered",
          "Check-in Time": format(new Date(c.checked_in_at), "h:mm a"),
          "Distance (m)": Math.round(c.distance_meters),
        });
      });
      session.guestCheckIns.forEach((g) => {
        rows.push({
          Date: session.date,
          "Student ID": "-",
          Name: g.guestName,
          Email: g.guestEmail || "-",
          Type: "Guest",
          "Check-in Time": format(new Date(g.checkedInAt), "h:mm a"),
          "Distance (m)": Math.round(g.distance),
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${event?.name || "attendance"}-logs.xlsx`);
    toast.success("Exported successfully");
  };

  const formatSessionDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM d, yyyy");
  };

  const shortSessionDate = (dateStr: string): string => format(parseISO(dateStr), "MMM d");

  const formatTime = (time: string): string => {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const sessionAttendanceRate = (s: SessionLog): number => {
    if (s.registeredExpected <= 0) return 0;
    return Math.round((s.attendees / s.registeredExpected) * 100);
  };

  if (authLoading || loading) return <PageLoading />;

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const strict = strictnessLabel();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-semibold text-foreground truncate">{event.name}</h1>
                <Badge variant={event.tracking_mode === "full_tracking" ? "default" : "secondary"} className="text-xs">
                  {event.tracking_mode === "full_tracking" ? (
                    <><UserCheck size={10} className="mr-1" /> Full Tracking</>
                  ) : (
                    <><UsersRound size={10} className="mr-1" /> Count Only</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm text-muted-foreground">Attendance Logs</p>
                <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                  <Shield size={10} />
                  Tracking Rule: {strict.level} ({strict.rule})
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportToExcel}>
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 py-6"
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
            <p className="text-2xl font-bold text-foreground">{overallStats.avgAttendanceRate}%</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">Peak Attendance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overallStats.peakAttendance}</p>
          </div>
        </div>

        {(overallStats.registeredTotal > 0 || overallStats.guestTotal > 0) && (
          <div className="bg-card rounded-xl p-4 border border-border mb-6">
            <h3 className="font-medium text-foreground mb-3">Check-in Breakdown</h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{overallStats.registeredTotal}</p>
                  <p className="text-xs text-muted-foreground">Registered</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <UsersRound size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{overallStats.guestTotal}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Session Selector */}
      <Tabs
        value={selectedSession || ""}
        onValueChange={setSelectedSession}
        className="max-w-2xl mx-auto px-4"
      >
        {sessionLogs.length > 1 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Select Session</p>
            <TabsList className="w-full flex overflow-x-auto gap-2 bg-transparent p-0 h-auto justify-start">
              {sessionLogs.slice().reverse().map((session, idx) => {
                const isTodaySession = isToday(parseISO(session.date));
                return (
                  <TabsTrigger
                    key={session.date}
                    value={session.date}
                    className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Session {idx + 1}</span>
                      <span className="text-xs opacity-80">{shortSessionDate(session.date)}</span>
                      {isTodaySession && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold">TODAY</Badge>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        )}

        {sessionLogs.map((session) => {
          const rate = sessionAttendanceRate(session);
          return (
            <TabsContent key={session.date} value={session.date} className="space-y-4">
              {/* Session Summary */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">
                    {formatSessionDate(session.date)}
                  </h3>
                  <Badge
                    className={cn(
                      "border-transparent",
                      rate >= 90
                        ? "bg-success text-success-foreground"
                        : rate >= 70
                        ? "bg-primary text-primary-foreground"
                        : "bg-warning text-warning-foreground"
                    )}
                  >
                    {rate}% Attendance
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {session.attendees} / {session.registeredExpected} attended
                  </span>
                  {session.registeredCount > 0 && (
                    <span className="flex items-center gap-1">
                      <UserCheck size={14} className="text-primary" />
                      {session.registeredCount} registered
                    </span>
                  )}
                  {session.guestCount > 0 && (
                    <span className="flex items-center gap-1">
                      <UsersRound size={14} />
                      {session.guestCount} guests
                    </span>
                  )}
                </div>
              </div>

              {/* Registered Attendee List */}
              {session.checkIns.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <UserCheck size={16} className="text-primary" />
                    <h4 className="font-medium text-foreground">Registered Attendees</h4>
                    <Badge variant="secondary" className="ml-auto">{session.registeredCount}</Badge>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Time In</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.checkIns.map((checkIn, index) => {
                          const effective = resolveEffectiveStatus(checkIn.id, checkIn.distance_meters, checkIn.checked_in_at);
                          const name = checkIn.user_name || `Attendee ${index + 1}`;
                          const late = isCheckInLate(checkIn.checked_in_at);
                          const tooFar = checkIn.distance_meters > RADIUS_METERS;
                          return (
                            <TableRow key={checkIn.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {checkIn.student_id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User size={14} className="text-primary" />
                                  </div>
                                  <span className="font-medium text-foreground">{name}</span>
                                </div>
                              </TableCell>
                              <TableCell className={cn(late ? "text-warning font-semibold" : "text-muted-foreground")}>
                                {format(new Date(checkIn.checked_in_at), "h:mm a")}
                                {late && <span className="block text-[10px] font-normal opacity-80">Late</span>}
                              </TableCell>
                              <TableCell className={cn(tooFar ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                {Math.round(checkIn.distance_meters)}m
                                {tooFar && <span className="block text-[10px] font-normal opacity-80">Outside radius</span>}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={effective} />
                              </TableCell>
                              <TableCell className="text-right">
                                <ActionButton
                                  effective={effective}
                                  onApprove={() => handleApprove(checkIn.id, name)}
                                  onUndo={() => handleUndo(checkIn.id, name)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-border">
                    {session.checkIns.map((checkIn, index) => {
                      const effective = resolveEffectiveStatus(checkIn.id, checkIn.distance_meters, checkIn.checked_in_at);
                      const name = checkIn.user_name || `Attendee ${index + 1}`;
                      const late = isCheckInLate(checkIn.checked_in_at);
                      const tooFar = checkIn.distance_meters > RADIUS_METERS;
                      return (
                        <div key={checkIn.id} className="p-4 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground truncate">{name}</span>
                              <StatusBadge status={effective} />
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground mb-1">{checkIn.student_id}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className={cn("flex items-center gap-1", late ? "text-warning font-semibold" : "text-muted-foreground")}>
                                <Clock size={12} />
                                {format(new Date(checkIn.checked_in_at), "h:mm a")}
                                {late && " (Late)"}
                              </span>
                              <span className={cn("flex items-center gap-1", tooFar ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                <MapPin size={12} />
                                {Math.round(checkIn.distance_meters)}m
                                {tooFar && " (Far)"}
                              </span>
                            </div>
                            <div className="mt-2">
                              <ActionButton
                                effective={effective}
                                onApprove={() => handleApprove(checkIn.id, name)}
                                onUndo={() => handleUndo(checkIn.id, name)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guest Attendee List */}
              {session.guestCheckIns.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <UsersRound size={16} className="text-muted-foreground" />
                    <h4 className="font-medium text-foreground">Guest Check-ins</h4>
                    <Badge variant="outline" className="ml-auto">{session.guestCount}</Badge>
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          {event.tracking_mode === "full_tracking" && <TableHead>Email</TableHead>}
                          <TableHead>Time In</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.guestCheckIns.map((guest) => {
                          const effective = resolveEffectiveStatus(guest.id, guest.distance, guest.checkedInAt);
                          const late = isCheckInLate(guest.checkedInAt);
                          return (
                            <TableRow key={guest.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <User size={14} className="text-muted-foreground" />
                                  </div>
                                  <span className="font-medium text-foreground">{guest.guestName}</span>
                                </div>
                              </TableCell>
                              {event.tracking_mode === "full_tracking" && (
                                <TableCell className="text-muted-foreground">
                                  {guest.guestEmail ? (
                                    <span className="flex items-center gap-1">
                                      <Mail size={12} />
                                      {guest.guestEmail}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                              )}
                              <TableCell className={cn(late ? "text-warning font-semibold" : "text-muted-foreground")}>
                                {format(new Date(guest.checkedInAt), "h:mm a")}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={effective} />
                              </TableCell>
                              <TableCell className="text-right">
                                <ActionButton
                                  effective={effective}
                                  onApprove={() => handleApprove(guest.id, guest.guestName)}
                                  onUndo={() => handleUndo(guest.id, guest.guestName)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden divide-y divide-border">
                    {session.guestCheckIns.map((guest) => {
                      const effective = resolveEffectiveStatus(guest.id, guest.distance, guest.checkedInAt);
                      const late = isCheckInLate(guest.checkedInAt);
                      return (
                        <div key={guest.id} className="p-4 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground truncate">{guest.guestName}</span>
                              <StatusBadge status={effective} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className={cn("flex items-center gap-1", late && "text-warning font-semibold")}>
                                <Clock size={12} />
                                {format(new Date(guest.checkedInAt), "h:mm a")}
                                {late && " (Late)"}
                              </span>
                              {event.tracking_mode === "full_tracking" && guest.guestEmail && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail size={12} />
                                  {guest.guestEmail}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <ActionButton
                                effective={effective}
                                onApprove={() => handleApprove(guest.id, guest.guestName)}
                                onUndo={() => handleUndo(guest.id, guest.guestName)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {session.checkIns.length === 0 && session.guestCheckIns.length === 0 && (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                  No check-ins recorded for this session
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

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
    </div>
  );
};

export default AttendanceLogs;
