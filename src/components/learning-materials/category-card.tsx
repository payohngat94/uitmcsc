
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";

interface CategoryCardProps {
  categoryName: string;
  materialCount: number;
  onCategoryClick: (categoryName: string) => void;
}

export function CategoryCard({ categoryName, materialCount, onCategoryClick }: CategoryCardProps) {
  return (
    <Card 
      className="group hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer"
      onClick={() => onCategoryClick(categoryName)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCategoryClick(categoryName)}
      tabIndex={0}
      role="button"
      aria-label={`View topics in ${categoryName}`}
    >
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl text-primary font-bold group-hover:underline">{categoryName}</CardTitle>
        <Layers className="h-8 w-8 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{materialCount} {materialCount === 1 ? 'topic' : 'topics'} available in this category.</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full justify-start p-0">
            View Topics &rarr;
        </Button>
      </CardFooter>
    </Card>
  );
}
    