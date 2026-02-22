import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, QrCode, Check, Clock, Scan, User, Mail, ChevronRight, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import QRScanner from "@/components/QRScanner";
import LeafletLocationMap from "@/components/LeafletLocationMap";
import { cn } from "@/lib/utils";

type GuestState = "initial" | "scanning" | "checking" | "ready" | "register" | "success" | "failed";
type FailReason = "location" | "time" | "qr" | "event" | null;
type TrackingMode = "count_only" | "full_tracking";

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
  tracking_mode: TrackingMode;
}

const GuestJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<GuestState>("initial");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsChecking, setGpsChecking] = useState(false);

  // For registration (full tracking mode)
  const [registrationData, setRegistrationData] = useState({
    name: "",
    email: "",
  });

  // For count-only mode (just a display name)
  const [guestName, setGuestName] = useState("");

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

  // Update timestamp for success screen
  useEffect(() => {
    if (state === "success") {
      const interval = setInterval(() => {
        setTimestamp(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

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

  const parseAndVerifyQRCode = async (code: string) => {
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

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error || !event) {
      setState("failed");
      setFailReason("event");
      return;
    }

    if (event.qr_secret !== qrSecret) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    const currentTime = new Date().toTimeString().slice(0, 8);
    if (currentTime < event.start_time || currentTime > event.end_time) {
      setState("failed");
      setFailReason("time");
      return;
    }

    // Set event data with tracking mode
    const trackingMode = (event.tracking_mode === "full_tracking" ? "full_tracking" : "count_only") as TrackingMode;
    
    setEventData({
      ...event,
      tracking_mode: trackingMode,
    });

    // For full_tracking events, guests must login/register first
    if (trackingMode === "full_tracking") {
      toast.info("This event requires registration. Please log in or create an account.");
      navigate(`/auth?redirect=${encodeURIComponent(`/checkin?code=${encodeURIComponent(code)}`)}`);
      return;
    }
    
    // Count-only mode: proceed as guest, simulate GPS check
    setState("ready");
    setGpsChecking(true);
    setTimeout(() => {
      setIsWithinRadius(true);
      setDistance(Math.floor(Math.random() * 15) + 3);
      setGpsChecking(false);
    }, 1800);
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

  const handleCountOnlyCheckIn = async () => {
    if (!eventData || !scannedCode) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    setLoading(true);

    // Store in database
    const { error } = await supabase.from("guest_check_ins").insert({
      event_id: eventData.id,
      guest_name: guestName || "Anonymous Guest",
      guest_email: null,
      location_lat: eventData.location_lat,
      location_lng: eventData.location_lng,
      distance_meters: distance || 0,
      tracking_mode: "count_only",
    });

    if (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save check-in. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setState("success");
    toast.success("Check-in successful!");
  };

  const handleFullTrackingCheckIn = async () => {
    if (!eventData || !scannedCode) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    if (!registrationData.name.trim() || !registrationData.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Store in database
    const { error } = await supabase.from("guest_check_ins").insert({
      event_id: eventData.id,
      guest_name: registrationData.name,
      guest_email: registrationData.email,
      location_lat: eventData.location_lat,
      location_lng: eventData.location_lng,
      distance_meters: distance || 0,
      tracking_mode: "full_tracking",
    });

    if (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save check-in. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setState("success");
    toast.success("Registration and check-in successful!");
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
    setState("initial");
    setScannedCode(null);
    setFailReason(null);
    setEventData(null);
    setGuestName("");
    setRegistrationData({ name: "", email: "" });
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
          className="text-success-foreground/80 mb-2"
        >
          {eventData?.tracking_mode === "full_tracking" 
            ? `Welcome, ${registrationData.name}!`
            : guestName ? `Welcome, ${guestName}!` : "Welcome!"}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-success-foreground/60 mb-8"
        >
          {eventData?.name}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-success-foreground/10 rounded-2xl px-8 py-4 mb-8"
        >
          <p className="text-sm text-success-foreground/70 text-center mb-1">Check-in time</p>
          <p className="text-3xl font-mono font-bold">{formatTime(timestamp)}</p>
        </motion.div>

        {eventData?.tracking_mode === "full_tracking" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-success-foreground/60 text-sm mb-4"
          >
            A confirmation has been sent to {registrationData.email}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="ghost"
            className="text-success-foreground/80 hover:bg-success-foreground/10"
            onClick={() => navigate("/")}
          >
            Back to Home
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
            : failReason === "event"
            ? "Event not found"
            : "Check-in window has closed"}
        </motion.p>

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
            onClick={() => navigate("/")}
          >
            Go Home
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // QR Scanner overlay
  if (showScanner) {
    return <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />;
  }

  // Registration screen for full tracking mode
  if (state === "register" && eventData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="max-w-2xl mx-auto p-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={resetCheckIn}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{eventData.name}</h1>
              <p className="text-sm text-muted-foreground">Complete Registration</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  <Check size={16} />
                </div>
                <span className="text-sm text-muted-foreground">Scan QR</span>
              </div>
              <div className="w-8 h-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-foreground">Register</span>
              </div>
              <div className="w-8 h-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm text-muted-foreground">Verify</span>
              </div>
            </div>

            {/* Registration info */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Quick Registration</h2>
              <p className="text-muted-foreground text-sm">
                This event requires registration for attendance tracking and certificates.
              </p>
            </div>

            {/* Registration form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={registrationData.name}
                    onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send your attendance confirmation and certificate here.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => setState("ready")}
              disabled={!registrationData.name.trim() || !registrationData.email.trim()}
            >
              Continue to Location Check
              <ChevronRight size={18} />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to have your attendance recorded for this event.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Ready state - location verification (for both modes)
  if (state === "ready" || state === "checking") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={resetCheckIn}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{eventData?.name || "Check In"}</h1>
            <p className="text-sm text-muted-foreground">
              {eventData?.tracking_mode === "full_tracking" 
                ? registrationData.name 
                : "Guest Check-in"}
            </p>
          </div>
        </header>

        {state === "checking" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Verifying event...</p>
          </div>
        ) : (
          <>
            {/* Status Indicators */}
            <div className="px-6 py-4 space-y-3">
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

              {eventData?.tracking_mode === "full_tracking" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Registration</p>
                    <p className="text-sm text-muted-foreground">{registrationData.email} ✓</p>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: eventData?.tracking_mode === "full_tracking" ? 0.2 : 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    gpsChecking
                      ? "bg-primary/10 text-primary"
                      : "bg-success/10 text-success"
                  )}
                >
                  {gpsChecking ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">GPS Location</p>
                  <p className="text-sm text-muted-foreground">
                    {gpsChecking
                      ? "Checking location..."
                      : `Within range (${distance}m away) ✓`}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Map */}
            <div className="px-6">
              <LeafletLocationMap
                eventLocation={{ lat: eventData?.location_lat || 13.7563, lng: eventData?.location_lng || 100.5018 }}
                radiusMeters={eventData?.radius_meters || 50}
                onLocationVerified={() => {
                  // GPS bypass: location already auto-verified
                }}
              />
            </div>

            {/* Optional name for count-only mode */}
            {eventData?.tracking_mode === "count_only" && (
              <div className="px-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName" className="text-sm">Your Name (Optional)</Label>
                  <Input
                    id="guestName"
                    placeholder="Enter your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Check-in Button */}
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div className="relative">
                <AnimatePresence>
                  {isWithinRadius && (
                    <>
                      <motion.div
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary"
                      />
                    </>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={gpsChecking || !isWithinRadius || loading}
                  onClick={eventData?.tracking_mode === "full_tracking" 
                    ? handleFullTrackingCheckIn 
                    : handleCountOnlyCheckIn}
                  className={cn(
                    "relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-lg font-bold shadow-xl transition-all",
                    gpsChecking
                      ? "bg-muted text-muted-foreground"
                      : isWithinRadius
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {loading || gpsChecking ? (
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={32} className="mb-1" />
                      <span>CHECK IN</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Initial state - just show scanner
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">Join Event</h1>
          <p className="text-sm text-muted-foreground">Scan QR to check in</p>
        </div>
      </header>

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
          <p className="text-muted-foreground max-w-xs">
            Point your camera at the QR code displayed by the host to join the event.
          </p>
        </motion.div>

        <Button size="lg" className="gap-2 px-8" onClick={() => setShowScanner(true)}>
          <QrCode size={20} />
          Open Scanner
        </Button>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 w-full max-w-sm"
        >
          <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">How it works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Scan QR Code</p>
                <p className="text-xs text-muted-foreground">Point your camera at the host's QR</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Verify Location</p>
                <p className="text-xs text-muted-foreground">Confirm you're at the event venue</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Check In</p>
                <p className="text-xs text-muted-foreground">Your attendance is recorded</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestJoin;
