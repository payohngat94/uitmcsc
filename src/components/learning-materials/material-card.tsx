
"use client";

import type { LearningMaterial } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Youtube, FileText, Presentation, ExternalLink, Trash2, Tag, Pencil } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface MaterialCardProps {
  material: LearningMaterial;
  onDelete: (id: string) => void;
  onEdit: (material: LearningMaterial) => void;
}

const categoryColors: Record<LearningMaterial['category'], string> = {
  "Early Clinical Exposure": "bg-blue-100 text-blue-700",
  "Focused Skill Station": "bg-green-100 text-green-700",
  "Physical Examination": "bg-purple-100 text-purple-700",
  "Procedural Skills": "bg-orange-100 text-orange-700",
  "Communication Skills": "bg-pink-100 text-pink-700",
};

export function MaterialCard({ material, onDelete, onEdit }: MaterialCardProps) {
  const Icon = material.type === 'video' ? Youtube : material.type === 'document' ? FileText : Presentation;
  const aiHint = material.type === 'video' ? "medical video" : material.type === 'document' ? "medical document" : "medical presentation";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    onDelete(material.id);
    setIsDeleteDialogOpen(false);
  };

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
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {material.description || "No description available."}
        </CardDescription>
        {material.specialties && material.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {material.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />{specialty}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Icon className="h-4 w-4 mr-1.5" />
          {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={material.url} target="_blank" rel="noopener noreferrer">
              View <ExternalLink className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the learning material titled "{material.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
