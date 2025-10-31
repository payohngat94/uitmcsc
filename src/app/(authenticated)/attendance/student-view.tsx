
"use client";

import { useState, useEffect } from "react";
import QrCodeScanner from "./qr-code-scanner";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { getStudentAttendance } from "@/lib/firebase/firestore-service";
import type { AttendanceRecord } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, List, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";


const functions = getFunctions(app, "asia-southeast1");
const scanQrCallable = httpsCallable(functions, "scanQr");


const StudentView = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Track last scan result
  const [lastScanResult, setLastScanResult] = useState<{
    message: string;
    sessionId: string;
    stationId: string;
    stationName: string;
    type: "signIn" | "signOut";
  } | null>(null);

  const fetchAttendance = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const records = await getStudentAttendance(currentUser.uid);
      setAttendance(records);
    } catch (error: any) {
      console.error("Error fetching student attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Called when QR scan succeeded
  const handleScanSuccess = async (decodedText: string) => {
    let token: string | null = null;
    try {
        // Handle both raw tokens and URLs with tokens
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
        const data = res.data;

        setLastScanResult(data); 
        toast({ title: "Success", description: data.message });
        await fetchAttendance(); // Refresh the attendance list

    } catch (err: any) {
        const msg = err.details?.message || err.message || "An unknown error occurred during processing.";
        handleScanError(msg);
        throw err; // Re-throw to inform the scanner
    }
  };

  // Called when QR scan failed
  const handleScanError = (msg: string) => {
    toast({
      title: "Scan Failed",
      description: msg,
      variant: "destructive",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ScanLine className="mr-2 h-6 w-6"/> Attendance Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <QrCodeScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
          </CardContent>
        </Card>

        {lastScanResult && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-green-800">
                <CheckCircle className="mr-2 h-5 w-5"/>
                Last Scan Result
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 space-y-2">
              <p className="font-semibold">{lastScanResult.message}</p>
              <p>
                <strong>Station:</strong> <span className="font-mono bg-green-100 px-1 py-0.5 rounded">{lastScanResult.stationName}</span>
              </p>
              <p>
                <strong>Action:</strong> <span className="capitalize">{lastScanResult.type}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><List className="mr-2 h-6 w-6"/>Your Attendance History</CardTitle>
            <CardDescription>A log of all your recorded sign-ins and sign-outs.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : attendance.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No attendance records found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Sign In</TableHead>
                    <TableHead>Sign Out</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="font-medium">{rec.stationName || rec.stationId}</div>
                        <div className="text-xs text-muted-foreground font-mono">{rec.sessionId}</div>
                      </TableCell>
                      <TableCell>
                        {rec.signInTime
                          ? format(rec.signInTime, "PPp")
                          : "—"}
                      </TableCell>
                       <TableCell>
                        {rec.signOutTime
                          ? format(rec.signOutTime, "p")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {rec.durationMs != null
                          ? `${Math.round(rec.durationMs / 60000)} min`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentView;
