import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, MobileSidebarTrigger } from "@/components/layout/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:px-6 md:hidden">
             <MobileSidebarTrigger />
             <h1 className="text-xl font-semibold font-headline">SimuLearn Hub</h1>
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
