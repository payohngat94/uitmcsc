
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import QrCodeScanner from './qr-code-scanner';

export default function StudentAttendanceView() {
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    if (isScannerOpen) {
        return <QrCodeScanner onScannerClose={() => setIsScannerOpen(false)} />;
    }

    return (
        <Card className="text-center shadow-lg">
            <CardHeader>
                <CardTitle>Ready to Scan?</CardTitle>
                <CardDescription>Click the button below to open the camera and scan the session QR code.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" onClick={() => setIsScannerOpen(true)}>
                    <ScanLine className="mr-2 h-6 w-6" />
                    Scan QR Code
                </Button>
            </CardContent>
        </Card>
    );
}
