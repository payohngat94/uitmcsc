
"use client";

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@/contexts/auth-context';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/config';
import { Camera, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QrCodeScannerProps {
  onScanSuccess: () => void;
  onScanError: (errorMessage: string) => void;
}

const functions = getFunctions(app, 'asia-southeast1'); // Replace with your region if different
const scanQr = httpsCallable(functions, 'scanQr');

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
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

    // Cleanup function
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
        if (isScanning) {
            setIsScanning(false);
            if(scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }
            try {
              // Extract token from the full URL
              const url = new URL(decodedText);
              const token = url.searchParams.get('token');
              if (!token) {
                  onScanError("Invalid QR code: No token found.");
                  return;
              }

              await scanQr({ token });
              onScanSuccess();

            } catch (error: any) {
                console.error('Error calling scanQr function:', error);
                const message = error.details?.message || error.message || 'An unknown error occurred.';
                onScanError(message);
            }
        }
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
      // This can be noisy, so we often ignore it.
      // console.warn(`QR Code no longer in view: ${errorMessage}`);
    };

    html5QrcodeScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    ).catch(err => {
        onScanError(`Failed to start scanner: ${err.message}`);
        setIsScanning(false);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
            .then(() => setIsScanning(false))
            .catch(err => console.error("Failed to stop scanner:", err));
    } else {
        setIsScanning(false);
    }
  };


  return (
    <div className="space-y-4">
      <div id={qrcodeRegionId} className="w-full border rounded-lg overflow-hidden [&>video]:w-full [&>img]:hidden"></div>

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
            Please grant camera permissions in your browser settings to use the QR scanner.
          </AlertDescription>
        </Alexia.Ibu, Assalamualaikum,
    </change>
  <change>
    <file>src/app/(authenticated)/attendance/qr-code-display.tsx</file>
    <content><![CDATA[
"use client";

import { useEffect, useState } from 'react';
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
  type: 'signIn' | 'signOut' | null;
}

const QR_EXPIRY_SECONDS = 120;

export default function QRCodeDisplay({ isOpen, onOpenChange, qrCodeUrl, type }: QRCodeDisplayProps) {
  const [countdown, setCountdown] = useState(QR_EXPIRY_SECONDS);

  useEffect(() => {
    if (isOpen && qrCodeUrl && qrCodeUrl !== 'error') {
      setCountdown(QR_EXPIRY_SECONDS);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Optionally auto-close or show expired message
            onOpenChange(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, qrCodeUrl, onOpenChange]);

  const title = type === 'signIn' ? 'Sign-In QR Code' : 'Sign-Out QR Code';
  const description = `Students can scan this code to ${type === 'signIn' ? 'sign in' : 'sign out'}. This code is unique and will expire.`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {qrCodeUrl === null && <Skeleton className="h-64 w-64" />}
          {qrCodeUrl === 'error' && (
            <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not generate QR code. Please ensure your Cloud Functions are deployed and configured correctly, including the JWT secret.
                </AlertDescription>
            </Alert>
          )}
          {qrCodeUrl && qrCodeUrl !== 'error' && (
            <div className="p-4 bg-white rounded-lg">
                <QRCode value={qrCodeUrl} size={256} />
            </div>
          )}
          
          {qrCodeUrl && qrCodeUrl !== 'error' && (
            <div className="text-center">
              <p className="font-semibold">Code expires in:</p>
              <p className="text-2xl font-bold text-destructive">{countdown}s</p>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
