"use client";

import type { LearningMaterial } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Youtube, FileText, Presentation, ExternalLink } from "lucide-react";
import Link from "next/link";

interface MaterialCardProps {
  material: LearningMaterial;
}

const categoryColors: Record<LearningMaterial['category'], string> = {
  "Early Clinical Exposure": "bg-blue-100 text-blue-700",
  "Focused Skill Station": "bg-green-100 text-green-700",
  "Physical Examination": "bg-purple-100 text-purple-700",
  "Procedural Skills": "bg-orange-100 text-orange-700",
  "Communication Skills": "bg-pink-100 text-pink-700",
};

export function MaterialCard({ material }: MaterialCardProps) {
  const Icon = material.type === 'video' ? Youtube : material.type === 'document' ? FileText : Presentation;
  const aiHint = material.type === 'video' ? "medical video" : material.type === 'document' ? "medical document" : "medical presentation";

  return (
    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={material.thumbnailUrl || `https://placehold.co/400x225.png?text=${encodeURIComponent(material.title)}`}
            alt={material.title}
            width={400}
            height={225}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            data-ai-hint={aiHint}
          />
        </div>
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${categoryColors[material.category] || 'bg-gray-100 text-gray-700'}`}>
          {material.category}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 line-clamp-2">{material.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {material.description || "No description available."}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Icon className="h-4 w-4 mr-1.5" />
          {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={material.url} target="_blank" rel="noopener noreferrer">
            View Material <ExternalLink className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
