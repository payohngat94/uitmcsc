"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

// Sample available slots - in a real app, this would come from an API
const availableTimeSlots: Record<string, string[]> = {
  "OSCE Practice Session 1": ["09:00 AM", "11:00 AM", "02:00 PM"],
  "Suturing Skills Lab": ["10:00 AM", "01:00 PM", "03:00 PM"],
  "Physical Examination Workshop": ["09:30 AM", "11:30 AM", "02:30 PM"],
};

const sessionTypes = Object.keys(availableTimeSlots);

export function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSession, setSelectedSession] = useState<string | undefined>(sessionTypes[0]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleBooking = () => {
    if (selectedDate && selectedSession && selectedTime) {
      alert(`Booking confirmed for ${selectedSession} on ${format(selectedDate, "PPP")} at ${selectedTime}. (This is a simulation)`);
      // Reset form or close dialog
    } else {
      alert("Please select a date, session, and time slot.");
    }
  };

  if (!isClient) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Book a Session</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <p>Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Book a Simulation Session</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(undefined); // Reset time when date changes
            }}
            className="rounded-md border bg-card p-4"
            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
          />
        </div>
        <div className="flex-grow space-y-6 p-4 border rounded-md bg-card">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold">
                Available Slots for <span className="text-primary">{format(selectedDate, "PPP")}</span>
              </h3>
              <div className="space-y-3">
                <Label htmlFor="session-type">Session Type</Label>
                <Select value={selectedSession} onValueChange={(value) => {
                  setSelectedSession(value);
                  setSelectedTime(undefined); // Reset time when session changes
                }}>
                  <SelectTrigger id="session-type">
                    <SelectValue placeholder="Select a session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(session => (
                      <SelectItem key={session} value={session}>{session}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSession && (
                <div>
                  <Label>Available Times for {selectedSession}:</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {(availableTimeSlots[selectedSession] || []).map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mt-4" disabled={!selectedDate || !selectedSession || !selectedTime}>
                    Request Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Your Booking</DialogTitle>
                    <DialogDescription>
                      Please review your booking details below.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedDate && selectedSession && selectedTime && (
                    <div className="space-y-3 my-4">
                      <p><strong>Session:</strong> {selectedSession}</p>
                      <p><strong>Date:</strong> {format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {/* Close dialog logic if needed */}}>Cancel</Button>
                    <Button onClick={handleBooking}>Confirm Booking</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-10">Please select a date to see available slots.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
