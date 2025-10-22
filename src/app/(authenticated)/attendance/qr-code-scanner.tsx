
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, type Html5QrcodeCameraScanConfig, type Html5QrcodeResult, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertTriangle, ScanLine } from "lucide-react";

const qrcodeRegionId = "html5qr-code-full-region";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => Promise<void>;
  onScanError: (errorMessage: string) => void;
}

export default function QrCodeScanner({ onScanSuccess, onScanError }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Scanner Control Functions ---
  const startScanner = async () => {
    if (isScanning || isProcessing) return;

    setError(null);
    setIsProcessing(true); // Show loader while initializing

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found on this device.");
      }
    } catch (err: any) {
      const camErr = "Camera permission is required. Please allow camera access in your browser settings and refresh the page.";
      setError(camErr);
      onScanError(camErr);
      setIsProcessing(false);
      return;
    }

    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrcodeRegionId, {
            verbose: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
    }
    const html5Qrcode = scannerRef.current;

    const config: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.8);
        return { width: qrboxSize, height: qrboxSize };
      },
      aspectRatio: 1.0,
    };

    const qrCodeSuccessCallback = async (decodedText: string, result: Html5QrcodeResult) => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      setIsScanning(false);

      if (html5Qrcode.isScanning) {
          try {
              await html5Qrcode.stop();
          } catch(err) {
              console.warn("QR Scanner: stop() failed, but continuing.", err);
          }
      }
      
      try {
        await onScanSuccess(decodedText);
      } catch (err: any) {
        onScanError(err.message || "Failed to process QR code.");
      } finally {
        setIsProcessing(false);
      }
    };
    
    try {
        await html5Qrcode.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            (errorMessage) => { /* ignore errors */ }
        );
        setIsScanning(true);
    } catch (err: any) {
        setError(`Failed to start scanner: ${err.message}`);
        onScanError(`Failed to start scanner: ${err.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current || !isScanning) return;
    setIsProcessing(true);
    try {
      await scannerRef.current.stop();
    } catch (err) {
      console.warn("QR Scanner: stop() threw an error during manual stop.", err);
    } finally {
      setIsScanning(false);
      setIsProcessing(false);
    }
  };

  // --- Cleanup Effect ---
  useEffect(() => {
    const scannerInstance = scannerRef.current;
    return () => {
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().catch(err => {
          // This error is informational, as the component is unmounting.
          console.log("QR Scanner: Cleanup stop() failed on unmount, likely already stopped.", err);
        });
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div 
        id={qrcodeRegionId}
        className="w-full border-2 border-dashed rounded-lg bg-muted min-h-[300px] flex items-center justify-center text-muted-foreground overflow-hidden"
        style={{ display: isScanning || isProcessing ? "block" : "none" }}
      />
      
      {!isScanning && !isProcessing && (
         <div className="w-full border-2 border-dashed rounded-lg bg-muted min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <ScanLine className="h-16 w-16 mb-4"/>
            <h3 className="font-semibold text-lg">QR Code Scanner</h3>
            <p className="text-sm">Press the button below to start your camera.</p>
         </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isScanning ? (
        <Button onClick={startScanner} className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
          ) : (
            <><Camera className="mr-2 h-4 w-4" /> Start Scanner</>
          )}
        </Button>
      ) : (
        <Button onClick={stopScanner} variant="outline" className="w-full" disabled={isProcessing}>
          Stop Scanner
        </Button>
      )}
    </div>
  );
}
