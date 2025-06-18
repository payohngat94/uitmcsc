
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Users, BookOpen, Lightbulb, Target, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/10 p-8 text-center">
          <div className="relative w-full h-32 md:h-40 max-w-3xl mx-auto mb-4">
            <Image
              src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/s9jx9215vtmm/CSC_Header.png"
              alt="UiTM CSC Banner"
              fill
              priority
              className="object-contain"
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
      
    </div>
  );
}
