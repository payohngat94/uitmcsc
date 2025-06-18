
"use client";

import { useState, useEffect, useMemo } from "react";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, Megaphone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import type { Announcement, UserRole } from "@/lib/types";
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/firebase/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { AddAnnouncementDialog, type AnnouncementFormValues } from "@/components/announcements/add-announcement-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnnouncementsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<UserRole | "all">("all");

  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);


  const fetchAnnouncements = async () => {
    console.log("AnnouncementsPage: fetchAnnouncements called");
    setIsLoading(true);
    try {
      const fetchedAnnouncements = await getAnnouncements(); 
      console.log("AnnouncementsPage: fetchedAnnouncements successfully, count:", fetchedAnnouncements.length);
      setAnnouncements(fetchedAnnouncements);
    } catch (error) {
      console.error("AnnouncementsPage: fetchAnnouncements CAUGHT ERROR:", error);
      toast({
        variant: "destructive",
        title: "Error fetching announcements",
        description: (error instanceof Error && error.message) ? error.message : "Could not load announcements.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenAddDialog = () => {
    setAnnouncementToEdit(null);
    setIsAnnouncementDialogOpen(true);
  };

  const handleOpenEditDialog = (announcement: Announcement) => {
    setAnnouncementToEdit(announcement);
    setIsAnnouncementDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete || !currentUser || currentUser.role !== 'admin') return;
    try {
      await deleteAnnouncement(announcementToDelete.id);
      toast({
        variant: "default",
        title: "Announcement Deleted",
        description: `"${announcementToDelete.title}" has been removed.`,
      });
      fetchAnnouncements(); 
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Deleting Announcement",
        description: (error instanceof Error && error.message) || "Could not delete the announcement.",
      });
    } finally {
      setAnnouncementToDelete(null);
    }
  };


  const handleSaveAnnouncement = async (formData: AnnouncementFormValues, id?: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in." });
      return;
    }
    if (currentUser.role !== 'admin') {
       toast({ variant: "destructive", title: "Not Authorized", description: "Only admins can manage announcements." });
      return;
    }

    const announcementDataForDb = {
      title: formData.title,
      content: formData.content,
      isPinned: formData.isPinned,
      audience: formData.audience,
    };

    try {
      if (id) { 
        await updateAnnouncement(id, announcementDataForDb);
        toast({
          title: "Announcement Updated",
          description: `"${announcementDataForDb.title}" has been successfully updated.`,
        });
      } else { 
        await addAnnouncement(announcementDataForDb, { id: currentUser.uid, name: currentUser.displayName || currentUser.email || "Admin" });
        toast({
          title: "Announcement Added",
          description: `"${announcementDataForDb.title}" has been successfully added.`,
        });
      }
      fetchAnnouncements();
    } catch (error) {
      toast({
        variant: "destructive",
        title: id ? "Error Updating Announcement" : "Error Adding Announcement",
        description: (error instanceof Error && error.message) || "An unexpected error occurred.",
      });
    } finally {
      setIsAnnouncementDialogOpen(false);
      setAnnouncementToEdit(null);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter(announcement => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === "" ||
          announcement.title.toLowerCase().includes(searchLower) ||
          announcement.content.toLowerCase().includes(searchLower) ||
          (announcement.authorName && announcement.authorName.toLowerCase().includes(searchLower));
        
        const matchesAudience = selectedAudienceFilter === "all" || 
          (Array.isArray(announcement.audience) && announcement.audience.includes(selectedAudienceFilter));
          
        return matchesSearch && matchesAudience;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA; 
      });
  }, [announcements, searchTerm, selectedAudienceFilter]);

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Announcements & Events</h1>
          <p className="text-muted-foreground">
            Stay informed about the latest course updates, training schedules, and important notices.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> New Announcement
          </Button>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <AddAnnouncementDialog
          isOpen={isAnnouncementDialogOpen}
          onOpenChange={setIsAnnouncementDialogOpen}
          currentAnnouncement={announcementToEdit ? { 
            id: announcementToEdit.id,
            title: announcementToEdit.title,
            content: announcementToEdit.content,
            isPinned: announcementToEdit.isPinned,
            audience: announcementToEdit.audience || ['student', 'admin'], 
          } : undefined}
          onSave={handleSaveAnnouncement}
        />
      )}
      
      <AlertDialog open={!!announcementToDelete} onOpenChange={() => setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement titled "{announcementToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAnnouncementToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search announcements..." 
              className="pl-10 w-full" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedAudienceFilter} onValueChange={(value) => setSelectedAudienceFilter(value as UserRole | "all")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <section>
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          </section>
          <section>
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedAnnouncements.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Pinned Announcements</h2>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard 
                    key={announcement.id} 
                    announcement={announcement}
                    onEdit={currentUser?.role === 'admin' ? () => handleOpenEditDialog(announcement) : undefined}
                    onDelete={currentUser?.role === 'admin' ? () => handleOpenDeleteDialog(announcement) : undefined}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold mb-4">{pinnedAnnouncements.length > 0 ? "Other Announcements" : "All Announcements"}</h2>
            {regularAnnouncements.length > 0 || pinnedAnnouncements.length > 0 ? (
              regularAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {regularAnnouncements.map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement} 
                      onEdit={currentUser?.role === 'admin' ? () => handleOpenEditDialog(announcement) : undefined}
                      onDelete={currentUser?.role === 'admin' ? () => handleOpenDeleteDialog(announcement) : undefined}
                    />
                  ))}
                </div>
              ) : (
                pinnedAnnouncements.length > 0 && (searchTerm || selectedAudienceFilter !== "all") && <p className="text-muted-foreground">No other announcements match your current filters.</p>
              )
            ) : (
              <div className="text-center py-12">
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-xl font-semibold">No Announcements Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm || selectedAudienceFilter !== "all" 
                    ? "No announcements match your current filters. Try broadening your search."
                    : "Check back later for updates. Admins can create new announcements."
                  }
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
    
    