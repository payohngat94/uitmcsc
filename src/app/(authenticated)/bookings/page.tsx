
"use client"; 

import { useState, useMemo } from "react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { ExternalLink, FileText } from "lucide-react"; 
import Link from "next/link";

// Updated URL for the FSS/ECE booking form
const FSS_ECE_BOOKING_FORM_URL = "https://wa.me/60147140146?text=Assalamualaikum%20dan%20Selamat%20Sejahtera%2C%0A%0AIzinkan%20saya%20menempah%20sesi%20FSS%2FECE%20di%20Ward%20Simulasi.";

const FSS_ASSESSMENT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfbtrVmm59t8TGxm2HbvbzwlWuFK4O8pQlr-ZPGUENPGqG1aA/viewform?pli=1&pli=1";
const ECE_ASSESSMENT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScXs_C4R8vieckKQbEhiajJbVbhPMFAxSpiZoUcQ5oWWrLGZA/viewform?pli=1&pli=1";

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
  
  const isBookNowDisabled = !selectedSessionType || (selectedSessionType === 'fss' && !selectedSpecialty);

  const assessmentFormUrl = useMemo(() => {
    if (selectedSessionType === 'fss') return FSS_ASSESSMENT_FORM_URL;
    if (selectedSessionType === 'ece') return ECE_ASSESSMENT_FORM_URL;
    return undefined;
  }, [selectedSessionType]);

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
          <CardDescription>Please choose the options below to book a session and access relevant forms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="session-type-select" className="mb-2 block text-sm font-medium text-foreground/80">Session Type</Label>
            <Select 
              value={selectedSessionType} 
              onValueChange={(value) => {
                setSelectedSessionType(value);
                if (value !== 'fss') {
                  setSelectedSpecialty(undefined); 
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

          <div className="space-y-3">
            <Button asChild className="w-full" disabled={isBookNowDisabled}>
              <Link href={FSS_ECE_BOOKING_FORM_URL} target="_blank" rel="noopener noreferrer">
                Book Session <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {assessmentFormUrl && (
              <Button asChild variant="outline" className="w-full">
                <Link href={assessmentFormUrl} target="_blank" rel="noopener noreferrer">
                  Assessment Form <FileText className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
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
        </CardContent>
      </Card>
      
    </div>
  );
}

