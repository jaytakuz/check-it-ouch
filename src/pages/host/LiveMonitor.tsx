import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, RefreshCw, Maximize2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

const LiveMonitor = () => {
  const navigate = useNavigate();
  const [qrValue, setQrValue] = useState("CHECKIN-001-" + Date.now());
  const [timeLeft, setTimeLeft] = useState(7);
  const [checkedIn, setCheckedIn] = useState(15);
  const [total] = useState(50);

  // QR refresh effect
  useEffect(() => {
    const qrInterval = setInterval(() => {
      setQrValue("CHECKIN-001-" + Date.now());
      setTimeLeft(7);
    }, 7000);

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7));
    }, 1000);

    // Simulate check-ins
    const checkinInterval = setInterval(() => {
      setCheckedIn((prev) => Math.min(prev + 1, total));
    }, 3000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(countdownInterval);
      clearInterval(checkinInterval);
    };
  }, [total]);

  const progress = (checkedIn / total) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Web Development 101</h1>
            <p className="text-sm text-muted-foreground">Live Monitor</p>
          </div>
        </div>
        <Button variant="outline" size="icon">
          <Maximize2 size={18} />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
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
              fgColor="hsl(225, 20%, 15%)"
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
            Open Check-in app and scan this QR code
          </p>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Users size={24} className="text-success" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{checkedIn}</span>
              <span className="text-muted-foreground">/ {total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Checked in</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-success rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
