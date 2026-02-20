import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, RefreshCw, UserCheck, UsersRound, Maximize2, Minimize2 } from "lucide-react";
import { PageLoading } from "@/components/ui/PageLoading";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const QR_REFRESH_INTERVAL = 7000; // 7 seconds

type TrackingMode = "count_only" | "full_tracking";

const LiveMonitor = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(7);
  const [checkedIn, setCheckedIn] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [maxAttendees, setMaxAttendees] = useState(50);
  const [eventName, setEventName] = useState("Loading...");
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("count_only");
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (eventId) {
      fetchEventData();
    }
  }, [user, authLoading, eventId, navigate]);

  const fetchEventData = async () => {
    if (!eventId) return;

    // Fetch event details
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error || !event) {
      console.error("Error fetching event:", error);
      navigate("/host/dashboard");
      return;
    }

    setEventName(event.name);
    setMaxAttendees(event.max_attendees || 50);
    setTrackingMode((event.tracking_mode === "full_tracking" ? "full_tracking" : "count_only") as TrackingMode);

    // Generate initial QR code
    generateQRCode(event.qr_secret);

    // Fetch check-in count
    fetchCheckInCount();

    // Fetch guest check-ins from localStorage
    fetchGuestCount();

    setLoading(false);
  };

  const generateQRCode = (qrSecret: string) => {
    const timestamp = Date.now();
    const qrData = `CHECKIN-${eventId}-${qrSecret}-${timestamp}`;
    setQrValue(qrData);
    setTimeLeft(7);
  };

  const fetchCheckInCount = async () => {
    if (!eventId) return;

    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("session_date", today);

    setCheckedIn(count || 0);
  };

  const fetchGuestCount = async () => {
    if (!eventId) return;

    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("guest_check_ins")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("session_date", today);

    setGuestCount(count || 0);
  };

  // QR refresh and countdown effect
  useEffect(() => {
    if (loading || !eventId) return;

    const qrInterval = setInterval(async () => {
      // Fetch fresh qr_secret each refresh
      const { data: event } = await supabase
        .from("events")
        .select("qr_secret")
        .eq("id", eventId)
        .maybeSingle();

      if (event) {
        generateQRCode(event.qr_secret);
      }
    }, QR_REFRESH_INTERVAL);

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7));
    }, 1000);

    // Refresh check-in count periodically
    const checkInInterval = setInterval(() => {
      fetchCheckInCount();
      fetchGuestCount();
    }, 3000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(countdownInterval);
      clearInterval(checkInInterval);
    };
  }, [loading, eventId]);

  // Set up realtime subscription for check-ins
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`check_ins_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchCheckInCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guest_check_ins",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchGuestCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const totalCheckedIn = checkedIn + guestCount;
  const progress = (totalCheckedIn / maxAttendees) * 100;

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => setFullscreen(false)}
        >
          <Minimize2 size={24} />
        </Button>

        <div className="bg-card p-10 rounded-3xl shadow-lg border border-border mb-8">
          <QRCodeSVG
            value={qrValue}
            size={400}
            bgColor="transparent"
            fgColor="hsl(var(--foreground))"
            level="M"
            includeMargin
          />
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Refreshes in</span>
            <span className="text-sm font-medium text-foreground">{timeLeft}s</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / 7) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-4xl font-bold text-foreground">{totalCheckedIn} <span className="text-muted-foreground text-xl">/ {maxAttendees}</span></p>
          <p className="text-muted-foreground mt-1">Checked in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">{eventName}</h1>
                <Badge variant={trackingMode === "full_tracking" ? "default" : "secondary"} className="text-xs">
                  {trackingMode === "full_tracking" ? (
                    <><UserCheck size={10} className="mr-1" /> Full Tracking</>
                  ) : (
                    <><UsersRound size={10} className="mr-1" /> Count Only</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Live Monitor</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFullscreen(true)}>
            <Maximize2 size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 max-w-2xl mx-auto w-full">
        {/* QR Code */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="bg-card p-6 rounded-3xl shadow-lg border border-border">
            <QRCodeSVG
              value={qrValue}
              size={240}
              bgColor="transparent"
              fgColor="hsl(var(--foreground))"
              level="M"
              includeMargin
            />
          </div>

          {/* Refresh Indicator */}
          <motion.div
            key={qrValue}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-2 shadow-md"
          >
            <RefreshCw size={16} className="animate-spin" style={{ animationDuration: "2s" }} />
          </motion.div>
        </motion.div>

        {/* Timer Bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">QR refreshes in</span>
            <span className="text-sm font-medium text-foreground">{timeLeft}s</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / 7) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Scan to Check In</p>
          <p className="text-sm text-muted-foreground">
            {trackingMode === "full_tracking" 
              ? "Attendees will register and verify location"
              : "Quick scan - no registration required"}
          </p>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="border-t border-border bg-card">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Users size={24} className="text-success" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalCheckedIn}</span>
                <span className="text-muted-foreground">/ {maxAttendees}</span>
              </div>
              <p className="text-sm text-muted-foreground">Checked in</p>
            </div>
          </div>

          {/* Breakdown for both modes */}
          {(checkedIn > 0 || guestCount > 0) && (
            <div className="flex gap-4 mb-4 text-sm">
              {checkedIn > 0 && (
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-primary" />
                  <span className="text-muted-foreground">{checkedIn} registered</span>
                </div>
              )}
              {guestCount > 0 && (
                <div className="flex items-center gap-2">
                  <UsersRound size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{guestCount} guests</span>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-success rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
