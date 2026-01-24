import React, { useState, useCallback } from "react";
import { useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, SwitchCamera, FlashlightOff, Flashlight, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onResult: (isbn: string) => void;
  onClose: () => void;
  isSearching?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onResult, 
  onClose,
  isSearching = false
}) => {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

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
          onResult(cleaned);
        }
      }
    },
    constraints: {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    timeBetweenDecodingAttempts: 300,
  });

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video feed */}
      <video 
        ref={ref} 
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      
      {/* Overlay with scanning guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Scanning frame */}
        <div className="relative w-72 h-44 border-2 border-white/70 rounded-xl">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
          
          {/* Scanning line animation */}
          <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary/80 animate-pulse" />
        </div>
      </div>

      {/* Loading overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Card className="p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Buscando libro...</p>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-safe left-0 right-0 pt-20 px-4 text-center">
        <p className="text-white text-lg font-medium drop-shadow-lg">
          Enfoca el código de barras del libro
        </p>
        <p className="text-white/70 text-sm mt-1 drop-shadow">
          El ISBN aparece normalmente en la contraportada
        </p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-safe left-0 right-0 pb-8 px-4">
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
