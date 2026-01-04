import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X, SwitchCamera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    try {
      setError(null);
      setIsScanning(true);
      
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // Ignore scan errors (no QR found in frame)
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Could not access camera. Please ensure camera permissions are granted.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [facingMode]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-background/80 backdrop-blur-lg border-b border-border">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X size={24} />
        </Button>
        <h1 className="font-semibold text-foreground">Scan QR Code</h1>
        <Button variant="ghost" size="icon" onClick={switchCamera}>
          <SwitchCamera size={20} />
        </Button>
      </header>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/50">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-background shadow-lg">
          {/* QR Reader Container */}
          <div 
            id="qr-reader" 
            ref={containerRef}
            className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"
          />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />

              {/* Scanning line animation */}
              <motion.div
                initial={{ top: "10%" }}
                animate={{ top: "90%" }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "linear"
                }}
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
          )}

          {/* Loading state */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center max-w-sm"
            >
              <Camera className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={startScanner}
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-background border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Point your camera at the QR code displayed on the host's screen
        </p>
      </div>
    </motion.div>
  );
};

export default QRScanner;
