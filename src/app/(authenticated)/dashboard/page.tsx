
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CalendarDays, Archive, Megaphone, CheckCircle, AlertTriangle, Pin, Info, MessageSquare, ExternalLink } from "lucide-react";
import Image from "next/image";
import { getAnnouncements } from "@/lib/firebase/firestore-service";
import type { Announcement } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const quickLinks = [
  { title: "Browse Learning Materials", href: "/learning-materials", icon: BookOpen, description: "Access videos, documents, and slides.", label: "Browse" },
  { title: "Book a Simulation Session", href: "/bookings", icon: CalendarDays, description: "Reserve your spot in the sim labs.", label: "Book Now" },
  { title: "Our Facilities & Equipment", href: "/inventory", icon: Archive, description: "View available equipment and make requests.", label: "View All" },
  { title: "View Announcements", href: "/announcements", icon: Megaphone, description: "Stay updated with the latest news.", label: "View More" },
];

const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdJBYKhEOf7yfTxBAv0MXLqJo0xE0KQ2VkldnQA6BtyKM-soA/viewform";

export default function DashboardPage() {
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPinnedAnnouncements = async () => {
      setIsLoadingAnnouncements(true);
      try {
        const allAnnouncements = await getAnnouncements();
        const pinned = allAnnouncements
          .filter(ann => ann.isPinned)
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        setPinnedAnnouncements(pinned);
      } catch (error) {
        console.error("Dashboard: Failed to fetch announcements", error);
        toast({
          variant: "destructive",
          title: "Error Fetching Updates",
          description: "Could not load the latest pinned announcements.",
        });
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    fetchPinnedAnnouncements();
  }, [toast]);

  return (
    <div className="space-y-8">
      <section className="mb-8">
        <div className="relative w-full h-auto aspect-[4/1] md:aspect-[5/1] overflow-hidden rounded-lg shadow-lg bg-card">
          <Image
            src="https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ui-t-m-c-s-c-9rprso/assets/s9jx9215vtmm/CSC_Header.png"
            alt="UiTM Sim Centre Banner"
            fill
            priority
            className="object-contain"
            data-ai-hint="UiTM banner"
          />
        </div>
      </section>

      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8">
          <div className="space-y-3 md:max-w-xl text-center md:text-left w-full">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome to UiTM CSC!</h1>
            <p className="text-lg text-primary-foreground/90">
              Your central platform for clinical skills development. Explore resources, book sessions, and stay informed.
            </p>
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
            <CardTitle className="flex items-center"><Pin className="h-6 w-6 text-primary mr-2" />Important Updates</CardTitle>
            <CardDescription>Latest pinned announcements and critical information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingAnnouncements ? (
              <>
                <div className="flex items-start p-3 bg-secondary/50 rounded-md">
                  <Skeleton className="h-5 w-5 mr-3 mt-1 shrink-0 rounded-full" />
                  <div className="w-full">
                    <Skeleton className="h-5 w-3/4 mb-1.5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="flex items-start p-3 bg-secondary/50 rounded-md">
                  <Skeleton className="h-5 w-5 mr-3 mt-1 shrink-0 rounded-full" />
                  <div className="w-full">
                    <Skeleton className="h-5 w-2/3 mb-1.5" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </>
            ) : pinnedAnnouncements.length > 0 ? (
              pinnedAnnouncements.slice(0, 3).map(announcement => ( // Display up to 3 pinned announcements
                <div key={announcement.id} className="flex items-start p-3 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">
                  <Pin className="h-5 w-5 text-primary mr-3 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-primary">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                     <Link href="/announcements" className="text-xs text-primary hover:underline mt-1 inline-block">
                      Read more
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Info className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No pinned announcements at the moment.</p>
                <Button variant="link" asChild className="mt-1">
                  <Link href="/announcements">View all announcements</Link>
                </Button>
              </div>
            )}
            {pinnedAnnouncements.length > 3 && (
               <Button variant="outline" asChild className="w-full mt-2">
                  <Link href="/announcements">View all pinned announcements</Link>
                </Button>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><MessageSquare className="h-6 w-6 text-accent mr-2" />Feedback</CardTitle>
                <CardDescription>We value your experience and are always looking to improve.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4 h-full pt-0">
                <p className="text-foreground/90 leading-relaxed text-sm">
                    Your feedback helps us grow and serve you better &mdash; feel free to share your thoughts, suggestions, or report any issues. We&apos;re listening!
                </p>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground mt-auto">
                    <Link href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">
                        Share Your Thoughts
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
