
"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CameraOff, XCircle } from "lucide-react";
import { Button } from '../ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';

const QR_BOX_SIZE = 300;

interface QrCodeScannerProps {
    onScannerClose: () => void;
}

export default function QrCodeScanner({ onScannerClose }: QrCodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const { toast } = useToast();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        scannerRef.current = new Html5Qrcode("qr-reader");

        const startScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length) {
                    setIsScanning(true);
                    scannerRef.current?.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: QR_BOX_SIZE, height: QR_BOX_SIZE },
                            aspectRatio: 1.0,
                        },
                        (decodedText) => {
                            setScanResult(decodedText);
                            stopScanner();
                        },
                        (errorMessage) => {
                           // Ignore "QR code not found" messages
                           if(!errorMessage.toLowerCase().includes("qr code not found")) {
                             console.warn(`QR Scanner warning: ${errorMessage}`);
                           }
                        }
                    ).catch(err => {
                        console.error("Scanner start error:", err);
                        setError("Failed to start the camera. Please ensure permissions are granted and try again.");
                        setIsScanning(false);
                    });
                } else {
                    setError("No cameras found on this device.");
                }
            } catch (err) {
                 console.error("Camera permission error:", err);
                 setError("Camera access is required to scan QR codes. Please grant permission in your browser settings.");
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, []);
    
    useEffect(() => {
        if(scanResult) {
            handleTokenVerification(scanResult);
        }
    }, [scanResult])

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
            }).catch(err => {
                console.error("Error stopping scanner:", err);
            });
        }
    };
    
    const handleTokenVerification = async (scannedUrl: string) => {
        try {
            const url = new URL(scannedUrl);
            const token = url.searchParams.get('token');

            if (!token) {
                throw new Error("Invalid QR code: No token found.");
            }
            
            toast({ title: 'Processing...', description: 'Verifying QR code...' });

            const functions = getFunctions();
            const scanQrFunction = httpsCallable(functions, 'scanQr');
            const result: any = await scanQrFunction({ token });
            
            toast({
                title: result.data.success ? 'Success!' : 'Error',
                description: result.data.message,
                variant: result.data.success ? 'default' : 'destructive',
            });
            onScannerClose();

        } catch (err) {
            console.error("Token verification failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during verification.";
            toast({
                variant: 'destructive',
                title: 'Scan Failed',
                description: errorMessage
            });
            onScannerClose();
        }
    }


    return (
        <div className="w-full max-w-lg mx-auto p-4 border rounded-lg shadow-lg bg-card">
            <div id="qr-reader" className="w-full"></div>
            
             {!isScanning && !error && (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                    <CameraOff className="h-12 w-12 mb-4" />
                    <p>Initializing camera...</p>
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Scanner Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={onScannerClose}><XCircle className="mr-2 h-4 w-4" /> Close Scanner</Button>
            </div>
        </div>
    );
}
