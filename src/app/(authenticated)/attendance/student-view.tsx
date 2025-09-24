
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { getStudentAttendance } from "@/lib/firebase/firestore-service";
import type { AttendanceRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Clock, UserCheck, CheckCircle } from "lucide-react";
import QrCodeScanner from "./qr-code-scanner";

export default function StudentAttendanceView() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const records = await getStudentAttendance(currentUser.uid);
      setAttendance(records);
      const total = records.reduce((sum, record) => sum + (record.durationMs || 0), 0);
      setTotalTime(total);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch attendance records." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser, toast]);

  const onScanSuccess = () => {
    toast({ title: "Success", description: "Your attendance has been recorded." });
    fetchAttendance(); // Re-fetch data to show the latest status
  };

  const onScanError = (errorMessage: string) => {
    toast({ variant: "destructive", title: "Scan Error", description: errorMessage });
  };
  
  const totalHours = (totalTime / (1000 * 60 * 60)).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left side: QR Scanner */}
      <div className="md:col-span-1">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Use your camera to scan the session QR code for sign-in or sign-out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrCodeScanner
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right side: Attendance History */}
      <div className="md:col-span-2 space-y-6">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Practice Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                ) : (
                    <div className="text-2xl font-bold">{totalHours} hours</div>
                )}
                <p className="text-xs text-muted-foreground">Total time spent across all sessions.</p>
            </CardContent>
         </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Attendance History</CardTitle>
            <CardDescription>A log of your recorded practice sessions.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : attendance.length > 0 ? (
                  attendance.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.stationId}</TableCell> {/* Should be stationName */}
                      <TableCell>{record.signInTime ? formatDistanceToNow(record.signInTime, { addSuffix: true }) : "N/A"}</TableCell>
                      <TableCell>{record.signOutTime ? formatDistanceToNow(record.signOutTime, { addSuffix: true }) : "N/A"}</TableCell>
                      <TableCell className="text-right">{record.durationMs != null ? `${(record.durationMs / 60000).toFixed(1)} mins` : "--"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <UserCheck className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No attendance records found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
