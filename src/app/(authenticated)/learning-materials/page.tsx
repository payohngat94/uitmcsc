
"use client";

import { useState, useEffect } from "react";
import { mockLearningMaterials } from "@/lib/mock-data";
import { MaterialCard } from "@/components/learning-materials/material-card";
import { AddMaterialDialog } from "@/components/learning-materials/add-material-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen } from "lucide-react";
import type { LearningMaterial, LearningMaterialCategory, LearningMaterialType } from "@/lib/types";

const categories: LearningMaterialCategory[] = [
  "Early Clinical Exposure",
  "Focused Skill Station",
  "Physical Examination",
  "Procedural Skills",
  "Communication Skills",
];

const materialTypes: LearningMaterialType[] = ["video", "document", "slides"];

export default function LearningMaterialsPage() {
  const [materials, setMaterials] = useState<LearningMaterial[]>(mockLearningMaterials);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const handleAddNewMaterial = (newMaterialData: Omit<LearningMaterial, 'id'>) => {
    const newMaterial: LearningMaterial = {
      ...newMaterialData,
      id: `lm${Date.now()}`, // Simple unique ID generation
    };
    setMaterials(prevMaterials => [newMaterial, ...prevMaterials]);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearchTerm = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
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
        {/* TODO: Conditionally render this based on admin role */}
        <AddMaterialDialog onMaterialAdded={handleAddNewMaterial} />
      </div>

      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search materials by title or topic..." 
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
      
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No Materials Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria, or add new materials if you're an admin.
          </p>
        </div>
      )}
    </div>
  );
}
