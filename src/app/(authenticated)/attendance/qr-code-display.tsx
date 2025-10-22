
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
            // Defer the state update to avoid the "cannot update during render" error
            setTimeout(() => onOpenChange(false), 0); 
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
