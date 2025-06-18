"use client";

import type { Announcement } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Pin, UserCircle, CalendarIcon } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Card className={`w-full shadow-md hover:shadow-lg transition-shadow duration-300 ${announcement.isPinned ? 'border-primary border-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl mb-1">{announcement.title}</CardTitle>
          {announcement.isPinned && (
            <div className="flex items-center text-primary">
              <Pin className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Pinned</span>
            </div>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-4">
          <span className="flex items-center"><UserCircle className="h-3.5 w-3.5 mr-1" /> By {announcement.author}</span>
          <span className="flex items-center"><CalendarIcon className="h-3.5 w-3.5 mr-1" /> {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
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
