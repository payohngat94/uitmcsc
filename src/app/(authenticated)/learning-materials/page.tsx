
"use client";

import { useState, useEffect } from "react";
// mockLearningMaterials removed
import { MaterialCard } from "@/components/learning-materials/material-card";
import { AddMaterialDialog, type AddMaterialFormValues } from "@/components/learning-materials/add-material-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, PlusCircle, Loader2 } from "lucide-react"; // Added Loader2
import type { LearningMaterial, LearningMaterialCategory, LearningMaterialType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getLearningMaterials, addLearningMaterial, updateLearningMaterial, deleteLearningMaterial } from "@/lib/firebase/firestore-service"; // Firestore service
import { Skeleton } from "@/components/ui/skeleton"; // For loading skeleton

const categories: LearningMaterialCategory[] = [
  "Early Clinical Exposure",
  "Focused Skill Station",
  "Physical Examination",
  "Procedural Skills",
  "Communication Skills",
];

const materialTypes: LearningMaterialType[] = ["video", "document", "slides"];

export default function LearningMaterialsPage() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<LearningMaterial | null>(null);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const fetchedMaterials = await getLearningMaterials();
      setMaterials(fetchedMaterials);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching materials",
        description: "Could not load learning materials from the database.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleOpenAddDialog = () => {
    setMaterialToEdit(null);
    setIsMaterialDialogOpen(true);
  };

  const handleOpenEditDialog = (material: LearningMaterial) => {
    setMaterialToEdit(material);
    setIsMaterialDialogOpen(true);
  };

  const handleSaveMaterial = async (formData: AddMaterialFormValues, id?: string) => {
    const parsedSpecialties = formData.specialties
      ? formData.specialties.split(',').map(s => s.trim()).filter(s => s)
      : [];

    // Ensure thumbnailUrl is not an empty string if it's optional and not provided
    const thumbnailUrl = formData.thumbnailUrl?.trim() === '' ? undefined : formData.thumbnailUrl;

    const materialDataForDb = {
      title: formData.title,
      category: formData.category,
      type: formData.type,
      url: formData.url,
      description: formData.description,
      thumbnailUrl: thumbnailUrl,
      specialties: parsedSpecialties,
    };

    try {
      if (id) { // Editing existing material
        await updateLearningMaterial(id, materialDataForDb);
        toast({
          title: "Material Updated",
          description: `"${materialDataForDb.title}" has been successfully updated.`,
        });
      } else { // Adding new material
        await addLearningMaterial(materialDataForDb);
        toast({
          title: "Material Added",
          description: `"${materialDataForDb.title}" has been successfully added.`,
        });
      }
      fetchMaterials(); // Re-fetch materials to show changes
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
      toast({
        variant: "destructive",
        title: "Material Deleted",
        description: `"${materialToDelete.title}" has been removed.`,
      });
      fetchMaterials(); // Re-fetch materials
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Deleting Material",
        description: (error as Error).message || "Could not delete the material.",
      });
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearchTerm = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (material.specialties && material.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === "all" || material.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    const matchesType = selectedType === "all" || material.type === selectedType;
    return matchesSearchTerm && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2">Learning Materials</h1>
          <p className="text-muted-foreground">
            Explore a comprehensive library of videos, documents, and presentations to enhance your clinical skills.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Material
          </Button>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <AddMaterialDialog
          isOpen={isMaterialDialogOpen}
          onOpenChange={setIsMaterialDialogOpen}
          currentMaterial={materialToEdit}
          onSave={handleSaveMaterial}
        />
      )}

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search materials by title, topic, or specialty..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader className="p-0 relative">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between items-center">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-8 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
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
            Try adjusting your search or filter criteria. If you're an admin, you can add new materials.
          </p>
        </div>
      )}
    </div>
  );
}

// Need to import Card, CardHeader, CardContent, CardFooter for Skeleton example
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
