
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, Users, BookOpen, Lightbulb, Target, UsersRound, Phone, Mail, MapPin } from "lucide-react";
import Image from "next/image";

export default function AboutUsPage() {
  const keyObjectives = [
    {
      icon: Target,
      title: "Acquisition of Clinical Skills",
      description: "Equip undergraduate students with task-based clinical skills.",
    },
    {
      icon: Lightbulb,
      title: "Integration of Knowledge",
      description: "Establish links between preclinical and clinical years to reinforce understanding.",
    },
    {
      icon: UsersRound,
      title: "Understanding Clinical Roles",
      description: "Familiarize students with the roles of house officers and clinical team members in the ward processes.",
    },
    {
      icon: BookOpen,
      title: "Effective Communication",
      description: "Develop effective communication skills, including referrals and handovers.",
    },
  ];

  const contactDetails = {
    department: "Department of Medical Education",
    addressLine1: "Level 3, Academic Building, Faculty of Medicine,",
    addressLine2: "Universiti Teknologi MARA, Sg. Buloh Campus,",
    addressLine3: "Jln Hospital, 47000, Sg. Buloh",
    addressLine4: "Selangor, MALAYSIA",
    phone: "+60-3 6126 5000 ext 7101",
    email: "dmemedic@uitm.edu.my",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.5155365848323!2d101.59170257674494!3d3.2209535527034014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc456bb5245795%3A0x7f4d1f56553af082!2sUiTM%20Clinical%20Simulation%20Centre%20(UiTM%20Sg%20Buloh%20Campus)!5e0!3m2!1sen!2smy!4v1750234496886!5m2!1sen!2smy"
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-card p-0 text-center"> {/* Changed background to white and removed padding */}
          <div className="relative w-full aspect-[4/1]"> {/* Ensured full width and 4:1 aspect ratio for image container */}
            <Image
              src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/s9jx9215vtmm/CSC_Header.png"
              alt="UiTM CSC Banner"
              fill
              priority
              className="object-contain" // Image will fit within the container, preserving aspect ratio
              data-ai-hint="CSC banner"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <blockquote className="relative p-4 text-xl italic border-l-4 border-primary bg-primary/5 text-primary rounded-md my-6 shadow">
            <p className="mb-0">"Your gateway to building individual skills and shared medical knowledge"</p>
          </blockquote>

          <div className="space-y-6 text-foreground/90">
            <p>
              The Clinical Simulation Centre (CSC) serves as an additional learning space for medical students, 
              offering a secure environment for practicing and understanding challenging concepts from pre-clinical 
              to clinical years. Its purpose is to enhance students' comprehension and application of medical knowledge.
            </p>
            <p>
              The CSC facilitates a bridge between theoretical learning and practical experience by providing 
              simulated scenarios that connect clinical education to real-world situations. It offers learning 
              modules covering the entire medical school curriculum, promoting a hybrid approach with online 
              learning followed by onsite skill training.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <CheckSquare className="mr-3 h-7 w-7 text-primary" />
            Key Objectives of the CSC
          </CardTitle>
          <CardDescription>
            Our core goals in fostering medical excellence.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keyObjectives.map((objective) => (
            <div key={objective.title} className="flex items-start space-x-4 p-4 bg-secondary/30 rounded-lg">
              <objective.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-primary">{objective.title}</h3>
                <p className="text-sm text-muted-foreground">{objective.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Users className="mr-3 h-7 w-7 text-accent" />
            Beyond Student Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90">
            The CSC is not limited to student use; it is open to workshops, conferences, and micro-credentialing 
            programs for both UiTM staff and the public, promoting continuous learning and skill development in 
            the medical field.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <MapPin className="mr-3 h-7 w-7 text-primary" />
            Contact Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-foreground/90">
            <h3 className="font-semibold text-lg text-primary">{contactDetails.department}</h3>
            <address className="not-italic space-y-1">
              <p>{contactDetails.addressLine1}</p>
              <p>{contactDetails.addressLine2}</p>
              <p>{contactDetails.addressLine3}</p>
              <p>{contactDetails.addressLine4}</p>
            </address>
            <div className="space-y-2 pt-2">
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                Tel: {contactDetails.phone}
              </p>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                Email: <a href={`mailto:${contactDetails.email}`} className="text-primary hover:underline ml-1">{contactDetails.email}</a>
              </p>
            </div>
          </div>
          <div className="w-full h-80 md:h-full rounded-lg overflow-hidden shadow-md border">
            <iframe
              src={contactDetails.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border:0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location of UiTM Clinical Simulation Centre"
              aria-label="Location of UiTM Clinical Simulation Centre"
            ></iframe>
             <p className="mt-2 text-xs text-muted-foreground text-center">
                If the map above doesn't show the correct location, ensure the embed URL in the code is accurate.
              </p>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
