
"use client"; // Required for using hooks like useRouter and useAuth

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, MobileSidebarTrigger } from "@/components/layout/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/"); // Redirect to login page if not authenticated
    }
  }, [currentUser, loading, router]);

  if (loading) {
    // Show a loading state while checking authentication
    // You can customize this further e.g. a full page spinner
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, don't render children if not authenticated.
    // Or, render null, or a message, or redirect again.
    return null; 
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:px-6 md:hidden">
             <MobileSidebarTrigger />
             <h1 className="text-xl font-semibold font-headline">UiTM CSC</h1>
          </header>
          <ScrollArea className="flex-1">
            <main className="p-4 md:p-8 lg:p-10">
              {children}
            </main>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
