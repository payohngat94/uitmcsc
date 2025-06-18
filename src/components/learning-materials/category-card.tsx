
"use client";

import type { LearningMaterialCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ChevronRight } from "lucide-react"; // Using Layers as a generic category icon

interface CategoryCardProps {
  categoryName: LearningMaterialCategory;
  materialCount: number;
  onClick: () => void;
}

// Helper to generate a placeholder color based on category name
const getCategoryColor = (categoryName: string) => {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "00000".substring(0, 6 - color.length) + color;
};


export function CategoryCard({ categoryName, materialCount, onClick }: CategoryCardProps) {
  const categoryColor = getCategoryColor(categoryName);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group bg-card"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold text-primary group-hover:text-primary/80 transition-colors">
          {categoryName}
        </CardTitle>
        <div 
          className="p-2 rounded-md"
          style={{ backgroundColor: `#${categoryColor}20` }} // Lighter version of the color
        >
          <Layers className="h-6 w-6" style={{ color: `#${categoryColor}` }} />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground mb-4">
          {materialCount} material{materialCount !== 1 ? 's' : ''} available in this category.
        </p>
        <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          View Materials <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

    