import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, QrCode, Scan as ScanIcon } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import QRScanner from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Unified scan entry page that handles QR code scanning and routes to the correct check-in flow
 * based on whether the user is logged in or a guest.
 * 
 * QR Format: CHECKIN-{eventId}-{qrSecret}-{timestamp}
 */
const Scan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if coming from a direct QR scan link with code parameter
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleQRCode(code);
    } else {
      setCheckingAuth(false);
    }
  }, [searchParams]);

  const handleQRCode = async (code: string) => {
    setProcessing(true);

    // Validate QR format
    if (!code.startsWith("CHECKIN-")) {
      toast.error("Invalid QR code format");
      setProcessing(false);
      setShowScanner(false);
      return;
    }

    // Parse QR code: CHECKIN-{eventId}-{qrSecret}-{timestamp}
    const parts = code.split("-");
    if (parts.length < 4) {
      toast.error("Invalid QR code");
      setProcessing(false);
      setShowScanner(false);
      return;
    }

    const eventId = parts[1];
    const qrTimestamp = parseInt(parts[3]);

    // Check if QR code is expired (valid for 10 seconds)
    const now = Date.now();
    if (now - qrTimestamp > 10000) {
      toast.error("QR code has expired. Please scan a fresh code.");
      setProcessing(false);
      setShowScanner(false);
      return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // User is logged in - route to authenticated check-in
      navigate(`/checkin?code=${encodeURIComponent(code)}`);
    } else {
      // Guest user - route to guest check-in
      navigate(`/guest-join?code=${encodeURIComponent(code)}`);
    }
  };

  const handleScan = (data: string) => {
    setShowScanner(false);
    handleQRCode(data);
  };

  if (showScanner) {
    return <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  if (checkingAuth || processing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {processing ? "Processing QR code..." : "Loading..."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <ScanIcon size={48} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">Scan to Check In</h1>
        <p className="text-muted-foreground mb-8">
          Scan the QR code displayed by your event host to verify your attendance
        </p>

        {/* Scan Button */}
        <Button size="lg" className="gap-2 px-8 mb-4" onClick={() => setShowScanner(true)}>
          <QrCode size={20} />
          Open Scanner
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          You'll be asked to verify your location after scanning
        </p>

        {/* Back link */}
        <Button
          variant="ghost"
          className="mt-6"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default Scan;
