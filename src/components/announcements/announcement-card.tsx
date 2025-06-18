
"use client";

import type { Announcement } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Pin, UserCircle, CalendarIcon, Edit3, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

export function AnnouncementCard({ announcement, onEdit, onDelete }: AnnouncementCardProps) {
  const { currentUser } = useAuth();
  const canManage = currentUser?.role === 'admin'; // Simplified: any admin can edit/delete

  // Ensure createdAt is a Date object for formatDistanceToNow
  const createdAtDate = announcement.createdAt instanceof Date 
    ? announcement.createdAt 
    : (announcement.createdAt as any)?.toDate?.() || new Date();

  return (
    <Card className={`w-full shadow-md hover:shadow-lg transition-shadow duration-300 ${announcement.isPinned ? 'border-primary border-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl mb-1 flex-grow">{announcement.title}</CardTitle>
          <div className="flex items-center flex-shrink-0">
            {announcement.isPinned && (
              <div className="flex items-center text-primary mr-3">
                <Pin className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Pinned</span>
              </div>
            )}
            {canManage && onEdit && onDelete && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(announcement)}>
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => onDelete(announcement)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
          <span className="flex items-center"><UserCircle className="h-3.5 w-3.5 mr-1" /> By {announcement.authorName}</span>
          <span className="flex items-center"><CalendarIcon className="h-3.5 w-3.5 mr-1" /> {formatDistanceToNow(createdAtDate, { addSuffix: true })}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{announcement.content}</p>
      </CardContent>
      {announcement.audience && announcement.audience.length > 0 && (
        <CardFooter className="pt-3">
          <div className="flex flex-wrap gap-2">
            {announcement.audience.map(role => (
              <Badge key={role} variant="secondary" className="text-xs">
                For: {role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
