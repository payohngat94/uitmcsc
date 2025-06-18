
import { mockAnnouncements } from "@/lib/mock-data";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, Megaphone } from "lucide-react"; // Added Megaphone
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth

export default function AnnouncementsPage() {
  const { currentUser } = useAuth(); // Get current user
  // In a real app, data fetching and sorting would happen here.
  const pinnedAnnouncements = mockAnnouncements
    .filter(a => a.isPinned)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const regularAnnouncements = mockAnnouncements
    .filter(a => !a.isPinned)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> New Announcement (Admin)
          </Button>
        )}
      </div>

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search announcements..." className="pl-10 w-full" />
          </div>
          <Select>
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
      
      <div className="space-y-6">
        {pinnedAnnouncements.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Pinned Announcements</h2>
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4">All Announcements</h2>
          {regularAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {regularAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Announcements Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back later for updates and important news.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
