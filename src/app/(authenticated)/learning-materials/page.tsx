
"use client";

import { useState, useEffect, useMemo } from "react";
import { MaterialCard } from "@/components/learning-materials/material-card";
import { AddMaterialDialog, type AddMaterialFormValues } from "@/components/learning-materials/add-material-dialog";
import { CategoryCard } from "@/components/learning-materials/category-card";
import { AddCategoryDialog } from "@/components/learning-materials/add-category-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, PlusCircle, Layers } from "lucide-react";
import type { LearningMaterial, LearningMaterialCategoryName, LearningMaterialCategoryDoc } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  getLearningMaterials, 
  addLearningMaterial,
  updateLearningMaterial,
  deleteLearningMaterial,
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
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [categories, setCategories] = useState<LearningMaterialCategoryDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LearningMaterialCategoryName | null>(null);

  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<LearningMaterial | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<LearningMaterial | null>(null);

  const fetchMaterialsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [fetchedMaterials, fetchedCategories] = await Promise.all([
        getLearningMaterials(),
        getLearningMaterialCategories(),
      ]);
      setMaterials(fetchedMaterials);
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
    fetchMaterialsAndCategories();
  }, []);

  const handleOpenAddMaterialDialog = (categoryName?: LearningMaterialCategoryName) => {
    setMaterialToEdit(null);
    if(categoryName) setSelectedCategory(categoryName);
    setIsAddMaterialDialogOpen(true);
  };

  const handleOpenEditMaterialDialog = (material: LearningMaterial) => {
    setMaterialToEdit(material);
    setIsAddMaterialDialogOpen(true);
  };
  
  const handleOpenDeleteMaterialDialog = (material: LearningMaterial) => {
    setMaterialToDelete(material);
  }

  const handleSaveMaterial = async (formData: AddMaterialFormValues, id?: string) => {
    const materialData = {
      title: formData.title,
      category: formData.category,
      type: formData.type,
      url: formData.url,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      specialties: formData.specialties?.split(',').map(s => s.trim()).filter(Boolean) || [],
    };

    try {
      if (id) {
        await updateLearningMaterial(id, materialData);
        toast({ title: "Material Updated", description: `"${materialData.title}" has been updated.` });
      } else {
        await addLearningMaterial(materialData);
        toast({ title: "Material Added", description: `"${materialData.title}" has been added.` });
      }
      fetchMaterialsAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Material", description: (error as Error).message });
    } finally {
      setIsAddMaterialDialogOpen(false);
      setMaterialToEdit(null);
    }
  };
  
  const handleSaveCategory = async (categoryName: string) => {
    try {
      await addLearningMaterialCategory(categoryName);
      toast({ title: "Category Added", description: `"${categoryName}" has been created.`});
      fetchMaterialsAndCategories(); // Refresh data
    } catch (error) {
       toast({ variant: "destructive", title: "Error Adding Category", description: (error as Error).message });
    } finally {
      setIsAddCategoryDialogOpen(false);
    }
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      await deleteLearningMaterial(materialToDelete.id);
      toast({ title: "Material Deleted", description: `"${materialToDelete.title}" has been removed.` });
      fetchMaterialsAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Material", description: (error as Error).message });
    } finally {
      setMaterialToDelete(null);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const categoryMatch = !selectedCategory || material.category === selectedCategory;
      const searchMatch = searchTerm === "" ||
        material.title.toLowerCase().includes(searchLower) ||
        (material.description && material.description.toLowerCase().includes(searchLower)) ||
        (material.specialties && material.specialties.some(s => s.toLowerCase().includes(searchLower)));
      return categoryMatch && searchMatch;
    });
  }, [materials, searchTerm, selectedCategory]);

  const displayedCategories = useMemo(() => {
    if (selectedCategory) {
      return categories.filter(c => c.name === selectedCategory);
    }
    return categories;
  }, [categories, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          {currentUser?.role === 'admin' && <Skeleton className="h-10 w-40" />}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
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
            Explore a comprehensive library of clinical skills resources, organized by topic.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setIsAddCategoryDialogOpen(true)} variant="outline" className="flex-1 sm:flex-initial">
              <Layers className="mr-2 h-5 w-5" /> New Category
            </Button>
            <Button onClick={() => handleOpenAddMaterialDialog()} className="flex-1 sm:flex-initial">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Material
            </Button>
          </div>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <>
          <AddMaterialDialog
            isOpen={isAddMaterialDialogOpen}
            onOpenChange={setIsAddMaterialDialogOpen}
            onSave={handleSaveMaterial}
            currentMaterial={materialToEdit}
            categories={categories.map(c => c.name)}
            defaultCategory={selectedCategory || undefined}
          />
          <AddCategoryDialog
            isOpen={isAddCategoryDialogOpen}
            onOpenChange={setIsAddCategoryDialogOpen}
            onSave={handleSaveCategory}
          />
           <AlertDialog open={!!materialToDelete} onOpenChange={() => setMaterialToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the material "{materialToDelete?.title}".
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDeleteMaterial} className="bg-destructive hover:bg-destructive/90">
                      Delete Material
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search materials, descriptions, or specialties..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {selectedCategory && (
        <div className="mb-8">
          <Button onClick={() => setSelectedCategory(null)} variant="link" className="p-0">
            &larr; Back to all categories
          </Button>
        </div>
      )}

      {displayedCategories.length > 0 ? (
        <div className="space-y-10">
          {displayedCategories.map(category => {
            const categoryMaterials = filteredMaterials.filter(m => m.category === category.name);
            return (
              <section key={category.id}>
                <CategoryCard 
                  categoryName={category.name}
                  materialCount={categoryMaterials.length}
                  onCategoryClick={() => setSelectedCategory(category.name)}
                />
                
                {categoryMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                    {categoryMaterials.map((material) => (
                      <MaterialCard 
                        key={material.id} 
                        material={material} 
                        onEdit={currentUser?.role === 'admin' ? () => handleOpenEditMaterialDialog(material) : undefined}
                        onDelete={currentUser?.role === 'admin' ? () => handleOpenDeleteMaterialDialog(material) : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 ml-6 text-sm text-muted-foreground">
                    <p>No materials found in this category for your current search.</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Materials Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm
              ? "Your search did not match any materials. Try a different keyword."
              : "There are no materials yet. An admin can add the first one."}
          </p>
        </div>
      )}
    </div>
  );
}

    