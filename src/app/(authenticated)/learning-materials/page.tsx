
"use client";

import { useState, useEffect, useMemo } from "react";
import { MaterialCard } from "@/components/learning-materials/material-card";
import { AddMaterialDialog, type AddMaterialFormValues } from "@/components/learning-materials/add-material-dialog";
import { AddCategoryDialog } from "@/components/learning-materials/add-category-dialog"; // New dialog
import { CategoryCard } from "@/components/learning-materials/category-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, PlusCircle, ArrowLeft, Layers, Tag, ListX, LayoutGrid } from "lucide-react";
import type { LearningMaterial, LearningMaterialCategoryDoc, LearningMaterialType, LearningMaterialCategoryName } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getLearningMaterials, addLearningMaterial, updateLearningMaterial, deleteLearningMaterial, getLearningMaterialCategories } from "@/lib/firebase/firestore-service"; // Added getLearningMaterialCategories
import { Skeleton } from "@/components/ui/skeleton";
import { Card as ShadCNCard, CardContent as ShadCNCardContent, CardHeader as ShadCNCardHeader, CardFooter as ShadCNCardFooter } from "@/components/ui/card";

const materialTypes: LearningMaterialType[] = ["video", "document", "slides"];

export default function LearningMaterialsPage() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<LearningMaterialCategoryDoc[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>("all");
  const [selectedCategoryView, setSelectedCategoryView] = useState<LearningMaterialCategoryName | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("");

  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<LearningMaterial | null>(null);

  const fetchAllData = async () => {
    setIsLoadingMaterials(true);
    setIsLoadingCategories(true);
    try {
      const [fetchedMaterialsData, fetchedCategoriesData] = await Promise.all([
        getLearningMaterials(),
        getLearningMaterialCategories()
      ]);
      setMaterials(fetchedMaterialsData);
      setFetchedCategories(fetchedCategoriesData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: (error instanceof Error && error.message) ? error.message : "Could not load learning materials or categories.",
      });
    } finally {
      setIsLoadingMaterials(false);
      setIsLoadingCategories(false);
    }
  };
  
  const fetchJustCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const fetchedCategoriesData = await getLearningMaterialCategories();
      setFetchedCategories(fetchedCategoriesData);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error fetching categories",
        description: (error instanceof Error && error.message) ? error.message : "Could not load categories.",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  }


  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenAddMaterialDialog = () => {
    setMaterialToEdit(null);
    setIsMaterialDialogOpen(true);
  };
  
  const handleOpenAddCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  const handleOpenEditDialog = (material: LearningMaterial) => {
    setMaterialToEdit(material);
    setIsMaterialDialogOpen(true);
  };

  const handleSaveMaterial = async (formData: AddMaterialFormValues, id?: string) => {
    const parsedSpecialties = formData.specialties
      ? formData.specialties.split(',').map(s => s.trim()).filter(s => s)
      : [];
    const thumbnailUrl = formData.thumbnailUrl?.trim() === '' ? undefined : formData.thumbnailUrl;

    const materialDataForDb = {
      title: formData.title,
      // Ensure category is set, prioritize form if available, else from selectedCategoryView
      category: formData.category || (selectedCategoryView as LearningMaterialCategoryName),
      type: formData.type,
      url: formData.url,
      description: formData.description,
      thumbnailUrl: thumbnailUrl,
      specialties: parsedSpecialties,
    };

    try {
      if (id) {
        await updateLearningMaterial(id, materialDataForDb);
        toast({ title: "Material Updated", description: `"${materialDataForDb.title}" updated.` });
      } else {
        await addLearningMaterial(materialDataForDb);
        toast({ title: "Material Added", description: `"${materialDataForDb.title}" added.` });
      }
      fetchAllData(); 
    } catch (error) {
      toast({
        variant: "destructive",
        title: id ? "Error Updating Material" : "Error Adding Material",
        description: (error as Error).message || "An unexpected error occurred.",
      });
    } finally {
      setIsMaterialDialogOpen(false);
      setMaterialToEdit(null);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const materialToDelete = materials.find(m => m.id === id);
    if (!materialToDelete) return;
    try {
      await deleteLearningMaterial(id);
      toast({ variant: "default", title: "Material Deleted", description: `"${materialToDelete.title}" removed.` });
      fetchAllData(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error Deleting Material", description: (error as Error).message || "Could not delete." });
    }
  };

  const isGlobalFilterActive = useMemo(() => {
    return searchTerm.trim() !== "" || selectedTag.trim() !== "" || selectedMaterialType !== "all";
  }, [searchTerm, selectedTag, selectedMaterialType]);

  const globallyFilteredMaterials = useMemo(() => {
    // Only compute if no category is selected AND global filters are active.
    if (selectedCategoryView || !isGlobalFilterActive) return []; 
    
    return materials.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const tagLower = selectedTag.toLowerCase();

      const matchesSearchTerm = searchTerm.trim() === "" ||
                                material.title.toLowerCase().includes(searchLower) ||
                                (material.description && material.description.toLowerCase().includes(searchLower));
      
      const matchesType = selectedMaterialType === "all" || material.type === selectedMaterialType;

      const matchesTag = selectedTag.trim() === "" ||
                         (material.specialties && material.specialties.some(s => s.toLowerCase().includes(tagLower)));
      
      return matchesSearchTerm && matchesType && matchesTag;
    });
  }, [materials, searchTerm, selectedMaterialType, selectedTag, isGlobalFilterActive, selectedCategoryView]);
  
  const materialsBySelectedCategory = useMemo(() => {
    if (!selectedCategoryView) return [];
    return materials.filter(material => material.category === selectedCategoryView);
  }, [materials, selectedCategoryView]);

  const categoryScopedFilteredMaterials = useMemo(() => {
    // Only compute if a category IS selected.
    if (!selectedCategoryView) return [];

    return materialsBySelectedCategory.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const tagLower = selectedTag.toLowerCase();

      // Filters apply within the selected category
      const matchesSearchTerm = searchTerm.trim() === "" ||
                                material.title.toLowerCase().includes(searchLower) ||
                                (material.description && material.description.toLowerCase().includes(searchLower));
      
      const matchesType = selectedMaterialType === "all" || material.type === selectedMaterialType;

      const matchesTag = selectedTag.trim() === "" ||
                         (material.specialties && material.specialties.some(s => s.toLowerCase().includes(tagLower)));
      
      return matchesSearchTerm && matchesType && matchesTag;
    });
  }, [materialsBySelectedCategory, searchTerm, selectedMaterialType, selectedCategoryView, selectedTag]);

  const categoryCounts = useMemo(() => {
    const counts: Record<LearningMaterialCategoryName, number> = (fetchedCategories || []).reduce((acc, catDoc) => {
      acc[catDoc.name] = 0;
      return acc;
    }, {} as Record<LearningMaterialCategoryName, number>);
    
    materials.forEach(material => {
      if (material.category && counts[material.category] !== undefined) {
        counts[material.category]++;
      }
    });
    return counts;
  }, [materials, fetchedCategories]);

  const handleCategorySelect = (categoryName: LearningMaterialCategoryName) => {
    setSelectedCategoryView(categoryName);
    // Optionally reset filters when changing category, or keep them
    // setSearchTerm("");
    // setSelectedTag("");
    // setSelectedMaterialType("all");
  };

  const handleClearFiltersAndShowCategories = () => {
    setSelectedCategoryView(null);
    setSearchTerm("");
    setSelectedMaterialType("all");
    setSelectedTag("");
  };

  const getPageSubHeader = () => {
    if (selectedCategoryView) {
      return `Browsing materials for "${selectedCategoryView}". Found ${categoryScopedFilteredMaterials.length} item(s).`;
    }
    if (isGlobalFilterActive) {
      return `Showing global search results. Found ${globallyFilteredMaterials.length} material(s).`;
    }
    return "Explore a comprehensive library by category or search all materials using the filters below.";
  };
  
  const isLoading = isLoadingMaterials || isLoadingCategories;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-72 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          {currentUser?.role === 'admin' && <div className="flex gap-2"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-40" /></div>}
        </div>
        <Skeleton className="h-12 w-full rounded-lg mb-4" /> 
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ShadCNCard key={i} className="flex flex-col h-full">
              <ShadCNCardHeader className="p-0 relative">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
              </ShadCNCardHeader>
              <ShadCNCardContent className="p-4 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/4" />
              </ShadCNCardContent>
              <ShadCNCardFooter className="p-4 border-t flex justify-between items-center">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-8 w-1/3" />
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
            {getPageSubHeader()}
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleOpenAddCategoryDialog} className="w-full sm:w-auto" variant="outline">
              <LayoutGrid className="mr-2 h-5 w-5" /> Add Category
            </Button>
            <Button onClick={handleOpenAddMaterialDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Material
            </Button>
          </div>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <>
          <AddMaterialDialog
            isOpen={isMaterialDialogOpen}
            onOpenChange={setIsMaterialDialogOpen}
            currentMaterial={materialToEdit}
            onSave={handleSaveMaterial}
            availableCategories={fetchedCategories}
          />
          <AddCategoryDialog
            isOpen={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
            onCategoryAdded={() => {
              fetchJustCategories(); 
            }}
          />
        </>
      )}

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm space-y-4">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search titles, descriptions..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
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
          <Select value={selectedMaterialType} onValueChange={setSelectedMaterialType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {materialTypes.map(type => (
                 <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedCategoryView && (
        <Button variant="outline" onClick={handleClearFiltersAndShowCategories} className="mb-6 w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Categories & Clear Filters
        </Button>
      )}

      {!selectedCategoryView && isGlobalFilterActive && (
        <Button variant="outline" onClick={handleClearFiltersAndShowCategories} className="mb-6 w-full sm:w-auto">
          <ListX className="mr-2 h-4 w-4" /> Clear Search & View Categories
        </Button>
      )}

      {/* Main Content Area */}
      {selectedCategoryView ? (
        // Viewing materials within a category
        categoryScopedFilteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryScopedFilteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={currentUser?.role === 'admin' ? handleDeleteMaterial : undefined}
                onEdit={currentUser?.role === 'admin' ? handleOpenEditDialog : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Materials Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No materials match your current filters in "{selectedCategoryView}".
            </p>
          </div>
        )
      ) : isGlobalFilterActive ? (
        // Viewing global search results
        globallyFilteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {globallyFilteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={currentUser?.role === 'admin' ? handleDeleteMaterial : undefined}
                onEdit={currentUser?.role === 'admin' ? handleOpenEditDialog : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Materials Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your global search did not match any learning materials. Try different keywords or filters.
            </p>
          </div>
        )
      ) : (
        // Viewing category list (no category selected, no global filters active)
        fetchedCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetchedCategories.map(categoryDoc => (
              <CategoryCard
                key={categoryDoc.id}
                categoryName={categoryDoc.name}
                materialCount={categoryCounts[categoryDoc.name] || 0}
                onClick={() => handleCategorySelect(categoryDoc.name)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Categories Defined</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Admins can add new categories using the "Add Category" button above.
            </p>
          </div>
        )
      )}
    </div>
  );
}
