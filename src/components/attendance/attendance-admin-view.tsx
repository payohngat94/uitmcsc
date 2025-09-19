
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { Session, Station, AttendanceRecord } from '@/lib/types';
import { getStations, addStation, addSession, getSessionsWithAttendance } from '@/lib/firebase/firestore-service';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, QrCode, RefreshCcw, Users, Clock, BarChart2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QRCode from "react-qr-code";
import { Badge } from '../ui/badge';


function CreateSessionDialog({ stations, onSessionCreated }: { stations: Station[], onSessionCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStationId, setSelectedStationId] = useState<string>('');
    const { currentUser } = useAuth();
    const { toast } = useToast();

    const handleCreateSession = async () => {
        if (!selectedStationId || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a station.' });
            return;
        }
        
        const selectedStation = stations.find(s => s.id === selectedStationId);
        if (!selectedStation) {
             toast({ variant: 'destructive', title: 'Error', description: 'Selected station not found.' });
            return;
        }

        try {
            await addSession({
                stationId: selectedStation.id,
                stationName: selectedStation.name,
                sessionDateTime: new Date(),
                status: 'scheduled',
                creatorId: currentUser.uid,
                creatorName: currentUser.email || 'Admin'
            });
            toast({ title: 'Success', description: `Session created for ${selectedStation.name}.` });
            onSessionCreated();
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create session.' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Session</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Station Session</DialogTitle>
                    <DialogDescription>Select a station to start a new attendance session. The session will be scheduled for the current date and time.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={selectedStationId} onValueChange={setSelectedStationId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a station..." />
                        </SelectTrigger>
                        <SelectContent>
                            {stations.map(station => (
                                <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateSession} disabled={!selectedStationId}>Create Session</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateStationDialog({ onStationCreated }: { onStationCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [stationName, setStationName] = useState('');
    const [location, setLocation] = useState('');
    const { toast } = useToast();
    
    const handleCreate = async () => {
         if (!stationName || !location) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
            return;
        }
        try {
            await addStation({ name: stationName, location });
            toast({ title: 'Success', description: 'New station created.' });
            onStationCreated();
            setIsOpen(false);
            setStationName('');
            setLocation('');
        } catch (error) {
            console.error("Error creating station:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create station.' });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> New Station</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Station</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <Input placeholder="Station Name (e.g., Suturing Lab)" value={stationName} onChange={e => setStationName(e.target.value)} />
                    <Input placeholder="Location (e.g., Sim Lab A)" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function QrCodeDialog({ sessionId, type, onRegenerate }: { sessionId: string, type: 'signIn' | 'signOff', onRegenerate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const generateQr = async () => {
        setIsLoading(true);
        setError(null);
        setQrValue('');
        try {
            const functions = getFunctions();
            const generateQrToken = httpsCallable(functions, 'generateQrToken');
            const result: any = await generateQrToken({ sessionId, type });
            const token = result.data.token;
            if (!token) throw new Error("No token returned from function.");
            const scanUrl = `${window.location.origin}/attendance?token=${token}`;
            setQrValue(scanUrl);
        } catch (err) {
             console.error("Error generating QR code:", err);
             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
             setError(`Failed to generate QR code. Ensure Cloud Functions are deployed correctly. Error: ${errorMessage}`);
             toast({ variant: 'destructive', title: 'QR Generation Failed', description: 'Could not generate a new QR code.'});
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            generateQr();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant={type === 'signIn' ? "default" : "secondary"}>
                    <QrCode className="mr-2 h-4 w-4" /> {type === 'signIn' ? 'Sign In' : 'Sign Off'} QR
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{type === 'signIn' ? 'Sign In' : 'Sign Off'} QR Code for Session</DialogTitle>
                    <DialogDescription>Students can scan this code. It is valid for 2 minutes and will regenerate automatically if you close and reopen this dialog.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center p-4 min-h-[280px] bg-muted rounded-md">
                    {isLoading && <Skeleton className="h-64 w-64" />}
                    {error && <p className="text-destructive text-center text-sm">{error}</p>}
                    {qrValue && (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <QRCode value={qrValue} size={256} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminAttendanceView() {
    const [stations, setStations] = useState<Station[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedStations, fetchedSessions] = await Promise.all([
                getStations(),
                getSessionsWithAttendance()
            ]);
            setStations(fetchedStations);
            setSessions(fetchedSessions);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch attendance data.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
                <div className="flex gap-2">
                    <CreateStationDialog onStationCreated={fetchData} />
                    <CreateSessionDialog stations={stations} onSessionCreated={fetchData} />
                </div>
            </div>

            {isLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : sessions.length === 0 ? (
                 <Card>
                    <CardContent className="p-10 text-center text-muted-foreground">
                        No sessions found. Create a station and then a session to begin.
                    </CardContent>
                </Card>
            ) : (
                sessions.map(session => (
                    <Card key={session.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{session.stationName}</CardTitle>
                                    <CardDescription>
                                        {format(new Date(session.sessionDateTime), 'PPpp')}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <QrCodeDialog sessionId={session.id} type="signIn" onRegenerate={fetchData} />
                                    <QrCodeDialog sessionId={session.id} type="signOff" onRegenerate={fetchData} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
                                <Card className="p-4">
                                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium flex items-center justify-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Headcount</CardTitle></CardHeader>
                                    <p className="text-2xl font-bold">{(session as any).aggregates?.headcount ?? 0}</p>
                                </Card>
                                <Card className="p-4">
                                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium flex items-center justify-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Total Time</CardTitle></CardHeader>
                                    <p className="text-2xl font-bold">{Math.round((session as any).aggregates?.totalMinutes ?? 0)} <span className="text-sm font-normal text-muted-foreground">min</span></p>
                                </Card>
                                <Card className="p-4">
                                    <CardHeader className="p-0 pb-2"><CardTitle className="text-sm font-medium flex items-center justify-center gap-2"><BarChart2 className="h-4 w-4 text-muted-foreground" /> Avg. Time</CardTitle></CardHeader>
                                    <p className="text-2xl font-bold">{Math.round((session as any).aggregates?.averageMinutes ?? 0)} <span className="text-sm font-normal text-muted-foreground">min</span></p>
                                </Card>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Check In</TableHead>
                                        <TableHead>Check Out</TableHead>
                                        <TableHead className="text-right">Duration (min)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(session as any).attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No attendance records yet.</TableCell>
                                        </TableRow>
                                    ) : (
                                        (session as any).attendance.map((att: AttendanceRecord) => (
                                            <TableRow key={att.id}>
                                                <TableCell>{att.userEmail}</TableCell>
                                                <TableCell>
                                                    {att.checkInTime ? format(new Date(att.checkInTime as any), 'p') : <Badge variant="outline">N/A</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    {att.checkOutTime ? format(new Date(att.checkOutTime as any), 'p') : <Badge variant="outline">N/A</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {att.durationMinutes !== undefined ? att.durationMinutes.toFixed(1) : '---'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
