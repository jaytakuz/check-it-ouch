import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Wifi, Clock, Check, QrCode, Scan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import QRScanner from "@/components/QRScanner";
import LocationMap from "@/components/LocationMap";

type CheckInState = "scanning" | "checking" | "ready" | "success" | "failed";
type FailReason = "location" | "time" | "qr" | null;

// Demo event location (can be replaced with real data later)
const EVENT_LOCATION = { lat: 37.7749, lng: -122.4194 };
const EVENT_RADIUS = 100; // meters

const CheckIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CheckInState>("scanning");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const { latitude, longitude, error: geoError, isLoading: geoLoading } = useGeolocation();

  // Check if coming from QR scan (via URL parameter)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setScannedCode(code);
      setState("checking");
    }
  }, [searchParams]);

  // Location verification
  useEffect(() => {
    if (latitude && longitude && scannedCode) {
      const dist = calculateDistance(
        latitude, longitude,
        EVENT_LOCATION.lat, EVENT_LOCATION.lng
      );
      setDistance(dist);
      const withinRange = dist <= EVENT_RADIUS;
      setIsWithinRadius(withinRange);

      // Auto-transition to ready once we have location
      if (!geoLoading) {
        setState(withinRange ? "ready" : "checking");
      }
    }
  }, [latitude, longitude, scannedCode, geoLoading]);

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
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleQRScan = (data: string) => {
    // Validate QR code format (should start with CHECKIN-)
    if (data.startsWith("CHECKIN-")) {
      setScannedCode(data);
      setShowScanner(false);
      setState("checking");
    } else {
      // Invalid QR code
      setShowScanner(false);
      setState("failed");
      setFailReason("qr");
    }
  };

  const handleCheckIn = () => {
    if (!isWithinRadius) {
      setState("failed");
      setFailReason("location");
      return;
    }

    // TODO: Validate QR code with backend
    // For now, we'll just succeed if within radius
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
          {failReason === "location" ? <MapPin size={48} /> : 
           failReason === "qr" ? <QrCode size={48} /> : <Clock size={48} />}
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
            ? "Invalid QR code scanned"
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
                Required: Within {EVENT_RADIUS}m of venue
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
    return (
      <QRScanner
        onScan={handleQRScan}
        onClose={() => setShowScanner(false)}
      />
    );
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
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Scan Event QR Code
            </h2>
            <p className="text-muted-foreground">
              Point your camera at the QR code displayed by your host
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={() => setShowScanner(true)}
            >
              <QrCode size={20} />
              Open Scanner
            </Button>
          </motion.div>
        </div>

        {/* Location Preview */}
        <div className="p-6 border-t border-border">
          <LocationMap
            eventLocation={EVENT_LOCATION}
            radiusMeters={EVENT_RADIUS}
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
          <h1 className="font-semibold text-foreground">Web Development 101</h1>
          <p className="text-sm text-muted-foreground">Room 301, Tech Building</p>
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
              <p className="text-sm text-muted-foreground">Active until 10:30 AM</p>
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
            disabled={state === "checking" || geoLoading}
            onClick={handleCheckIn}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-lg transition-all",
              state === "checking" || geoLoading
                ? "bg-muted text-muted-foreground"
                : isWithinRadius
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-destructive/80 text-destructive-foreground"
            )}
          >
            {state === "checking" || geoLoading ? (
              <>
                <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-sm font-medium">Verifying...</span>
              </>
            ) : isWithinRadius ? (
              <>
                <Check size={48} className="mb-2" />
                <span className="text-lg font-bold">CHECK IN</span>
              </>
            ) : (
              <>
                <MapPin size={48} className="mb-2" />
                <span className="text-sm font-medium text-center px-4">
                  Move closer to venue
                </span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom hint */}
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {geoLoading
            ? "Verifying your location..."
            : isWithinRadius
            ? "Tap the button above to check in"
            : `You need to be within ${EVENT_RADIUS}m of the venue`}
        </p>
      </div>
    </div>
  );
};

export default CheckIn;
