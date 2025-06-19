
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { mockBookings } from "@/lib/mock-data";
import { format } from "date-fns";
import { CalendarCheck, Clock, User, CalendarDays } from "lucide-react"; // Ensured CalendarDays is imported
import Link from "next/link";

export default function BookingsPage() {
  const upcomingBookings = mockBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  
  // IMPORTANT: Replace this with your actual Google Form embed URL
  const googleFormEmbedUrl = "https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_EMBED_LINK_HERE/viewform?embedded=true";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Manage your Booking</h1>
        <p className="text-muted-foreground">
          Book your next clinical experience—whether it&apos;s Simulated Patients, ECE, or FSS—seamlessly, all in one place.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Book a Simulation Session</CardTitle>
          <CardDescription>
            Please fill out the form below to request a session. Ensure you use the correct Google Form embed URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleFormEmbedUrl.startsWith("https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_EMBED_LINK_HERE") ? (
            <div className="p-4 border border-dashed border-destructive rounded-md bg-destructive/10">
              <h3 className="font-semibold text-destructive">Action Required: Update Google Form Link</h3>
              <p className="text-sm text-destructive/80">
                Please replace the placeholder URL in the code (`src/app/(authenticated)/bookings/page.tsx`) with your actual Google Form embed link.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                To get your embed link: Open your Google Form &rarr; Click "Send" &rarr; Go to the "&lt;&gt;" (Embed HTML) tab &rarr; Copy the `src` URL from the iframe code provided.
              </p>
            </div>
          ) : (
            <iframe
              src={googleFormEmbedUrl}
              width="100%"
              height="800px"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="rounded-md border"
              title="Simulation Session Booking Form"
              aria-label="Simulation Session Booking Form"
            >
              Loading booking form…
            </iframe>
          )}
           <p className="mt-4 text-sm text-muted-foreground">
              <strong>Note:</strong> If you haven&apos;t updated the placeholder link in the code yet, the form above will not be your actual booking form.
              To get your Google Form embed link: Open your Google Form &rarr; Click "Send" &rarr; Go to the "&lt;&gt;" (Embed HTML) tab &rarr; Copy the `src` URL from the iframe code.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Your Upcoming Bookings</CardTitle>
          <CardDescription>
            Here are your scheduled and pending simulation sessions. This list is currently based on mock data and will not automatically update from Google Form submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length > 0 ? (
            <ScrollArea className="max-h-[400px] w-full">
              <div className="space-y-4 pr-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="p-4 bg-secondary/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-primary">{booking.sessionName}</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p className="flex items-center"><CalendarCheck className="h-4 w-4 mr-2" /> {format(booking.startTime, "EEEE, MMM d, yyyy")}</p>
                          <p className="flex items-center"><Clock className="h-4 w-4 mr-2" /> {format(booking.startTime, "p")} - {format(booking.endTime, "p")}</p>
                          {booking.studentName && <p className="flex items-center"><User className="h-4 w-4 mr-2" /> {booking.studentName}</p>}
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 flex flex-col items-end gap-2">
                        <span 
                          className={`px-3 py-1 text-xs font-medium rounded-full
                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          ) : (
            <div className="text-center py-10">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Upcoming Bookings</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven&apos;t booked any sessions yet. Use the form above to schedule one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
