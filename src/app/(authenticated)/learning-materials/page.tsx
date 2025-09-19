

"use client";

import { useState, useEffect, useMemo } from "react";
import { TopicCard } from "@/components/learning-materials/topic-card";
import { AddTopicDialog, type AddTopicFormValues } from "@/components/learning-materials/add-topic-dialog";
import { AddContentItemDialog, type AddContentItemFormValues } from "@/components/learning-materials/add-content-item-dialog";
import { CategoryCard } from "@/components/learning-materials/category-card";
import { AddCategoryDialog } from "@/components/learning-materials/add-category-dialog";
import { ContentItemViewer } from "@/components/learning-materials/content-item-viewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, PlusCircle, Layers, ArrowLeft } from "lucide-react";
import type { Topic, ContentItem, LearningMaterialCategoryName, LearningMaterialCategoryDoc, ContentItemType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  getTopics,
  addTopic,
  updateTopic,
  deleteTopic,
  getContentItems,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  getLearningMaterialCategories,
  addLearningMaterialCategory,
} from "@/lib/firebase/firestore-service";
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


export default function LearningMaterialsPage() {
  // Data states
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<LearningMaterialCategoryDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI/Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LearningMaterialCategoryName | null>(null);

  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Dialog states
  const [dialogState, setDialogState] = useState({
    isAddCategoryOpen: false,
    isAddTopicOpen: false,
    isAddContentOpen: false,
    isViewerOpen: false,
    topicToEdit: null as Topic | null,
    topicForContent: null as Topic | null,
    itemToEdit: null as ContentItem | null,
    topicToDelete: null as Topic | null,
    viewerContent: { title: '', items: [] as ContentItem[], type: 'video' as ContentItemType, topic: null as Topic | null },
  });


  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTopics, fetchedContentItems, fetchedCategories] = await Promise.all([
        getTopics(),
        getContentItems(),
        getLearningMaterialCategories(),
      ]);

      // Group content items by topic
      const topicsWithContent = fetchedTopics.map(topic => ({
        ...topic,
        contentItems: fetchedContentItems.filter(item => item.topicId === topic.id),
      }));

      setTopics(topicsWithContent);
      setCategories(fetchedCategories);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- HANDLERS ---
  const handleSaveCategory = async (categoryName: string) => {
    try {
      await addLearningMaterialCategory(categoryName);
      toast({ title: "Category Added", description: `"${categoryName}" has been created.` });
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Adding Category", description: (error as Error).message });
    } finally {
      setDialogState(prev => ({ ...prev, isAddCategoryOpen: false }));
    }
  };

  const handleSaveTopic = async (formData: AddTopicFormValues, id?: string) => {
    const topicData = {
      title: formData.title,
      category: selectedCategory || formData.tags?.split(',')[0] || 'General', // Fallback category
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      tags: formData.tags?.split(',').map(s => s.trim()).filter(Boolean) || [],
      yearLevels: formData.yearLevels?.split(',').map(s => s.trim()).filter(Boolean) || [],
    };

    try {
      if (id) {
        await updateTopic(id, topicData);
        toast({ title: "Topic Updated", description: `"${topicData.title}" has been updated.` });
      } else {
        await addTopic(topicData);
        toast({ title: "Topic Added", description: `"${topicData.title}" has been added.` });
      }
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Topic", description: (error as Error).message });
    } finally {
      setDialogState(prev => ({ ...prev, isAddTopicOpen: false, topicToEdit: null }));
    }
  };

  const handleSaveContentItem = async (formData: AddContentItemFormValues, id?: string) => {
    if (!dialogState.topicForContent) return;

    const contentData = {
      ...formData,
      topicId: dialogState.topicForContent.id,
    };

    try {
      if (id) {
        await updateContentItem(id, contentData);
        toast({ title: "Content Updated", description: `"${contentData.title}" has been updated.` });
      } else {
        await addContentItem(contentData);
        toast({ title: "Content Added", description: `"${contentData.title}" has been added.` });
      }
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Content", description: (error as Error).message });
    } finally {
      setDialogState(prev => ({ ...prev, isAddContentOpen: false, itemToEdit: null, topicForContent: null }));
    }
  };
  
  const handleConfirmDeleteTopic = async () => {
    if (!dialogState.topicToDelete) return;
    try {
      await deleteTopic(dialogState.topicToDelete.id);
      toast({ title: "Topic Deleted", description: `"${dialogState.topicToDelete.title}" has been removed.` });
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Topic", description: (error as Error).message });
    } finally {
      setDialogState(prev => ({ ...prev, topicToDelete: null }));
    }
  };
  
  const handleDeleteContentItem = async (item: ContentItem) => {
     try {
      await deleteContentItem(item.id);
      toast({ title: "Content Deleted", description: `"${item.title}" has been removed.` });
      fetchAllData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Content", description: (error as Error).message });
    }
  };


  // --- DIALOG OPEN/CLOSE ---
  const openAddTopicDialog = () => setDialogState(prev => ({ ...prev, isAddTopicOpen: true, topicToEdit: null }));
  const openEditTopicDialog = (topic: Topic) => setDialogState(prev => ({ ...prev, isAddTopicOpen: true, topicToEdit: topic }));
  const openAddContentDialog = (topic: Topic) => setDialogState(prev => ({...prev, isAddContentOpen: true, itemToEdit: null, topicForContent: topic}));
  const openEditContentDialog = (item: ContentItem) => {
      const topic = topics.find(t => t.id === item.topicId);
      if (topic) {
          setDialogState(prev => ({...prev, isAddContentOpen: true, itemToEdit: item, topicForContent: topic}));
      }
  };
  const openDeleteTopicDialog = (topic: Topic) => setDialogState(prev => ({ ...prev, topicToDelete: topic }));

  const openContentLister = (topic: Topic, type: ContentItemType) => {
    setDialogState(prev => ({
      ...prev,
      isViewerOpen: true,
      viewerContent: {
        title: `${topic.title} - ${type.charAt(0).toUpperCase() + type.slice(1)}s`,
        items: topic.contentItems.filter(item => item.type === type),
        type,
        topic
      }
    }));
  };

  // --- MEMOIZED FILTERS ---
  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const searchLower = searchTerm.toLowerCase();
      const categoryMatch = !selectedCategory || topic.category === selectedCategory;
      const searchMatch = searchTerm === "" ||
        topic.title.toLowerCase().includes(searchLower) ||
        (topic.description && topic.description.toLowerCase().includes(searchLower)) ||
        (topic.tags && topic.tags.some(s => s.toLowerCase().includes(searchLower)));
      return categoryMatch && searchMatch;
    });
  }, [topics, searchTerm, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<LearningMaterialCategoryName, number> = {};
    categories.forEach(cat => counts[cat.name] = 0);
    topics.forEach(topic => {
        if(counts[topic.category] !== undefined) {
            counts[topic.category]++;
        }
    });
    return counts;
  }, [topics, categories]);

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
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
            {selectedCategory 
              ? `Showing topics in "${selectedCategory}"`
              : "Explore a comprehensive library of clinical skills resources, organized by category."
            }
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setDialogState(prev => ({...prev, isAddCategoryOpen: true}))} variant="outline" className="flex-1 sm:flex-initial">
              <Layers className="mr-2 h-5 w-5" /> New Category
            </Button>
            <Button onClick={openAddTopicDialog} className="flex-1 sm:flex-initial" disabled={!selectedCategory}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add Topic
            </Button>
          </div>
        )}
      </div>

      {/* --- DIALOGS --- */}
      {isAdmin && (
        <>
          <AddCategoryDialog
            isOpen={dialogState.isAddCategoryOpen}
            onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isAddCategoryOpen: isOpen }))}
            onSave={handleSaveCategory}
          />
          <AddTopicDialog
            isOpen={dialogState.isAddTopicOpen}
            onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isAddTopicOpen: isOpen }))}
            onSave={handleSaveTopic}
            currentTopic={dialogState.topicToEdit}
          />
          <AddContentItemDialog
            isOpen={dialogState.isAddContentOpen}
            onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isAddContentOpen: isOpen }))}
            onSave={handleSaveContentItem}
            currentItem={dialogState.itemToEdit}
            currentTopic={dialogState.topicForContent}
          />
          <AlertDialog open={!!dialogState.topicToDelete} onOpenChange={(isOpen) => !isOpen && setDialogState(prev => ({ ...prev, topicToDelete: null }))}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete the topic "{dialogState.topicToDelete?.title}" and all its content. This action cannot be undone.
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
      <ContentItemViewer
        isOpen={dialogState.isViewerOpen}
        onOpenChange={(isOpen) => setDialogState(prev => ({...prev, isViewerOpen: isOpen}))}
        title={dialogState.viewerContent.title}
        items={dialogState.viewerContent.items}
        topic={dialogState.viewerContent.topic!}
        isAdmin={isAdmin}
        onAddItem={() => openAddContentDialog(dialogState.viewerContent.topic!)}
        onEditItem={openEditContentDialog}
        onDeleteItem={handleDeleteContentItem}
      />


      {/* --- SEARCH AND FILTER --- */}
      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search topics, descriptions, or tags..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {selectedCategory && (
        <div className="mb-4">
          <Button onClick={() => setSelectedCategory(null)} variant="ghost" className="p-0 h-auto hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all categories
          </Button>
        </div>
      )}

      {/* --- MAIN CONTENT GRID --- */}
      {!selectedCategory ? (
        // Category View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <CategoryCard 
              key={category.id}
              categoryName={category.name}
              materialCount={categoryCounts[category.name] || 0}
              onCategoryClick={() => setSelectedCategory(category.name)}
            />
          ))}
        </div>
      ) : (
        // Topic View
        filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTopics.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic}
                onViewContent={openContentLister}
                onAddContent={isAdmin ? openAddContentDialog : undefined}
                onEditTopic={isAdmin ? openEditTopicDialog : undefined}
                onDeleteTopic={isAdmin ? openDeleteTopicDialog : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No Topics Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm
                ? "Your search did not match any topics in this category."
                : `There are no topics in "${selectedCategory}" yet. An admin can add the first one.`}
            </p>
          </div>
        )
      )}
    </div>
  );
}
    
    