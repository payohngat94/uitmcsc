
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/config";
import { getStations, addStation, getSessionsWithAttendance, addSession, updateSession, deleteSession } from "@/lib/firebase/firestore-service";
import type { Station, Session, AttendanceRecord } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarIcon, Clock, PlusCircle, User, Users, QrCode as QrCodeIcon, AlertCircle, Download, MoreVertical, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import QRCodeDisplay from "./qr-code-display";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


// --- Form Schemas ---
const stationSchema = z.object({
  name: z.string().min(3, "Station name is required."),
  location: z.string().min(3, "Location is required."),
});

const sessionSchema = z.object({
  stationId: z.string().min(1, "Please select a station."),
  sessionDate: z.date({ required_error: "Session date is required." }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
});

// --- Main Component ---
export default function AdminAttendanceView() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [sessions, setSessions] = useState<Array<Session & { attendance: AttendanceRecord[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStationDialogOpen, setIsStationDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeType, setQrCodeType] = useState<'signIn' | 'signOut' | null>(null);

  const functions = getFunctions(app, 'asia-southeast1'); // Replace with your region
  const generateQrToken = httpsCallable(functions, 'generateQrToken');

  const stationForm = useForm<z.infer<typeof stationSchema>>({
    resolver: zodResolver(stationSchema),
    defaultValues: { name: "", location: "" },
  });

  const sessionForm = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
  });

  useEffect(() => {
    // This effect runs when the dialog opens or the sessionToEdit changes
    if (isSessionDialogOpen) {
      if (sessionToEdit) {
        // We are editing: populate form with existing data
        sessionForm.reset({
          stationId: sessionToEdit.stationId,
          sessionDate: sessionToEdit.sessionDate instanceof Date ? sessionToEdit.sessionDate : new Date(sessionToEdit.sessionDate),
          startTime: format(sessionToEdit.startTime instanceof Date ? sessionToEdit.startTime : new Date(sessionToEdit.startTime), "HH:mm"),
          endTime: format(sessionToEdit.endTime instanceof Date ? sessionToEdit.endTime : new Date(sessionToEdit.endTime), "HH:mm"),
        });
      } else {
        // We are adding: reset to default/empty values
        sessionForm.reset({
          stationId: "",
          sessionDate: new Date(),
          startTime: "09:00",
          endTime: "17:00",
        });
      }
    }
  }, [isSessionDialogOpen, sessionToEdit, sessionForm]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStations, fetchedSessions] = await Promise.all([
        getStations(),
        getSessionsWithAttendance(),
      ]);
      setStations(fetchedStations);
      setSessions(fetchedSessions);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch attendance data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleAddStation = async (values: z.infer<typeof stationSchema>) => {
    try {
      await addStation(values);
      toast({ title: "Success", description: "New station created." });
      fetchData();
      setIsStationDialogOpen(false);
      stationForm.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create station." });
    }
  };

  const handleSaveSession = async (values: z.infer<typeof sessionSchema>) => {
    if (!currentUser) return;
    const { stationId, sessionDate, startTime, endTime } = values;
    const station = stations.find(s => s.id === stationId);
    if (!station) return;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMinute);

    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMinute);

    const sessionData = {
      stationId,
      stationName: station.name,
      sessionDate,
      startTime: startDateTime,
      endTime: endDateTime,
      status: "scheduled" as const,
      createdBy: currentUser.uid,
    };
    
    try {
      if(sessionToEdit){
        await updateSession(sessionToEdit.id, sessionData);
        toast({ title: "Success", description: "Session updated." });
      } else {
        await addSession(sessionData);
        toast({ title: "Success", description: "New session scheduled." });
      }

      fetchData();
      setIsSessionDialogOpen(false);
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: sessionToEdit ? "Failed to update session." : "Failed to schedule session." });
    }
  };

  const handleOpenNewDialog = () => {
    setSessionToEdit(null);
    setIsSessionDialogOpen(true);
  };
  
  const handleOpenEditDialog = (session: Session) => {
    setSessionToEdit(session);
    setIsSessionDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete.id);
      toast({ title: "Success", description: "Session deleted." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete session." });
    } finally {
      setSessionToDelete(null);
    }
  };


  const handleGenerateQr = async (sessionId: string, type: 'signIn' | 'signOut') => {
    setQrCodeUrl(null);
    setQrCodeType(type);
    try {
        const result = await generateQrToken({ sessionId, type });
        const data = result.data as { qrUrl: string };
        setQrCodeUrl(data.qrUrl);
    } catch (error: any) {
        console.error("Error generating QR code:", error);
        toast({
            variant: "destructive",
            title: "QR Generation Failed",
            description: `Failed to generate QR code. Ensure Cloud Functions are deployed correctly. Error: ${error.message}`,
        });
        setQrCodeUrl('error'); // Special value to show error state
    }
  };
  
  const handleExportCsv = () => {
    if (sessions.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data to Export",
        description: "There are no sessions or attendance records to export.",
      });
      return;
    }

    const headers = [
      "Session ID",
      "Station Name",
      "Session Date",
      "Student Email",
      "Sign In Time",
      "Sign Out Time",
      "Duration (Minutes)",
    ];

    const rows = sessions.flatMap(session =>
      session.attendance.map(att => [
        session.id,
        session.stationName,
        format(new Date(session.sessionDate), "yyyy-MM-dd"),
        att.userEmail,
        att.signInTime ? format(new Date(att.signInTime), "yyyy-MM-dd HH:mm:ss") : "N/A",
        att.signOutTime ? format(new Date(att.signOutTime), "yyyy-MM-dd HH:mm:ss") : "N/A",
        att.durationMs != null ? (att.durationMs / 60000).toFixed(2) : "N/A",
      ])
    );

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Started",
      description: "Your attendance log CSV is downloading.",
    });
  };

  const calculateAggregates = (attendance: AttendanceRecord[]) => {
    const completed = attendance.filter(a => a.durationMs != null);
    const totalHeadcount = new Set(completed.map(a => a.userId)).size;
    const totalMinutes = completed.reduce((sum, a) => sum + (a.durationMs || 0), 0) / 60000;
    const averageMinutes = totalHeadcount > 0 ? totalMinutes / totalHeadcount : 0;
    return { totalHeadcount, totalMinutes, averageMinutes };
  };


  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* --- Action Buttons --- */}
      <div className="flex gap-4">
        <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
          <Button onClick={handleOpenNewDialog}><PlusCircle className="mr-2 h-4 w-4" /> New Session</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sessionToEdit ? 'Edit Session' : 'Schedule a New Session'}</DialogTitle>
            </DialogHeader>
            <Form {...sessionForm}>
              <form onSubmit={sessionForm.handleSubmit(handleSaveSession)} className="space-y-4">
                <FormField control={sessionForm.control} name="stationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a station" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={sessionForm.control} name="sessionDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={sessionForm.control} name="startTime" render={({ field }) => (
                        <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input placeholder="HH:MM" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={sessionForm.control} name="endTime" render={({ field }) => (
                        <FormItem><FormLabel>End Time</FormLabel><FormControl><Input placeholder="HH:MM" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{sessionToEdit ? 'Save Changes' : 'Schedule Session'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isStationDialogOpen} onOpenChange={setIsStationDialogOpen}>
          <DialogTrigger asChild><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> New Station</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a New Station</DialogTitle></DialogHeader>
            <Form {...stationForm}>
              <form onSubmit={stationForm.handleSubmit(handleAddStation)} className="space-y-4">
                <FormField control={stationForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Station Name</FormLabel><FormControl><Input placeholder="e.g. Suturing Station" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={stationForm.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Sim Lab B" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <DialogFooter><Button type="submit">Create Station</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

        <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the session "{sessionToDelete?.stationName}" on {sessionToDelete?.sessionDate ? format(new Date(sessionToDelete.sessionDate), "PPP") : ''} and all its attendance records. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete Session
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


      {/* --- QR Code Display Dialog --- */}
      <QRCodeDisplay
        isOpen={!!qrCodeUrl}
        onOpenChange={() => setQrCodeUrl(null)}
        qrCodeUrl={qrCodeUrl}
        type={qrCodeType}
      />

      {/* --- Sessions List --- */}
      <Card>
        <CardHeader>
          <CardTitle>Session Dashboard</CardTitle>
          <CardDescription>View scheduled sessions and attendance data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sessions.map(session => {
              const aggregates = calculateAggregates(session.attendance);
              return (
                <AccordionItem value={session.id} key={session.id}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                        <div className="text-left">
                            <p className="font-semibold">{session.stationName}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(session.sessionDate), "PPP")} @ {format(new Date(session.startTime), "p")} - {format(new Date(session.endTime), "p")}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center"><Users className="mr-2 h-4 w-4" /> {aggregates.totalHeadcount} Students</span>
                            <span className="flex items-center"><Clock className="mr-2 h-4 w-4" /> {aggregates.totalMinutes.toFixed(0)} total mins</span>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                     <div className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg">
                        <div className="flex gap-4">
                            <Button onClick={() => handleGenerateQr(session.id, 'signIn')}><QrCodeIcon className="mr-2 h-4 w-4" /> Generate Sign-In QR</Button>
                            <Button onClick={() => handleGenerateQr(session.id, 'signOut')} variant="outline"><QrCodeIcon className="mr-2 h-4 w-4" /> Generate Sign-Out QR</Button>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(session)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit Session</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSessionToDelete(session)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Session</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Email</TableHead>
                          <TableHead>Sign In</TableHead>
                          <TableHead>Sign Out</TableHead>
                          <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.attendance.length > 0 ? session.attendance.map(att => (
                          <TableRow key={att.id}>
                            <TableCell>{att.userEmail}</TableCell>
                            <TableCell>{att.signInTime ? formatDistanceToNow(new Date(att.signInTime), { addSuffix: true }) : "N/A"}</TableCell>
                            <TableCell>{att.signOutTime ? formatDistanceToNow(new Date(att.signOutTime), { addSuffix: true }) : "N/A"}</TableCell>
                            <TableCell className="text-right">{att.durationMs != null ? `${(att.durationMs / 60000).toFixed(1)} mins` : "--"}</TableCell>
                          </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">No attendance records for this session yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
