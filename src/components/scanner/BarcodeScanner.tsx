import React, { useState, useCallback, useEffect } from "react";
import { useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, SwitchCamera, FlashlightOff, Flashlight, Loader2, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onResult: (isbn: string) => void;
  onClose: () => void;
  isSearching?: boolean;
}

const SCAN_TIMEOUT_SECONDS = 15;

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onResult, 
  onClose,
  isSearching = false
}) => {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanAttemptTime, setScanAttemptTime] = useState<number>(0);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  const { ref, torch } = useZxing({
    onResult(result) {
      const text = result.getText();
      // ISBN-10 has 10 digits, ISBN-13 has 13 digits
      // Also accept EAN-13 which is the barcode format for books
      const cleaned = text.replace(/[-\s]/g, "");
      
      if ((cleaned.length === 10 || cleaned.length === 13) && /^\d+[X\d]?$/.test(cleaned)) {
        // Avoid duplicate scans
        if (cleaned !== lastScanned) {
          setLastScanned(cleaned);
          setShowTimeoutMessage(false);
          onResult(cleaned);
        }
      }
    },
    constraints: {
      video: {
        facingMode,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        aspectRatio: { ideal: 16/9 },
        // Request autofocus if available
        ...(typeof navigator !== 'undefined' && 'mediaDevices' in navigator ? {
          advanced: [
            { focusMode: "continuous" } as any,
            { focusDistance: 0 } as any, // Macro focus
          ]
        } : {})
      },
    },
    timeBetweenDecodingAttempts: 200, // Faster scanning attempts
  });

  // Reset timeout when scanner opens or camera changes
  useEffect(() => {
    setScanAttemptTime(Date.now());
    setShowTimeoutMessage(false);
  }, [facingMode]);

  // Show timeout message after X seconds of no detection
  useEffect(() => {
    if (isSearching || lastScanned) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - scanAttemptTime) / 1000;
      if (elapsed >= SCAN_TIMEOUT_SECONDS && !showTimeoutMessage) {
        setShowTimeoutMessage(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scanAttemptTime, isSearching, lastScanned, showTimeoutMessage]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setLastScanned(null);
    setShowTimeoutMessage(false);
  }, []);

  const resetScan = useCallback(() => {
    setScanAttemptTime(Date.now());
    setShowTimeoutMessage(false);
    setLastScanned(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video feed */}
      <video 
        ref={ref} 
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      
      {/* Overlay with scanning guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dark overlay outside scanning area */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Scanning frame - clear area */}
        <div className="relative w-80 h-48 z-10">
          {/* Clear window */}
          <div className="absolute inset-0 bg-transparent border-2 border-white/80 rounded-xl shadow-2xl" 
               style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
          
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
          
          {/* Scanning line animation */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          </div>

          {/* Barcode icon hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg className="w-32 h-16" viewBox="0 0 100 50" fill="currentColor">
              <rect x="5" y="5" width="3" height="40" className="text-white" />
              <rect x="12" y="5" width="2" height="40" className="text-white" />
              <rect x="18" y="5" width="4" height="40" className="text-white" />
              <rect x="26" y="5" width="2" height="40" className="text-white" />
              <rect x="32" y="5" width="3" height="40" className="text-white" />
              <rect x="40" y="5" width="2" height="40" className="text-white" />
              <rect x="46" y="5" width="4" height="40" className="text-white" />
              <rect x="54" y="5" width="2" height="40" className="text-white" />
              <rect x="60" y="5" width="3" height="40" className="text-white" />
              <rect x="68" y="5" width="2" height="40" className="text-white" />
              <rect x="74" y="5" width="4" height="40" className="text-white" />
              <rect x="82" y="5" width="2" height="40" className="text-white" />
              <rect x="88" y="5" width="3" height="40" className="text-white" />
              <rect x="95" y="5" width="2" height="40" className="text-white" />
            </svg>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <Card className="p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Buscando libro...</p>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-safe left-0 right-0 pt-20 px-4 text-center z-10">
        <p className="text-white text-lg font-semibold drop-shadow-lg">
          Coloca el código de barras dentro del marco
        </p>
        <p className="text-white/80 text-sm mt-2 drop-shadow">
          El ISBN está en la contraportada del libro
        </p>
      </div>

      {/* Timeout message */}
      {showTimeoutMessage && !isSearching && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-20 z-20 px-4 w-full max-w-sm">
          <Card className="p-4 border-amber-500/50 bg-amber-500/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">
                  No se ha podido leer el ISBN
                </p>
                <p className="text-xs text-white/70 mb-3">
                  Acerca más la cámara al código de barras o mejora la iluminación
                </p>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={resetScan}
                  className="w-full"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-safe left-0 right-0 pb-8 px-4 z-10">
        <div className="flex items-center justify-center gap-4">
          {/* Torch toggle */}
          {torch.isAvailable && (
            <Button
              size="icon"
              variant="secondary"
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-white/30"
              onClick={() => torch.isOn ? torch.off() : torch.on()}
            >
              {torch.isOn ? (
                <Flashlight className="w-6 h-6 text-yellow-300" />
              ) : (
                <FlashlightOff className="w-6 h-6 text-white" />
              )}
            </Button>
          )}
          
          {/* Close button */}
          <Button
            size="icon"
            variant="destructive"
            className="w-16 h-16 rounded-full"
            onClick={onClose}
          >
            <X className="w-8 h-8" />
          </Button>
          
          {/* Switch camera */}
          <Button
            size="icon"
            variant="secondary"
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-white/30"
            onClick={toggleCamera}
          >
            <SwitchCamera className="w-6 h-6 text-white" />
          </Button>
        </div>

        {lastScanned && (
          <p className="text-center text-white/80 text-sm mt-4">
            Último escaneado: {lastScanned}
          </p>
        )}
      </div>
    </div>
  );
};
