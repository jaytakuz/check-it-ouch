import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Wifi, Clock, Check, QrCode, Scan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import QRScanner from "@/components/QRScanner";
import LeafletLocationMap from "@/components/LeafletLocationMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type CheckInState = "scanning" | "checking" | "ready" | "success" | "failed";
type FailReason = "location" | "time" | "qr" | "already" | null;

interface EventData {
  id: string;
  name: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  radius_meters: number;
  start_time: string;
  end_time: string;
  qr_secret: string;
}

const CheckIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<CheckInState>("scanning");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);

  const { latitude, longitude, error: geoError, isLoading: geoLoading } = useGeolocation();

  // Check if coming from QR scan (via URL parameter)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setScannedCode(code);
      setState("checking");
    }
  }, [searchParams]);

  // Parse QR code and fetch event data
  useEffect(() => {
    if (scannedCode && state === "checking") {
      parseAndVerifyQRCode(scannedCode);
    }
  }, [scannedCode, state]);

  // Location verification
  useEffect(() => {
    if (latitude && longitude && eventData) {
      const dist = calculateDistance(
        latitude,
        longitude,
        eventData.location_lat,
        eventData.location_lng
      );
      setDistance(dist);
      const withinRange = dist <= eventData.radius_meters;
      setIsWithinRadius(withinRange);

      // Auto-transition to ready once we have location
      if (!geoLoading && state === "checking") {
        setState(withinRange ? "ready" : "checking");
      }
    }
  }, [latitude, longitude, eventData, geoLoading, state]);

  // Update timestamp for success screen
  useEffect(() => {
    if (state === "success") {
      const interval = setInterval(() => {
        setTimestamp(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const parseAndVerifyQRCode = async (code: string) => {
    // QR format: CHECKIN-{eventId}-{qrSecret}-{timestamp}
    const parts = code.split("-");
    if (parts.length < 4 || parts[0] !== "CHECKIN") {
      setState("failed");
      setFailReason("qr");
      return;
    }

    const eventId = parts[1];
    const qrSecret = parts[2];
    const qrTimestamp = parseInt(parts[3]);

    // Check if QR code is not too old (valid for 10 seconds)
    const now = Date.now();
    if (now - qrTimestamp > 10000) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    // Fetch event data
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error || !event) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    // Verify QR secret
    if (event.qr_secret !== qrSecret) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    // Check time window
    const currentTime = new Date().toTimeString().slice(0, 8);
    if (currentTime < event.start_time || currentTime > event.end_time) {
      setState("failed");
      setFailReason("time");
      return;
    }

    setEventData(event);
  };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleQRScan = (data: string) => {
    if (data.startsWith("CHECKIN-")) {
      setScannedCode(data);
      setShowScanner(false);
      setState("checking");
    } else {
      setShowScanner(false);
      setState("failed");
      setFailReason("qr");
    }
  };

  const handleCheckIn = async () => {
    if (!user) {
      toast.error("Please log in to check in");
      navigate("/auth");
      return;
    }

    if (!isWithinRadius) {
      setState("failed");
      setFailReason("location");
      return;
    }

    if (!eventData || !latitude || !longitude || !scannedCode) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingCheckIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("event_id", eventData.id)
      .eq("user_id", user.id)
      .eq("session_date", today)
      .maybeSingle();

    if (existingCheckIn) {
      setState("failed");
      setFailReason("already");
      return;
    }

    // Save check-in to database
    const { error } = await supabase.from("check_ins").insert({
      event_id: eventData.id,
      user_id: user.id,
      location_lat: latitude,
      location_lng: longitude,
      distance_meters: distance || 0,
      qr_code_used: scannedCode,
    });

    if (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to save check-in");
      return;
    }

    setState("success");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const resetCheckIn = () => {
    setState("scanning");
    setScannedCode(null);
    setFailReason(null);
    setEventData(null);
  };

  // Success Screen
  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-success flex flex-col items-center justify-center p-6 text-success-foreground"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-success-foreground/20 flex items-center justify-center mb-8"
        >
          <Check size={48} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-2"
        >
          VERIFIED
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-success-foreground/80 mb-8"
        >
          Your presence has been recorded
        </motion.p>

        {/* Live Timestamp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-success-foreground/10 rounded-2xl px-8 py-4 mb-8"
        >
          <p className="text-sm text-success-foreground/70 text-center mb-1">Check-in time</p>
          <p className="text-3xl font-mono font-bold">{formatTime(timestamp)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 w-full max-w-xs"
        >
          <Button
            variant="secondary"
            className="w-full bg-success-foreground/20 hover:bg-success-foreground/30 text-success-foreground border-0"
            size="lg"
          >
            Download Certificate
          </Button>
          <Button
            variant="ghost"
            className="w-full text-success-foreground/80 hover:bg-success-foreground/10"
            onClick={() => navigate("/user/dashboard")}
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Failed Screen
  if (state === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-destructive flex flex-col items-center justify-center p-6 text-destructive-foreground"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-destructive-foreground/20 flex items-center justify-center mb-8"
        >
          {failReason === "location" ? (
            <MapPin size={48} />
          ) : failReason === "qr" ? (
            <QrCode size={48} />
          ) : (
            <Clock size={48} />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-2 text-center"
        >
          CHECK-IN FAILED
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-destructive-foreground/80 text-center mb-8"
        >
          {failReason === "location"
            ? "You are outside the check-in radius"
            : failReason === "qr"
            ? "Invalid or expired QR code"
            : failReason === "already"
            ? "You have already checked in today"
            : "Check-in window has closed"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-destructive-foreground/10 rounded-2xl p-4 mb-8 text-center"
        >
          {failReason === "location" ? (
            <>
              <MapPin size={24} className="mx-auto mb-2" />
              <p className="text-sm">Move closer to the event location</p>
              <p className="text-xs text-destructive-foreground/70 mt-1">
                Required: Within {eventData?.radius_meters || 50}m of venue
                {distance && ` (Currently ${Math.round(distance)}m away)`}
              </p>
            </>
          ) : failReason === "qr" ? (
            <>
              <QrCode size={24} className="mx-auto mb-2" />
              <p className="text-sm">Please scan a valid event QR code</p>
              <p className="text-xs text-destructive-foreground/70 mt-1">
                Scan the QR displayed by your host
              </p>
            </>
          ) : failReason === "already" ? (
            <>
              <Check size={24} className="mx-auto mb-2" />
              <p className="text-sm">You've already checked in</p>
              <p className="text-xs text-destructive-foreground/70 mt-1">
                One check-in per session is allowed
              </p>
            </>
          ) : (
            <>
              <Clock size={24} className="mx-auto mb-2" />
              <p className="text-sm">Check-in time has expired</p>
              <p className="text-xs text-destructive-foreground/70 mt-1">
                Contact your host for assistance
              </p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 w-full max-w-xs"
        >
          <Button
            variant="secondary"
            className="w-full bg-destructive-foreground/20 hover:bg-destructive-foreground/30 text-destructive-foreground border-0"
            size="lg"
            onClick={resetCheckIn}
          >
            Try Again
          </Button>
          <Button
            variant="ghost"
            className="w-full text-destructive-foreground/80 hover:bg-destructive-foreground/10"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // QR Scanner overlay
  if (showScanner) {
    return <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />;
  }

  // Scanning state - prompt to scan QR
  if (state === "scanning") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Check In</h1>
            <p className="text-sm text-muted-foreground">Scan to verify your presence</p>
          </div>
        </header>

        {/* Scanner prompt */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Scan size={48} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Scan Event QR Code</h2>
            <p className="text-muted-foreground">
              Point your camera at the QR code displayed by your host
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="gap-2 px-8" onClick={() => setShowScanner(true)}>
              <QrCode size={20} />
              Open Scanner
            </Button>
          </motion.div>
        </div>

        {/* Location Preview */}
        <div className="p-6 border-t border-border">
          <LeafletLocationMap
            eventLocation={{ lat: 0, lng: 0 }}
            radiusMeters={50}
            onLocationVerified={(within, dist) => {
              setIsWithinRadius(within);
              setDistance(dist);
            }}
          />
        </div>
      </div>
    );
  }

  // Main Check-in Screen (after scanning)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={resetCheckIn}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">{eventData?.name || "Loading..."}</h1>
          <p className="text-sm text-muted-foreground">{eventData?.location_name || ""}</p>
        </div>
      </header>

      {/* Status Indicators */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          {/* QR Status */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <QrCode size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">QR Code</p>
              <p className="text-sm text-muted-foreground">Valid code scanned ✓</p>
            </div>
          </motion.div>

          {/* GPS Location */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                geoLoading
                  ? "bg-muted text-muted-foreground"
                  : isWithinRadius
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">GPS Location</p>
              <p className="text-sm text-muted-foreground">
                {geoLoading
                  ? "Checking..."
                  : geoError
                  ? geoError
                  : isWithinRadius
                  ? "Within range ✓"
                  : `Outside range (${distance ? Math.round(distance) : "?"}m away)`}
              </p>
            </div>
            {geoLoading && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </motion.div>

          {/* Time Window */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Time Window</p>
              <p className="text-sm text-muted-foreground">
                Active until{" "}
                {eventData?.end_time
                  ? (() => {
                      const [h, m] = eventData.end_time.split(":");
                      const hour = parseInt(h);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      return `${hour % 12 || 12}:${m} ${ampm}`;
                    })()
                  : "..."}
              </p>
            </div>
          </motion.div>

          {/* Connection */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Wifi size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Connection</p>
              <p className="text-sm text-muted-foreground">Connected ✓</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Big Check-in Button */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div className="relative">
          {/* Pulse rings */}
          <AnimatePresence>
            {state === "ready" && isWithinRadius && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={state === "checking" || geoLoading || !isWithinRadius}
            onClick={handleCheckIn}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-lg transition-all",
              state === "checking" || geoLoading
                ? "bg-muted text-muted-foreground"
                : isWithinRadius
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Check size={48} className="mb-2" />
            <span className="text-lg font-semibold">
              {geoLoading ? "Locating..." : isWithinRadius ? "Check In" : "Too Far"}
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckIn;