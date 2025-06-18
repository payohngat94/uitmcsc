import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CalendarDays, Archive, Megaphone, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";

const quickLinks = [
  { title: "Browse Learning Materials", href: "/learning-materials", icon: BookOpen, description: "Access videos, documents, and slides." },
  { title: "Book a Simulation Session", href: "/bookings", icon: CalendarDays, description: "Reserve your spot in the sim labs." },
  { title: "Check Equipment Inventory", href: "/inventory", icon: Archive, description: "View available equipment and make requests." },
  { title: "View Announcements", href: "/announcements", icon: Megaphone, description: "Stay updated with the latest news." },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8">
          <div className="space-y-3 md:max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome to UiTM CSC!</h1>
            <p className="text-lg text-primary-foreground/90">
              Your central platform for clinical skills development. Explore resources, book sessions, and stay informed.
            </p>
            <Button variant="secondary" size="lg" asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/learning-materials">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="hidden md:block mt-6 md:mt-0">
            <Image
              src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/s9jx9215vtmm/CSC_Header.png"
              alt="UiTM Sim Centre Logo"
              width={400}
              height={100}
              className="rounded-lg shadow-md object-contain"
              data-ai-hint="UiTM logo" />
          </div>
        </div>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link) => (
            <Card key={link.href} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{link.title}</CardTitle>
                <link.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                <Button variant="outline" asChild className="w-full">
                  <Link href={link.href}>Go to {link.label || link.title.split(" ")[0]}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" />Important Updates</CardTitle>
            <CardDescription>Latest pinned announcements and critical information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start p-3 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-5 w-5 text-destructive mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive">OSCE Exam Briefing Tomorrow</h3>
                <p className="text-sm text-muted-foreground">Mandatory briefing for all Year 3 students at 10 AM in Lecture Hall A.</p>
              </div>
            </div>
             <div className="flex items-start p-3 bg-secondary rounded-md">
              <Megaphone className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-primary">New Suture Workshop Added</h3>
                <p className="text-sm text-muted-foreground">Limited spots available. Book now via the Bookings page.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><CheckCircle className="h-6 w-6 text-green-600 mr-2" />Your Activity</CardTitle>
            <CardDescription>Summary of your recent bookings and learning progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-md">
              <div>
                <h3 className="font-semibold text-green-700">Physical Exam Practice</h3>
                <p className="text-sm text-muted-foreground">Confirmed for: Tomorrow, 2 PM - 4 PM, Sim Lab 1</p>
              </div>
              <Button variant="ghost" size="sm" asChild><Link href="/bookings">View</Link></Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
               <div>
                <h3 className="font-semibold text-primary">Learning Module: ECG Basics</h3>
                <p className="text-sm text-muted-foreground">Status: 75% completed</p>
              </div>
              <Button variant="ghost" size="sm" asChild><Link href="/learning-materials">Continue</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
