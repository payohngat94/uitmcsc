
"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check for camera permissions on mount
    Html5Qrcode.getCameras()
      .then(devices => {
        setHasCameraPermission(devices && devices.length > 0);
      })
      .catch(err => {
        console.error("Camera permission error:", err);
        setHasCameraPermission(false);
      });
  }, []);

  // Effect to instantiate and clean up the scanner instance
  useEffect(() => {
    // Return a cleanup function
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error("Failed to stop html5-qrcode instance on unmount.", error);
        });
      }
    };
  }, []);


  const startScanner = async () => {
    if (!hasCameraPermission || isScanning || isProcessing) return;

    setIsScanning(true);
    setIsProcessing(false);

    // Create a new instance every time we start scanning
    const newScanner = new Html5Qrcode(qrcodeRegionId, { verbose: false });
    scannerRef.current = newScanner;

    const qrCodeSuccessCallback = async (decodedText: string, decodedResult: Html5QrcodeResult) => {
      if (isProcessing || !scannerRef.current?.isScanning) return;

      setIsProcessing(true);

      try {
        // 1. Stop the scanner FIRST and wait for it to complete.
        await newScanner.stop();
        setIsScanning(false);
        console.log("QR Scanner stopped successfully.");
        
        // 2. Now that the DOM is clean, process the token.
        let token: string | null = null;
        try {
            const url = new URL(decodedText);
            token = url.searchParams.get("token");
        } catch {
            token = decodedText;
        }

        if (!token) {
            throw new Error("Invalid QR code: No token found.");
        }

        console.log("📦 Extracted token:", token);
        const res: any = await scanQr({ token });

        console.log("✅ scanQr result:", res.data);
        onScanSuccess(res.data);

      } catch (err: any) {
        console.error("❌ Error during scan processing:", err);
        const msg = err.details?.message || err.message || "An unknown error occurred during processing.";
        onScanError(msg);
      } finally {
        // 3. Reset processing state AFTER all operations are done.
        setIsProcessing(false);
      }
    };
    
    try {
        await newScanner.start(
            { facingMode: "environment" },
            { fps: 5, qrbox: { width: 250, height: 250 }, useBarCodeDetectorIfSupported: true },
            qrCodeSuccessCallback,
            undefined // Optional: QR Code no longer match
        );
    } catch (err: any) {
        onScanError(`Failed to start scanner: ${err.message}`);
        setIsScanning(false);
        setIsProcessing(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setIsProcessing(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
        onScanError("Failed to stop the camera.");
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
