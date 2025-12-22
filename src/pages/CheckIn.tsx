import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Wifi, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type CheckInState = "checking" | "ready" | "success" | "failed";
type FailReason = "location" | "time" | null;

const CheckIn = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<CheckInState>("checking");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [timestamp, setTimestamp] = useState(new Date());

  // Simulate location check
  useEffect(() => {
    const timer = setTimeout(() => {
      setState("ready");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Update timestamp for success screen
  useEffect(() => {
    if (state === "success") {
      const interval = setInterval(() => {
        setTimestamp(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleCheckIn = () => {
    // Simulate check-in (80% success rate for demo)
    if (Math.random() > 0.2) {
      setState("success");
    } else {
      setState("failed");
      setFailReason(Math.random() > 0.5 ? "location" : "time");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
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
            onClick={() => navigate(-1)}
          >
            Go Back
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
          {failReason === "location" ? <MapPin size={48} /> : <Clock size={48} />}
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
                Required: Within 50m of venue
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
            onClick={() => setState("checking")}
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

  // Main Check-in Screen
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                state === "checking"
                  ? "bg-muted text-muted-foreground"
                  : "bg-success/10 text-success"
              )}
            >
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">GPS Location</p>
              <p className="text-sm text-muted-foreground">
                {state === "checking" ? "Checking..." : "Within range ✓"}
              </p>
            </div>
            {state === "checking" && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </motion.div>

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
            {state === "ready" && (
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
            disabled={state === "checking"}
            onClick={handleCheckIn}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-lg transition-all",
              state === "checking"
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {state === "checking" ? (
              <>
                <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-sm font-medium">Verifying...</span>
              </>
            ) : (
              <>
                <Check size={48} className="mb-2" />
                <span className="text-lg font-bold">CHECK IN</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom hint */}
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {state === "checking"
            ? "Verifying your location..."
            : "Tap the button above to check in"}
        </p>
      </div>
    </div>
  );
};

export default CheckIn;
