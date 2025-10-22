
"use client";

import React, { useEffect, useRef, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const functions = getFunctions(app, "asia-southeast1");
const scanQrCallable = httpsCallable(functions, "scanQr");

const qrcodeRegionId = "qr-code-reader";

interface QrScannerProps {
  onScanSuccess: (data: any) => void;
  onScanError: (errorMessage: string) => void;
}

export default function QrCodeScanner({ onScanSuccess, onScanError }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startScanner = async () => {
    setError(null);
    setIsProcessing(false);
    
    // Ensure we don't start multiple instances
    if (scannerRef.current && scannerRef.current.isScanning) {
      console.log("Scanner is already running.");
      return;
    }

    try {
      const hasPermission = await Html5Qrcode.getCameras().then(devices => devices && devices.length > 0);
      if (!hasPermission) {
        throw new Error("Camera permission is not available. Please allow camera access in your browser settings.");
      }
    } catch (err: any) {
       setError(err.message || "Could not get camera permissions.");
       return;
    }


    const newScanner = new Html5Qrcode(qrcodeRegionId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    scannerRef.current = newScanner;

    const qrCodeSuccessCallback = async (decodedText: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            if (newScanner.isScanning) {
              await newScanner.stop();
            }
            
            let token: string | null = null;
            try {
                const url = new URL(decodedText);
                token = url.searchParams.get("token");
            } catch {
                token = decodedText;
            }

            if (!token) {
                throw new Error("Invalid QR code format. No token found.");
            }

            const res: any = await scanQrCallable({ token });
            onScanSuccess(res.data);

        } catch (err: any) {
            const msg = err.details?.message || err.message || "An unknown error occurred during processing.";
            onScanError(msg);
        } finally {
            setIsScanning(false);
            setIsProcessing(false);
        }
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
        // This callback is called frequently, so we typically ignore it
        // unless we want to display continuous feedback.
    };

    try {
      setIsScanning(true);
      await newScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
    } catch (err: any) {
      setError(`Failed to start scanner: ${err.message}. Please refresh and try again.`);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            await scannerRef.current.stop();
        } catch (err) {
            console.error("Failed to stop scanner cleanly:", err);
        }
    }
    setIsScanning(false);
    setIsProcessing(false);
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
        if (scannerRef.current) {
            // Use .catch() as stop() can throw an error if the scanner is already stopped
            scannerRef.current.stop().catch(err => {
                // We can ignore this error as it's likely due to the scanner already being stopped.
            });
        }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id={qrcodeRegionId}
        className="w-full border rounded-lg overflow-hidden bg-muted min-h-[300px] flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>img]:hidden"
      >
        {!isScanning && (
            <div className="text-muted-foreground p-4 text-center">
                <Camera className="mx-auto h-12 w-12 mb-2" />
                <p>Scanner is ready. Press the button to begin.</p>
            </div>
        )}
      </div>

       {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {!isScanning ? (
        <Button onClick={startScanner} className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
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
