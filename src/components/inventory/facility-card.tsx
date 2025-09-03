
"use client";

import type { InventoryItem } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface FacilityCardProps {
  item: InventoryItem;
  onViewDetails?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

const PRIMARY_PLACEHOLDER = "https://placehold.co/300x200.png?text=No+Image";
const ERROR_PLACEHOLDER = "https://placehold.co/300x200.png?text=Error";

export function FacilityCard({ item, onViewDetails, onEdit, onDelete }: FacilityCardProps) {
  const [imageSrc, setImageSrc] = useState(PRIMARY_PLACEHOLDER);

  useEffect(() => {
    const firstUrl = item.imageUrls?.[0]?.trim();
    const newSrc = firstUrl || PRIMARY_PLACEHOLDER;
    setImageSrc(newSrc);
  }, [item.imageUrls]);

  const aiHint = "facility thumbnail";

  return (
    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300 ease-in-out group">
      <div 
        className="relative aspect-video overflow-hidden rounded-t-lg cursor-pointer"
        onClick={() => onViewDetails?.(item)}
      >
        <Image
          key={imageSrc}
          src={imageSrc}
          alt={item.name}
          fill
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={aiHint}
          unoptimized={true}
          onError={() => {
            if (imageSrc !== ERROR_PLACEHOLDER) {
              setImageSrc(ERROR_PLACEHOLDER);
            }
          }}
        />
      </div>
      <CardContent 
        className="p-4 flex-grow cursor-pointer"
        onClick={() => onViewDetails?.(item)}
      >
        <h3 className="font-semibold text-base line-clamp-2">{item.name}</h3>
        {item.location && <p className="text-sm text-muted-foreground">{item.location}</p>}
      </CardContent>
      {(onEdit || onDelete) && (
        <CardFooter className="p-2 border-t mt-auto">
          <div className="flex justify-end items-center gap-1 w-full">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => onDelete(item)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
