"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Archive,
  Megaphone,
  LogOut,
  UserCircle,
  GraduationCap,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/learning-materials", icon: BookOpen, label: "Learning Materials" },
  { href: "/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/inventory", icon: Archive, label: "Inventory" },
  { href: "/announcements", icon: Megaphone, label: "Announcements" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary hover:text-primary/80 transition-colors">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className={cn("whitespace-nowrap transition-opacity duration-200", open ? "opacity-100" : "opacity-0 group-hover/sidebar-wrapper:opacity-100 group-data-[collapsible=icon]:opacity-0")}>
              SimuLearn
            </span>
          </Link>
          {!isMobile && (
             <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="ml-auto hidden md:flex data-[state=expanded]:flex group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-8 group-data-[state=expanded]:size-7">
              <Settings className="h-4 w-4" /> {/* Using settings icon as a placeholder for collapse/expand visual cue */}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
                  className="justify-start"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3 transition-all duration-200", open ? "opacity-100" : "opacity-0 group-hover/sidebar-wrapper:opacity-100 group-data-[collapsible=icon]:opacity-0")}>
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-sm text-sidebar-foreground truncate">User Name</span>
            <span className="text-xs text-muted-foreground truncate">student@example.com</span>
          </div>
        </div>
        <Link href="/" legacyBehavior passHref>
            <Button variant="ghost" className={cn("w-full justify-start mt-2 gap-2", open ? "" : "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center")}>
              <LogOut className="h-5 w-5" />
              <span className={cn("truncate", open ? "" : "group-data-[collapsible=icon]:hidden")}>Logout</span>
            </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}

export function MobileSidebarTrigger() {
  const { isMobile, toggleSidebar } = useSidebar();
  if (!isMobile) return null;
  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
      <GraduationCap /> {/* Using PanelLeft, standard for mobile menu toggle */}
    </Button>
  );
}
