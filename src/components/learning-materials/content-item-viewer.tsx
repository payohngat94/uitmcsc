
"use client";

import { useState } from "react";
import type { Topic, ContentItem } from "@/lib/types";
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
import { Youtube, FileText, Presentation, ExternalLink, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
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
        const docIdIndex = pathParts.findIndex(part => part === 'd') + 1;
        if (docIdIndex > 0 && pathParts[docIdIndex]) {
            const docId = pathParts[docIdIndex];
            if (urlObj.pathname.includes('/presentation/d/')) {
                 return `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`;
            }
            return `https://docs.google.com/document/d/${docId}/preview`;
        }
    } catch (e) { /* Fall through */ }
    return url;
};

// --- SUB-COMPONENTS ---

function ItemPlayer({ item }: { item: ContentItem }) {
    const [isLoading, setIsLoading] = useState(true);
    let embedUrl = "";
    if (item.type === 'video') embedUrl = getYouTubeEmbedUrl(item.url);
    else if (isGoogleDocUrl(item.url)) embedUrl = getGoogleEmbedUrl(item.url);
    else embedUrl = item.url;

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

function ItemCard({ item, topic, onPlay, onEdit, onDelete }: {
    item: ContentItem,
    topic: Topic,
    onPlay: (item: ContentItem) => void,
    onEdit?: (item: ContentItem) => void,
    onDelete?: (item: ContentItem) => void,
}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const Icon = item.type === 'video' ? Youtube : item.type === 'document' ? FileText : Presentation;

    const handleDeleteConfirm = () => {
        onDelete?.(item);
        setIsDeleteDialogOpen(false);
    }
    
    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0 relative">
                <div className="aspect-video bg-muted rounded-t-lg">
                    <Image
                        src={item.thumbnailUrl || topic.thumbnailUrl || `https://placehold.co/300x169/E0E0E0/757575?text=${encodeURIComponent(item.title)}`}
                        alt={item.title}
                        width={300}
                        height={169}
                        className="w-full h-full object-cover rounded-t-lg"
                    />
                </div>
                 <Badge variant="secondary" className="absolute top-2 right-2">
                    <Icon className="h-3 w-3 mr-1" /> {item.type}
                 </Badge>
            </CardHeader>
            <CardContent className="p-3 flex-grow">
                <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </CardContent>
            <CardFooter className="p-2 border-t flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => onPlay(item)}>
                    <BookOpen className="h-4 w-4 mr-2" /> View
                </Button>
                {onEdit && (
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
                 {onDelete && (
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
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
                        <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
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

  // When dialog closes, reset the selected item
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
    }
    onOpenChange(open);
  };

  const handlePlay = (item: ContentItem) => {
      // For videos and google docs, we can embed them. For others, open in new tab.
      if (item.type === 'video' || isGoogleDocUrl(item.url)) {
          setSelectedItem(item);
      } else {
          window.open(item.url, '_blank', 'noopener,noreferrer');
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
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
                            <Button size="sm" asChild className="mt-3">
                                <Link href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                                    Open in New Tab <ExternalLink className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center bg-muted rounded-lg text-center p-8">
                        <BookOpen className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-medium">Select an item to preview</p>
                        <p className="text-muted-foreground">Choose a video or document from the right panel.</p>
                    </div>
                )}
            </div>

            <ScrollArea className="col-span-1 border-l h-full">
                <div className="p-4 space-y-3">
                    {isAdmin && onAddItem && (
                        <Button className="w-full" onClick={onAddItem} variant="outline">
                            <Plus className="h-4 w-4 mr-2"/> Add New Content
                        </Button>
                    )}
                    {items.length > 0 ? items.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            topic={topic}
                            onPlay={handlePlay}
                            onEdit={isAdmin ? onEditItem : undefined}
                            onDelete={isAdmin ? onDeleteItem : undefined}
                        />
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No content of this type has been added yet.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>

      </DialogContent>
    </Dialog>
  );
}
