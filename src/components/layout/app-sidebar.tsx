
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
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Archive,
  Megaphone,
  LogOut,
  Settings, 
  GraduationCap,
  Info,
  User, // Icon for Guest user
  UserCog, // Icon for User Management
  QrCode, // Icon for Attendance
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context"; 
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/lib/types";

const allNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ['admin', 'student', 'guest'] as UserRole[] },
  { href: "/learning-materials", icon: BookOpen, label: "Learning Materials", roles: ['admin', 'student'] as UserRole[] },
  { href: "/bookings", icon: CalendarDays, label: "Focused Skill Station / Standardized Patient", roles: ['admin', 'student'] as UserRole[] },
  { href: "/inventory", icon: Archive, label: "Facilities & Manikin", roles: ['admin', 'student', 'guest'] as UserRole[] },
  { href: "/announcements", icon: Megaphone, label: "Announcements", roles: ['admin', 'student'] as UserRole[] },
  { href: "/attendance", icon: QrCode, label: "Attendance", roles: ['admin', 'student'] as UserRole[] },
  { href: "/admin/manage-users", icon: UserCog, label: "Manage Users", roles: ['admin'] as UserRole[] },
  { href: "/about-us", icon: Info, label: "About Us", roles: ['admin', 'student', 'guest'] as UserRole[] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();
  const { currentUser, logout } = useAuth(); 
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      // Toast for error is handled within logout function
    }
  };
  
  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : (currentUser?.isAnonymous ? "G" : "U");
  const userDisplayName = currentUser?.isAnonymous ? "Guest User" : (currentUser?.displayName || "User");
  const userEmail = currentUser?.isAnonymous ? "Anonymous" : currentUser?.email;

  const visibleNavItems = allNavItems.filter(item => 
    currentUser?.role && item.roles.includes(currentUser.role)
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary hover:text-primary/80 transition-colors">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className={cn("whitespace-nowrap transition-opacity duration-200", open ? "opacity-100" : "opacity-0 group-hover/sidebar-wrapper:opacity-100 group-data-[collapsible=icon]:opacity-0")}>
              UiTM CSC
            </span>
          </Link>
          {!isMobile && (
             <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="ml-auto hidden md:flex data-[state=expanded]:flex group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-8 group-data-[state=expanded]:size-7">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
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
        {currentUser && (
          <div className={cn("flex items-center gap-3 transition-all duration-200 mb-2", open ? "opacity-100" : "opacity-0 group-hover/sidebar-wrapper:opacity-100 group-data-[collapsible=icon]:opacity-0")}>
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              {currentUser.isAnonymous ? (
                <AvatarFallback><User /></AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={currentUser.photoURL || "https://placehold.co/100x100.png"} alt={userDisplayName} data-ai-hint="user avatar" />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm text-sidebar-foreground truncate">{userDisplayName}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className={cn("w-full justify-start gap-2", open ? "" : "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center")}
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className={cn("truncate", open ? "" : "group-data-[collapsible=icon]:hidden")}>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function MobileSidebarTrigger() {
  const { isMobile, toggleSidebar } = useSidebar();
  if (!isMobile) return null;
  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
      <GraduationCap />
    </Button>
  );
}
