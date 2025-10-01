"use client";

import { useState, useEffect } from "react";
import QrCodeScanner from "./qr-code-scanner";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { getStudentAttendance } from "@/lib/firebase/firestore-service";
import type { AttendanceRecord } from "@/lib/types";

const StudentView = () => {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Track last scan
  const [lastScan, setLastScan] = useState<null | {
    message: string;
    sessionId: string;
    stationId: string;
    type: "signIn" | "signOut";
  }>(null);

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
    fetchAttendance();
  }, [currentUser]);

  // ✅ Called when QR scan succeeded
  const onScanSuccess = (data: any) => {
    setLastScan(data);
    toast({ title: "Success", description: data.message });
    fetchAttendance();
  };

  // ❌ Called when QR scan failed
  const onScanError = (msg: string) => {
    toast({
      title: "Scan Failed",
      description: msg,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Attendance Scanner</h2>

      {/* ✅ Show banner when last scan exists */}
      {lastScan && (
        <div className="p-4 rounded-lg bg-green-100 border border-green-400 text-green-800">
          <p className="font-semibold">{lastScan.message}</p>
          <p>
            Station: <span className="font-mono">{lastScan.stationId}</span>{" "}
            <br />
            Action: <span className="capitalize">{lastScan.type}</span>
          </p>
        </div>
      )}

      <QrCodeScanner onScanSuccess={onScanSuccess} onScanError={onScanError} />

      <h3 className="text-lg font-medium">Your Attendance Records</h3>

      {loading ? (
        <p>Loading attendance records...</p>
      ) : attendance.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Session</th>
              <th className="p-2 border">Station</th>
              <th className="p-2 border">Sign-in</th>
              <th className="p-2 border">Sign-out</th>
              <th className="p-2 border">Duration</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((rec) => (
              <tr key={rec.id}>
                <td className="p-2 border">{rec.sessionId}</td>
                <td className="p-2 border">{rec.stationId}</td>
                <td className="p-2 border">
                  {rec.signInTime
                    ? rec.signInTime.toLocaleString()
                    : "—"}
                </td>
                <td className="p-2 border">
                  {rec.signOutTime
                    ? rec.signOutTime.toLocaleString()
                    : "—"}
                </td>
                <td className="p-2 border">
                  {rec.durationMs
                    ? `${Math.round(rec.durationMs / 60000)} min`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentView;
