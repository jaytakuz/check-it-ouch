import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Hash, User, MapPin, QrCode, Check, Clock, Scan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import QRScanner from "@/components/QRScanner";
import MockLocationMap from "@/components/MockLocationMap";
import { cn } from "@/lib/utils";

type GuestState = "join" | "scanning" | "checking" | "ready" | "success" | "failed";
type FailReason = "location" | "time" | "qr" | "event" | null;

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

const GuestJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<GuestState>("join");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    eventCode: "",
  });

  // Mock mode: location verification is handled by MockLocationMap component

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

    setEventData(event);
  };

  const handleFindEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.eventCode.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    // Look up event by a short code (first 6 chars of event ID)
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true);

    if (error) {
      toast.error("Failed to find event");
      setLoading(false);
      return;
    }

    const matchingEvent = events?.find(
      (e) => e.id.substring(0, 6).toUpperCase() === formData.eventCode.toUpperCase()
    );

    if (!matchingEvent) {
      toast.error("Event not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    setEventData(matchingEvent);
    setState("scanning");
    setLoading(false);
    toast.success(`Found event: ${matchingEvent.name}`);
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

  const handleGuestCheckIn = async () => {
    if (!isWithinRadius) {
      setState("failed");
      setFailReason("location");
      return;
    }

    if (!eventData || !scannedCode) {
      setState("failed");
      setFailReason("qr");
      return;
    }

    // For guest check-ins, store locally since they don't have a user account
    const guestCheckIn = {
      eventId: eventData.id,
      eventName: eventData.name,
      guestName: formData.name,
      checkedInAt: new Date().toISOString(),
      locationLat: eventData.location_lat, // Using event location as mock
      locationLng: eventData.location_lng,
      distance: distance || 0,
    };

    // Store in localStorage
    const existingCheckIns = JSON.parse(localStorage.getItem("guestCheckIns") || "[]");
    existingCheckIns.push(guestCheckIn);
    localStorage.setItem("guestCheckIns", JSON.stringify(existingCheckIns));

    setState("success");
    toast.success("Check-in successful!");
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
    setState("join");
    setScannedCode(null);
    setFailReason(null);
    setEventData(null);
    setFormData({ name: "", eventCode: "" });
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
          Welcome, {formData.name}!
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

  // Scanning state - after finding event, scan QR
  if (state === "scanning" || state === "checking" || state === "ready") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 flex items-center gap-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={resetCheckIn}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{eventData?.name || "Check In"}</h1>
            <p className="text-sm text-muted-foreground">Guest: {formData.name}</p>
          </div>
        </header>

        {state === "scanning" ? (
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
                Point your camera at the QR code displayed by the host
              </p>
            </motion.div>

            <Button size="lg" className="gap-2 px-8" onClick={() => setShowScanner(true)}>
              <QrCode size={20} />
              Open Scanner
            </Button>
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

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isWithinRadius
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">GPS Location</p>
                  <p className="text-sm text-muted-foreground">
                    {isWithinRadius
                      ? "Within range ✓"
                      : `Outside range (${distance ? Math.round(distance) : "?"}m away)`}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Map (Mock) */}
            <div className="px-6">
              <MockLocationMap
                eventLocation={{ lat: eventData?.location_lat || 13.7563, lng: eventData?.location_lng || 100.5018 }}
                radiusMeters={eventData?.radius_meters || 50}
                onLocationVerified={(within, dist) => {
                  setIsWithinRadius(within);
                  setDistance(dist);
                }}
              />
            </div>

            {/* Check-in Button */}
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div className="relative">
                <AnimatePresence>
                  {state === "ready" && isWithinRadius && (
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
                  disabled={!isWithinRadius}
                  onClick={handleGuestCheckIn}
                  className={cn(
                    "relative w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg transition-all",
                    isWithinRadius
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Check size={40} className="mb-2" />
                  <span className="text-lg font-semibold">
                    {isWithinRadius ? "Check In" : "Too Far"}
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Initial Join Form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Join as Guest</h1>
            <p className="text-muted-foreground">
              Enter your details and event code to check in
            </p>
          </div>

          <form onSubmit={handleFindEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCode">Event Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="eventCode"
                  type="text"
                  placeholder="e.g., ABC123"
                  className="pl-10 uppercase"
                  value={formData.eventCode}
                  onChange={(e) => setFormData({ ...formData, eventCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ask your host for the 6-character event code
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Finding event..." : "Join Event"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Note:</strong> As a guest, your check-in will be stored locally on this device.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/auth")}>
              Have an account? Sign in instead
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestJoin;
