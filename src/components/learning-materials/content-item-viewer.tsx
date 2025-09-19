

"use client";

import { useState, useEffect } from "react";
import type { Topic, ContentItem, ContentItemType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Youtube, FileText, Presentation, ExternalLink, Plus, Pencil, Trash2, BookOpen, Film, StickyNote } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// --- YOUTUBE & GOOGLE DOC HELPERS ---
const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v");
    } else if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.substring(1);
    }
  } catch (e) { /* Invalid URL */ }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

const isGoogleDocUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'docs.google.com' && (urlObj.pathname.includes('/document/d/') || urlObj.pathname.includes('/presentation/d/'));
  } catch (e) { return false; }
};

const getGoogleEmbedUrl = (url: string): string => {
   if (!isGoogleDocUrl(url)) return url;
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Find the 'd' part of the URL, the ID is next
        const docIdIndex = pathParts.findIndex(part => part === 'd') + 1;
        if (docIdIndex > 0 && pathParts[docIdIndex]) {
            const docId = pathParts[docIdIndex];
            if (urlObj.pathname.includes('/presentation/d/')) {
                 return `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`;
            }
            // Default to document preview embed
            return `https://docs.google.com/document/d/${docId}/preview`;
        }
    } catch (e) { /* Fall through and return original URL on error */ }
    return url;
};

const typeInfo: Record<ContentItemType, { label: string, icon: React.ElementType }> = {
    video: { label: "Video", icon: Film },
    document: { label: "Document", icon: FileText },
    slides: { label: "Slides", icon: Presentation },
}

// --- SUB-COMPONENTS ---

function ItemPlayer({ item }: { item: ContentItem }) {
    const [isLoading, setIsLoading] = useState(true);
    let embedUrl = "";
    if (item.type === 'video') {
      embedUrl = getYouTubeEmbedUrl(item.url);
    } else if (isGoogleDocUrl(item.url)) {
      embedUrl = getGoogleEmbedUrl(item.url);
    } else {
      // For non-embeddable types, show a message and a link
      return (
        <div className="aspect-video w-full relative bg-muted rounded-lg border flex flex-col items-center justify-center p-4">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-center font-semibold">This content cannot be embedded.</p>
          <p className="text-center text-sm text-muted-foreground mb-4">Click the button below to open it in a new tab.</p>
          <Button asChild>
            <Link href={item.url} target="_blank" rel="noopener noreferrer">
              Open Content <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    }

    return (
        <div className="aspect-video w-full relative bg-muted rounded-lg border">
             {isLoading && <Skeleton className="absolute inset-0" />}
            <iframe
                src={embedUrl}
                title={item.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className={`w-full h-full rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}`}
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
}

function ItemCard({ item, topic, onPlay, onEdit, onDelete, isSelected }: {
    item: ContentItem,
    topic: Topic,
    onPlay: (item: ContentItem) => void,
    onEdit?: (item: ContentItem) => void,
    onDelete?: (item: ContentItem) => void,
    isSelected: boolean,
}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const ItemIcon = typeInfo[item.type].icon;

    const handleDeleteConfirm = () => {
        onDelete?.(item);
        setIsDeleteDialogOpen(false);
    }
    
    return (
        <Card className={`flex flex-col transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}>
            <button 
                onClick={() => onPlay(item)} 
                className="block text-left p-3 flex-grow"
                aria-current={isSelected ? "true" : "false"}
            >
                <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </button>
            
            <CardFooter className="p-2 border-t flex justify-between items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                    <ItemIcon className="h-3 w-3 mr-1.5" />
                    {typeInfo[item.type].label}
                </Badge>
                {onEdit && onDelete && (
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Content Item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete "{item.title}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

// --- MAIN DIALOG COMPONENT ---

interface ContentItemViewerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ContentItem[];
  topic: Topic;
  isAdmin?: boolean;
  onAddItem?: () => void;
  onEditItem?: (item: ContentItem) => void;
  onDeleteItem?: (item: ContentItem) => void;
}

export function ContentItemViewer({
  isOpen,
  onOpenChange,
  title,
  items,
  topic,
  isAdmin,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: ContentItemViewerProps) {
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // When dialog opens with items, select the first one. Reset on close.
  useEffect(() => {
    if (isOpen) {
        setSelectedItem(items[0] || null);
    } else {
        setSelectedItem(null);
    }
  }, [isOpen, items]);
  
  const handlePlay = (item: ContentItem) => {
      setSelectedItem(item);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Select an item from the list to view it.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 flex-grow min-h-0">
            <div className="col-span-1 md:col-span-2 flex flex-col p-4">
                {selectedItem ? (
                    <>
                        <ItemPlayer item={selectedItem} />
                        <div className="mt-4">
                            <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                            {selectedItem.description && <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>}
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center bg-muted rounded-lg text-center p-8">
                        <StickyNote className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-medium">No Content to Display</p>
                        <p className="text-muted-foreground">There are no items of this type in this topic yet.</p>
                        {isAdmin && onAddItem && (
                            <Button className="mt-4" onClick={onAddItem}>
                                <Plus className="h-4 w-4 mr-2"/> Add First Content Item
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <ScrollArea className="col-span-1 border-l h-full bg-secondary/20">
                <div className="p-4 space-y-3">
                    {isAdmin && onAddItem && (
                        <Button className="w-full" onClick={onAddItem} variant="outline">
                            <Plus className="h-4 w-4 mr-2"/> Add New Content
                        </Button>
                    )}
                    {items.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            topic={topic}
                            onPlay={handlePlay}
                            onEdit={isAdmin ? onEditItem : undefined}
                            onDelete={isAdmin ? onDeleteItem : undefined}
                            isSelected={selectedItem?.id === item.id}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>

      </DialogContent>
    </Dialog>
  );
}
    
