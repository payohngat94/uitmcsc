
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import AdminAttendanceView from "./admin-view";
import StudentAttendanceView from "./student-view";
import { QrCode } from "lucide-react";

export default function AttendancePage() {
  const { currentUser, loading } = useAuth();

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2 flex items-center">
          <QrCode className="mr-3 h-8 w-8 text-primary" /> Attendance Tracking
        </h1>
        <p className="text-muted-foreground">
          {currentUser.role === 'admin'
            ? "Manage skill station sessions and track student attendance."
            : "Scan session QR codes to record your attendance."}
        </p>
      </div>

      {currentUser.role === 'admin' ? (
        <AdminAttendanceView />
      ) : (
        <StudentAttendanceView />
      )}
    </div>
  );
}
