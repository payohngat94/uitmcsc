
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { mockBookings } from "@/lib/mock-data";
import { format } from "date-fns";
import { CalendarCheck, Clock, User, CalendarDays } from "lucide-react"; // Ensured CalendarDays is imported
import Link from "next/link";

export default function BookingsPage() {
  const upcomingBookings = mockBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  
  // Updated Google Form embed URL for Standardize Patient (SP) bookings
  const googleFormEmbedUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfyb4iO2QbNwGdc5y1PJ73fgyy2tvz4hlbHeqUtQQ_0MuiUUQ/viewform?embedded=true";
  const placeholderFormUrl = "https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_EMBED_LINK_HERE";


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
          <CardTitle className="text-2xl">Standardize Patient (SP)</CardTitle>
          <CardDescription>
            Please fill out the form below to request a session. Ensure you use the correct Google Form embed URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleFormEmbedUrl.startsWith(placeholderFormUrl) ? (
            <div className="p-4 border border-dashed border-destructive rounded-md bg-destructive/10">
              <h3 className="font-semibold text-destructive">Action Required: Update Google Form Link</h3>
              <p className="text-sm text-destructive/80">
                Please replace the placeholder URL in the code (`src/app/(authenticated)/bookings/page.tsx`) with your actual Google Form embed link for Standardize Patient bookings.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                To get your embed link: Open your Google Form &rarr; Click "Send" &rarr; Go to the "&lt;&gt;" (Embed HTML) tab &rarr; Copy the `src` URL from the iframe code provided (ensure `?embedded=true` is at the end).
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
              title="Standardize Patient (SP) Booking Form"
              aria-label="Standardize Patient (SP) Booking Form"
            >
              Loading booking form…
            </iframe>
          )}
           <p className="mt-4 text-sm text-muted-foreground">
              <strong>Note:</strong> If you see an "Action Required" message above, please update the placeholder link in the code.
              To get your Google Form embed link: Open your Google Form &rarr; Click "Send" &rarr; Go to the "&lt;&gt;" (Embed HTML) tab &rarr; Copy the `src` URL from the iframe code and ensure `?embedded=true` is appended.
            </p>
        </CardContent>
      </Card>

      {/* The "Your Upcoming Bookings" card has been removed from here */}
      
    </div>
  );
}
