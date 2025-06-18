
"use client";

import type { InventoryItem } from "@/lib/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface InventoryItemRowProps {
  item: InventoryItem;
  onViewDetails?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

const statusVariant: Record<InventoryItem['status'], "default" | "secondary" | "destructive" | "outline"> = {
  available: "default", 
  "in-use": "secondary", 
  reserved: "outline", 
  "out-of-stock": "destructive", 
  maintenance: "destructive", 
};

const statusColors: Record<InventoryItem['status'], string> = {
  available: "bg-green-500 hover:bg-green-600",
  "in-use": "bg-blue-500 hover:bg-blue-600",
  reserved: "bg-yellow-500 text-black hover:bg-yellow-600",
  "out-of-stock": "bg-red-500 hover:bg-red-500",
  maintenance: "bg-gray-500 hover:bg-gray-600",
};

const PRIMARY_PLACEHOLDER = "https://placehold.co/40x40.png?text=No+Img";
const ERROR_PLACEHOLDER = "https://placehold.co/40x40.png?text=Error";

export function InventoryItemRow({ item, onViewDetails, onEdit, onDelete }: InventoryItemRowProps) {
  const [imageSrc, setImageSrc] = useState(PRIMARY_PLACEHOLDER);

  useEffect(() => {
    const firstUrl = item.imageUrls?.[0]?.trim();
    const newSrc = firstUrl || PRIMARY_PLACEHOLDER;
    
    console.log(`[InventoryItemRow] Item: "${item.name}" item.imageUrls: ${JSON.stringify(item.imageUrls)} Attempting to use first URL: "${firstUrl}" Image src set to: "${newSrc}"`);

    setImageSrc(newSrc);
  }, [item.imageUrls, item.name]);

  const aiHint = item.itemType === 'facility' ? "facility thumbnail" : "equipment thumbnail";

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <Image
            key={imageSrc} 
            src={imageSrc}
            alt={item.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
            data-ai-hint={aiHint}
            unoptimized={true} 
            onError={() => {
              console.warn(
                `[InventoryItemRow] next/image component failed to load image for "${item.name}". ` +
                `This is often due to external server policies (e.g., CORS, hotlinking protection) or an invalid URL. ` +
                `Attempted src: "${imageSrc}". ` +
                `Attempted firstUrl from data: "${item.imageUrls?.[0]?.trim()}". ` +
                `Falling back to error placeholder.`
              );
              if (imageSrc !== ERROR_PLACEHOLDER) { 
                setImageSrc(ERROR_PLACEHOLDER);
              }
            }}
          />
          <div>
            <div 
              className="font-medium hover:underline cursor-pointer" 
              onClick={() => onViewDetails?.(item)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetails?.(item);}}
              role="button"
              tabIndex={0}
            >
              {item.name}
            </div>
            {item.location && <div className="text-xs text-muted-foreground">{item.location}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={statusVariant[item.status]} className={`${statusColors[item.status]} text-white`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/-/g, ' ')}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{item.quantity}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end items-center gap-1">
          {/* Request button and dialog removed */}
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
      </TableCell>
    </TableRow>
  );
}
