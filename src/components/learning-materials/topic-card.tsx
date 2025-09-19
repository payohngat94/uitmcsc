
"use client";

import type { Topic, ContentItemType } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Youtube, FileText, Presentation, Plus, Pencil, Trash2, Tag, Calendar, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface TopicCardProps {
  topic: Topic;
  onViewContent: (topic: Topic, type: ContentItemType) => void;
  onAddContent?: (topic: Topic) => void;
  onEditTopic?: (topic: Topic) => void;
  onDeleteTopic?: (topic: Topic) => void;
}

const typeInfo: Record<ContentItemType, { label: string, icon: React.ElementType, countKey: keyof Topic['resourceSummary'] }> = {
    video: { label: "Videos", icon: Youtube, countKey: 'videoCount' },
    document: { label: "Docs", icon: FileText, countKey: 'documentCount' },
    slides: { label: "Slides", icon: Presentation, countKey: 'slidesCount' },
};

export function TopicCard({ topic, onViewContent, onAddContent, onEditTopic, onDeleteTopic }: TopicCardProps) {
  const { resourceSummary, tags, yearLevels } = topic;
  const isAdmin = !!(onAddContent && onEditTopic && onDeleteTopic);

  return (
    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300 ease-in-out group">
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={topic.thumbnailUrl || `https://placehold.co/400x225/E0E0E0/757575?text=${encodeURIComponent(topic.title)}`}
            alt={topic.title}
            width={400}
            height={225}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="medical topic"
          />
        </div>
        {isAdmin && (
            <div className="absolute top-2 right-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-black/30 hover:bg-black/50 border-none text-white">
                             <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTopic(topic)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit Topic</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddContent(topic)}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Add Content</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteTopic(topic)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Topic</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-2 line-clamp-2">{topic.title}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
            {tags?.map(tag => (
                <Badge key={tag} variant="secondary"><Tag className="h-3 w-3 mr-1" />{tag}</Badge>
            ))}
            {yearLevels?.map(year => (
                <Badge key={year} variant="outline"><Calendar className="h-3 w-3 mr-1" />Year {year}</Badge>
            ))}
        </div>
      </CardContent>

      <CardFooter className="p-2 border-t flex justify-end items-center gap-1.5">
        {(['video', 'document', 'slides'] as ContentItemType[]).map(type => {
            const info = typeInfo[type];
            const count = topic.resourceSummary[info.countKey];
            const hasType = count > 0;

            return (
                <Button 
                    key={type}
                    variant="outline" 
                    size="sm" 
                    disabled={!hasType}
                    onClick={() => hasType && onViewContent(topic, type)}
                    className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`View ${count} ${info.label} for ${topic.title}`}
                >
                    <info.icon className="h-4 w-4" />
                    {hasType && (
                        <span className="ml-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                            {count}
                        </span>
                    )}
                </Button>
            )
        })}
      </CardFooter>
    </Card>
  );
}
    