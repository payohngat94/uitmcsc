"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/contexts/auth-context";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { Camera, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface QrCodeScannerProps {
  onScanSuccess: (message: string) => void;
  onScanError: (errorMessage: string) => void;
}

const functions = getFunctions(app, "asia-southeast1");
const scanQr = httpsCallable(functions, "scanQr");

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

  const qrcodeRegionId = "qr-code-reader";

  useEffect(() => {
    const getCameraPermissionAndStart = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setHasCameraPermission(false);
      }
    };
    getCameraPermissionAndStart();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    if (!hasCameraPermission || !currentUser) return;

    setIsScanning(true);
    const html5QrcodeScanner = new Html5Qrcode(qrcodeRegionId);
    scannerRef.current = html5QrcodeScanner;

    const qrCodeSuccessCallback = async (decodedText: string) => {
      console.log("🔎 QR scanned:", decodedText);

      if (isScanning) {
        setIsScanning(false);
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        try {
          let token: string | null = null;

          // Case 1: full URL with ?token=
          try {
            const url = new URL(decodedText);
            token = url.searchParams.get("token");
          } catch {
            // Case 2: plain token string
            token = decodedText;
          }

          if (!token) {
            onScanError("Invalid QR code: No token found.");
            return;
          }

          console.log("📦 Extracted token:", token);

          // 🔹 Call Firebase Function
          const res: any = await scanQr({ token });

          console.log("✅ scanQr result:", res.data);
          onScanSuccess(
            res.data?.message || "Attendance recorded successfully"
          );
        } catch (err: any) {
          console.error("❌ Error calling scanQr function:", err);
          const msg =
            err.details?.message ||
            err.message ||
            "An unknown error occurred.";
          onScanError(msg);
        }
      }
    };

    html5QrcodeScanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrCodeSuccessCallback,
        () => {}
      )
      .catch((err) => {
        onScanError(`Failed to start scanner: ${err.message}`);
        setIsScanning(false);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => setIsScanning(false))
        .catch((err) => console.error("Failed to stop scanner:", err));
    } else {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        id={qrcodeRegionId}
        className="w-full border rounded-lg overflow-hidden [&>video]:w-full [&>img]:hidden"
      ></div>

      {!isScanning && hasCameraPermission && (
        <Button onClick={startScanner} className="w-full">
          <Camera className="mr-2 h-4 w-4" /> Start Scanner
        </Button>
      )}

      {isScanning && (
        <Button onClick={stopScanner} variant="outline" className="w-full">
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
