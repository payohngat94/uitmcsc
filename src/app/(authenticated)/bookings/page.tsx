
"use client"; // Added "use client" for useState

import { useState } from "react"; // Added useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Added Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components
import { ExternalLink } from "lucide-react"; // Added ExternalLink
import Link from "next/link";

// Placeholder URL for the new FSS/ECE booking form - PLEASE UPDATE THIS
const FSS_ECE_BOOKING_FORM_URL = "YOUR_FSS_ECE_GOOGLE_FORM_LINK_HERE";

const sessionTypesOptions = [
  { value: "fss", label: "Focused Skill Station" },
  { value: "ece", label: "Early Clinical Exposure" },
];

const fssSpecialtiesOptions = [
  { value: "paediatrics", label: "Paediatrics" },
  { value: "og", label: "Obstetric and Gynaecology" },
  { value: "medicine", label: "Medicine" },
  { value: "surgery", label: "Surgery" },
  { value: "emergency", label: "Emergency" },
];


export default function BookingsPage() {
  const [selectedSessionType, setSelectedSessionType] = useState<string | undefined>(undefined);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(undefined);

  const spGoogleFormEmbedUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfyb4iO2QbNwGdc5y1PJ73fgyy2tvz4hlbHeqUtQQ_0MuiUUQ/viewform?embedded=true";
  const placeholderSpFormUrl = "https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_EMBED_LINK_HERE"; // Kept for SP card logic

  const isBookNowDisabled = !selectedSessionType || (selectedSessionType === 'fss' && !selectedSpecialty);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Manage your Booking</h1>
        <p className="text-muted-foreground">
          Book your next clinical experience—whether it's Simulated Patients, ECE, or FSS—seamlessly, all in one place.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Focused Skill Station & Early Clinical Exposure</CardTitle>
          <CardDescription>Please choose the options below to book a session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="session-type-select" className="mb-2 block text-sm font-medium text-foreground/80">Session Type</Label>
            <Select 
              value={selectedSessionType} 
              onValueChange={(value) => {
                setSelectedSessionType(value);
                if (value !== 'fss') {
                  setSelectedSpecialty(undefined); // Reset specialty if not FSS
                }
              }}
            >
              <SelectTrigger id="session-type-select" className="w-full">
                <SelectValue placeholder="Choose session type..." />
              </SelectTrigger>
              <SelectContent>
                {sessionTypesOptions.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSessionType === "fss" && (
            <div>
              <Label htmlFor="specialty-select" className="mb-2 block text-sm font-medium text-foreground/80">Discipline/Specialty</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger id="specialty-select" className="w-full">
                  <SelectValue placeholder="Choose specialty for FSS..." />
                </SelectTrigger>
                <SelectContent>
                  {fssSpecialtiesOptions.map(spec => (
                    <SelectItem key={spec.value} value={spec.value}>{spec.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button asChild className="w-full" disabled={isBookNowDisabled}>
            <Link href={FSS_ECE_BOOKING_FORM_URL} target="_blank" rel="noopener noreferrer">
              Book Now <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {FSS_ECE_BOOKING_FORM_URL === "YOUR_FSS_ECE_GOOGLE_FORM_LINK_HERE" && (
            <p className="text-xs text-destructive/80 text-center p-2 border border-dashed border-destructive/50 rounded-md bg-destructive/10">
                <strong>Action Required:</strong> Please update the `FSS_ECE_BOOKING_FORM_URL` in the code (`src/app/(authenticated)/bookings/page.tsx`) with your actual Google Form link for FSS/ECE bookings.
            </p>
           )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Standardize Patient (SP)</CardTitle>
          <CardDescription>
            Please fill out the form below to request a session. Ensure you use the correct Google Form embed URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spGoogleFormEmbedUrl.startsWith(placeholderSpFormUrl) ? ( // This condition will now always be false if spGoogleFormEmbedUrl is correctly set
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
              src={spGoogleFormEmbedUrl}
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
              <strong>Note:</strong> If you see an "Action Required" message above for SP bookings (which shouldn't happen if the link is correct), please update the placeholder link in the code.
              To get your Google Form embed link: Open your Google Form &rarr; Click "Send" &rarr; Go to the "&lt;&gt;" (Embed HTML) tab &rarr; Copy the `src` URL from the iframe code and ensure `?embedded=true` is appended.
            </p>
        </CardContent>
      </Card>
      
    </div>
  );
}

