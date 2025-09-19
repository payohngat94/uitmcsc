
"use client";

import { useState, useEffect, useMemo } from "react";
import { TopicCard } from "@/components/learning-materials/topic-card";
import { AddTopicDialog, type AddTopicFormValues } from "@/components/learning-materials/add-topic-dialog";
import { AddContentItemDialog, type AddContentItemFormValues } from "@/components/learning-materials/add-content-item-dialog";
import { ContentItemViewer } from "@/components/learning-materials/content-item-viewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, PlusCircle, Layers, Tag, LayoutGrid, ListX } from "lucide-react";
import type { Topic, ContentItem, ContentItemType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  getTopics, 
  addTopic, 
  updateTopic, 
  deleteTopic,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  getContentItemsForTopic,
} from "@/lib/firebase/firestore-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Card as ShadCNCard, CardContent as ShadCNCardContent, CardHeader as ShadCNCardHeader, CardFooter as ShadCNCardFooter } from "@/components/ui/card";
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


export default function LearningMaterialsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isContentItemDialogOpen, setIsContentItemDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [contentItemToEdit, setContentItemToEdit] = useState<ContentItem | null>(null);
  
  const [currentTopicForContent, setCurrentTopicForContent] = useState<Topic | null>(null);
  const [currentContentItems, setCurrentContentItems] = useState<ContentItem[]>([]);
  const [currentViewerTitle, setCurrentViewerTitle] = useState("");

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const fetchedTopics = await getTopics();
      setTopics(fetchedTopics);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching topics",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // --- DIALOG AND VIEWER HANDLERS ---

  const handleOpenAddTopicDialog = () => {
    setTopicToEdit(null);
    setIsTopicDialogOpen(true);
  };

  const handleOpenEditTopicDialog = (topic: Topic) => {
    setTopicToEdit(topic);
    setIsTopicDialogOpen(true);
  };
  
  const handleOpenAddContentItemDialog = (topic: Topic) => {
    setContentItemToEdit(null);
    setCurrentTopicForContent(topic);
    setIsContentItemDialogOpen(true);
  };

  const handleOpenEditContentItemDialog = (item: ContentItem, topic: Topic) => {
    setContentItemToEdit(item);
    setCurrentTopicForContent(topic);
    setIsContentItemDialogOpen(true);
  };
  
  const handleOpenDeleteTopicDialog = (topic: Topic) => {
    setTopicToDelete(topic);
  }

  const handleViewContent = async (topic: Topic, type: ContentItemType) => {
    setCurrentTopicForContent(topic);
    setCurrentViewerTitle(`${topic.title} - ${type.charAt(0).toUpperCase() + type.slice(1)}s`);
    setIsViewerOpen(true);
    try {
        const items = await getContentItemsForTopic(topic.id, type);
        setCurrentContentItems(items);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load content." });
        setIsViewerOpen(false);
    }
  };


  // --- SAVE/DELETE HANDLERS ---

  const handleSaveTopic = async (formData: AddTopicFormValues, id?: string) => {
    const topicData = {
      title: formData.title,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      tags: formData.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
      yearLevels: formData.yearLevels?.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y)) || [],
    };

    try {
      if (id) {
        await updateTopic(id, topicData);
        toast({ title: "Topic Updated", description: `"${topicData.title}" has been updated.` });
      } else {
        await addTopic(topicData);
        toast({ title: "Topic Added", description: `"${topicData.title}" has been added.` });
      }
      fetchTopics();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Topic", description: (error as Error).message });
    } finally {
      setIsTopicDialogOpen(false);
      setTopicToEdit(null);
    }
  };
  
  const handleSaveContentItem = async (formData: AddContentItemFormValues, contentItemId?: string) => {
    if (!currentTopicForContent) return;

    try {
      if (contentItemId) { // Editing existing item
        const itemData = {
          title: formData.title,
          url: formData.url,
          description: formData.description,
          thumbnailUrl: formData.thumbnailUrl,
        };
        await updateContentItem(contentItemId, itemData);
        toast({ title: "Content Item Updated" });
      } else { // Adding new item
        const itemData = {
          topicId: currentTopicForContent.id,
          type: formData.type,
          title: formData.title,
          url: formData.url,
          description: formData.description,
          thumbnailUrl: formData.thumbnailUrl,
        };
        await addContentItem(itemData);
        toast({ title: "Content Item Added" });
      }
      // Refresh data after saving
      fetchTopics();
      if(isViewerOpen && currentTopicForContent && formData.type) {
         const items = await getContentItemsForTopic(currentTopicForContent.id, formData.type);
         setCurrentContentItems(items);
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error Saving Content", description: (error as Error).message });
    } finally {
      setIsContentItemDialogOpen(false);
      setContentItemToEdit(null);
    }
  }
  
  const handleConfirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await deleteTopic(topicToDelete.id);
      toast({ title: "Topic Deleted", description: `"${topicToDelete.title}" and all its content have been removed.` });
      fetchTopics();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Topic", description: (error as Error).message });
    } finally {
      setTopicToDelete(null);
    }
  };

  const handleDeleteContentItem = async (item: ContentItem) => {
    try {
      await deleteContentItem(item);
      toast({ title: "Content Item Deleted" });
      fetchTopics(); // Refresh topic summary
      // Refresh viewer content
      setCurrentContentItems(prev => prev.filter(ci => ci.id !== item.id));
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Item", description: (error as Error).message });
    }
  };


  // --- FILTERING LOGIC ---

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const searchLower = searchTerm.toLowerCase();
      const tagLower = selectedTag.toLowerCase();

      const matchesSearchTerm = searchTerm.trim() === "" ||
        topic.title.toLowerCase().includes(searchLower) ||
        (topic.description && topic.description.toLowerCase().includes(searchLower));

      const matchesTag = selectedTag.trim() === "" ||
        (topic.tags && topic.tags.some(t => t.toLowerCase().includes(tagLower)));
        
      return matchesSearchTerm && matchesTag;
    });
  }, [topics, searchTerm, selectedTag]);

  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <Skeleton className="h-9 w-72 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            {currentUser?.role === 'admin' && <Skeleton className="h-10 w-40" />}
        </div>
        <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ShadCNCard key={i} className="flex flex-col h-full">
              <ShadCNCardHeader className="p-0 relative">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
              </ShadCNCardHeader>
              <ShadCNCardContent className="p-4 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </ShadCNCardContent>
              <ShadCNCardFooter className="p-4 border-t flex justify-end items-center">
                <Skeleton className="h-8 w-1/4" />
              </ShadCNCardFooter>
            </ShadCNCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Learning Materials</h1>
          <p className="text-muted-foreground">
            Explore a comprehensive library of clinical topics. Each card contains multiple resource types.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={handleOpenAddTopicDialog} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Topic
          </Button>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <>
          <AddTopicDialog
            isOpen={isTopicDialogOpen}
            onOpenChange={setIsTopicDialogOpen}
            onSave={handleSaveTopic}
            currentTopic={topicToEdit}
          />
          <AddContentItemDialog
            isOpen={isContentItemDialogOpen}
            onOpenChange={setIsContentItemDialogOpen}
            onSave={handleSaveContentItem}
            currentTopic={currentTopicForContent}
            currentItem={contentItemToEdit}
          />
           <AlertDialog open={!!topicToDelete} onOpenChange={() => setTopicToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the topic "{topicToDelete?.title}" and ALL associated content items (videos, documents, etc.).
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDeleteTopic} className="bg-destructive hover:bg-destructive/90">
                      Delete Topic
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {currentTopicForContent && (
        <ContentItemViewer
            isOpen={isViewerOpen}
            onOpenChange={setIsViewerOpen}
            title={currentViewerTitle}
            items={currentContentItems}
            topic={currentTopicForContent}
            isAdmin={currentUser?.role === 'admin'}
            onAddItem={() => handleOpenAddContentItemDialog(currentTopicForContent)}
            onEditItem={(item) => handleOpenEditContentItemDialog(item, currentTopicForContent)}
            onDeleteItem={handleDeleteContentItem}
        />
      )}

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm space-y-4">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search topic titles, descriptions..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative flex-grow">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by tag (e.g., cardiology)"
              className="pl-10 w-full"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            />
          </div>
      </div>
      
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onViewContent={handleViewContent}
              onAddContent={currentUser?.role === 'admin' ? () => handleOpenAddContentItemDialog(topic) : undefined}
              onEditTopic={currentUser?.role === 'admin' ? () => handleOpenEditTopicDialog(topic) : undefined}
              onDeleteTopic={currentUser?.role === 'admin' ? () => handleOpenDeleteTopicDialog(topic) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Topics Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm || selectedTag
              ? "Your search did not match any topics. Try different keywords or filters."
              : "There are no topics yet. An admin can add the first one."}
          </p>
        </div>
      )}
    </div>
  );
}
