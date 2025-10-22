"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode, type Html5QrcodeScannerState } from "html5-qrcode";
import { useAuth } from "@/contexts/auth-context";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { Camera, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface QrCodeScannerProps {
  onScanSuccess: (data: any) => void;
  onScanError: (errorMessage: string) => void;
}

const functions = getFunctions(app, "asia-southeast1");
const scanQr = httpsCallable(functions, "scanQr");

const qrcodeRegionId = "qr-code-reader";

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({
  onScanSuccess,
  onScanError,
}) => {
  const { currentUser } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect to initialize and clean up the scanner instance
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode instance.", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanner = async () => {
    if (!hasCameraPermission || !currentUser || isScanning || isProcessing) return;

    // Ensure there's a scanner instance
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrcodeRegionId);
    }
    const scanner = scannerRef.current;

    setIsScanning(true);

    const qrCodeSuccessCallback = async (decodedText: string) => {
      if (isProcessing || !isScanning) return;
      
      console.log("🔎 QR scanned:", decodedText);
      setIsProcessing(true);

      // Stop scanning before processing
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        try {
          await scanner.stop();
        } catch (e) {
          console.error("Error stopping scanner on success:", e);
        }
      }
      setIsScanning(false);

      try {
        let token: string | null = null;
        try {
          const url = new URL(decodedText);
          token = url.searchParams.get("token");
        } catch {
          token = decodedText;
        }

        if (!token) {
          onScanError("Invalid QR code: No token found.");
          setIsProcessing(false);
          return;
        }

        console.log("📦 Extracted token:", token);
        const res: any = await scanQr({ token });

        console.log("✅ scanQr result:", res.data);
        onScanSuccess(res.data);
      } catch (err: any) {
        console.error("❌ Error calling scanQr function:", err);
        const msg = err.details?.message || err.message || "An unknown error occurred during processing.";
        onScanError(msg);
      } finally {
        setIsProcessing(false);
      }
    };
    
    try {
        await scanner.start(
            { facingMode: "environment" },
            { fps: 5, qrbox: { width: 250, height: 250 }, useBarCodeDetectorIfSupported: true },
            qrCodeSuccessCallback,
            () => {} // QR Code no longer match
        );
    } catch (err: any) {
        onScanError(`Failed to start scanner: ${err.message}`);
        setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    } else {
        setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        id={qrcodeRegionId}
        className="w-full border rounded-lg overflow-hidden bg-muted min-h-[250px] flex items-center justify-center [&>video]:w-full [&>img]:hidden"
      >
        {!isScanning && !isProcessing && (
            <div className="text-muted-foreground p-4 text-center">
                <Camera className="mx-auto h-12 w-12 mb-2" />
                <p>Scanner is ready. Click the button below to start.</p>
            </div>
        )}
      </div>

      {!isScanning && hasCameraPermission && (
        <Button onClick={startScanner} className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><Camera className="mr-2 h-4 w-4" /> Start Scanner</>
          )}
        </Button>
      )}

      {isScanning && (
        <Button onClick={stopScanner} variant="outline" className="w-full" disabled={isProcessing}>
          Stop Scanner
        </Button>
      )}

      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera Access Denied</AlertTitle>
          <AlertDescription>
            Please grant camera permissions in your browser settings to use the
            QR scanner.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default QrCodeScanner;
