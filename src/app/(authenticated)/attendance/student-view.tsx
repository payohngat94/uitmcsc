

"use client";

import { useState, useEffect } from "react";
import QrCodeScanner from "./qr-code-scanner";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { getStudentAttendance, getRotationForSession } from "@/lib/firebase/firestore-service";
import type { AttendanceRecord, Rotation } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, List, ScanLine, Circle, Check } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";


const functions = getFunctions(app, "asia-southeast1");
const scanQrCallable = httpsCallable(functions, "scanQr");


// --- New Dialog Component ---
interface StationChecklistDialogProps {
  isOpen: boolean;
  rotation: Rotation | null;
  onConfirm: (practicedStations: string[]) => void;
  onCancel: () => void;
}

function StationChecklistDialog({ isOpen, rotation, onConfirm, onCancel }: StationChecklistDialogProps) {
  const [selectedStations, setSelectedStations] = useState<string[]>([]);

  useEffect(() => {
    // Reset selection when dialog is opened
    if (isOpen) {
      setSelectedStations([]);
    }
  }, [isOpen]);
  
  if (!rotation) return null;

  const handleToggleStation = (stationName: string, isChecked: boolean) => {
    setSelectedStations(prev =>
      isChecked ? [...prev, stationName] : prev.filter(name => name !== stationName)
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedStations);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Practiced Stations Checklist</DialogTitle>
          <DialogDescription>
            Please select the stations you practiced in the "{rotation.name}" rotation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label>Stations:</Label>
          {rotation.stationNames.map(stationName => (
            <div key={stationName} className="flex items-center space-x-2">
              <Checkbox
                id={stationName}
                checked={selectedStations.includes(stationName)}
                onCheckedChange={(checked) => handleToggleStation(stationName, !!checked)}
              />
              <label htmlFor={stationName} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {stationName}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Sign-Out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// --- Main Student View ---
const StudentView = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the new sign-out flow
  const [showChecklist, setShowChecklist] = useState(false);
  const [signOutData, setSignOutData] = useState<{ token: string; rotation: Rotation } | null>(null);

  const [lastScanResult, setLastScanResult] = useState<{
    message: string;
    sessionId: string;
    stationName: string;
    type: "signIn" | "signOut";
    practicedStations?: string[];
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

  const handleScanSuccess = async (decodedText: string) => {
    let token: string | null = null;
    try {
        const url = new URL(decodedText);
        token = url.searchParams.get("token");
    } catch {
        token = decodedText;
    }

    if (!token) throw new Error("Invalid QR code format. No token found.");
    
    // Decode token to check type without verifying signature
    const payload = JSON.parse(atob(token.split('.')[1]));

    if (payload.type === 'signIn') {
        const res: any = await scanQrCallable({ token });
        setLastScanResult(res.data); 
        toast({ title: "Success", description: res.data.message });
        await fetchAttendance();
    } else if (payload.type === 'signOut') {
        // Fetch rotation details for the checklist
        const rotation = await getRotationForSession(payload.sessionId);
        if (!rotation) {
             toast({ variant: "destructive", title: "Error", description: "Could not find session details." });
             return;
        }
        setSignOutData({ token, rotation });
        setShowChecklist(true);
    }
  };

  const handleConfirmSignOut = async (practicedStations: string[]) => {
    if (!signOutData) return;
    try {
      const res: any = await scanQrCallable({
        token: signOutData.token,
        practicedStations: practicedStations
      });

      setLastScanResult({ ...res.data, practicedStations });
      toast({ title: "Success", description: res.data.message });
      await fetchAttendance();
    } catch (err: any) {
       const msg = err.details?.message || err.message || "An unknown error occurred during sign-out.";
       handleScanError(msg);
       throw err;
    } finally {
      setShowChecklist(false);
      setSignOutData(null);
    }
  };

  const handleCancelSignOut = () => {
    setShowChecklist(false);
    setSignOutData(null);
    toast({ variant: "default", title: "Sign-Out Canceled" });
  };

  const handleScanError = (msg: string) => {
    toast({
      title: "Scan Failed",
      description: msg,
      variant: "destructive",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <StationChecklistDialog
        isOpen={showChecklist}
        rotation={signOutData?.rotation ?? null}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />

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
              {lastScanResult.type === 'signOut' && lastScanResult.practicedStations && lastScanResult.practicedStations.length > 0 && (
                  <div>
                      <strong>Practiced:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                          {lastScanResult.practicedStations.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                  </div>
              )}
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
                    <TableHead>Rotation</TableHead>
                    <TableHead>Sign In</TableHead>
                    <TableHead>Sign Out</TableHead>
                    <TableHead>Practiced Stations</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="font-medium">{rec.stationName}</div>
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
                      <TableCell>
                        {rec.practicedStations && rec.practicedStations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {rec.practicedStations.map(ps => <Badge key={ps} variant="outline">{ps}</Badge>)}
                            </div>
                        ) : rec.signOutTime ? "None" : "—"}
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
