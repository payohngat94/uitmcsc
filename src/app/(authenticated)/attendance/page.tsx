
"use client";

import { useAuth } from "@/contexts/auth-context";
import { QrCode } from "lucide-react";
import AdminAttendanceView from "@/components/attendance/attendance-admin-view";
import StudentAttendanceView from "@/components/attendance/attendance-student-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendancePage() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline mb-2 flex items-center">
                        <QrCode className="mr-3 h-8 w-8 text-primary" /> Attendance Tracking
                    </h1>
                    <p className="text-muted-foreground">
                        {currentUser?.role === 'admin' 
                            ? "Manage station sessions and monitor student attendance."
                            : "Scan QR codes to sign in and out of your sessions."}
                    </p>
                </div>
            </div>

            {currentUser?.role === 'admin' && <AdminAttendanceView />}
            {currentUser?.role === 'student' && <StudentAttendanceView />}
            
        </div>
    );
}
