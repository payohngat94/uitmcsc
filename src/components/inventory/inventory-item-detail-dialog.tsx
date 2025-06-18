
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { InventoryItem, InventoryItemStatus, InventoryItemType } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Package, Tag, MapPin, BarChart, Info, ImageOff, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface InventoryItemDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  isAdmin?: boolean;
  onDeleteItem?: (item: InventoryItem) => void; // Changed from () => void to (item: InventoryItem) => void
}

const statusColors: Record<InventoryItemStatus, string> = {
  available: "bg-green-500 hover:bg-green-600",
  "in-use": "bg-blue-500 hover:bg-blue-600",
  reserved: "bg-yellow-500 text-black hover:bg-yellow-600",
  "out-of-stock": "bg-red-500 hover:bg-red-600",
  maintenance: "bg-gray-500 hover:bg-gray-600",
};
const statusVariant: Record<InventoryItemStatus, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  "in-use": "secondary",
  reserved: "outline",
  "out-of-stock": "destructive",
  maintenance: "destructive",
};

const DIALOG_IMAGE_PLACEHOLDER = "https://placehold.co/300x200.png?text=Image+Not+Available";
const DIALOG_IMAGE_ERROR_PLACEHOLDER = "https://placehold.co/300x200.png?text=Error+Loading";


interface ItemImageDisplayProps {
  srcProp: string | undefined;
  alt: string;
  itemType: InventoryItem['itemType'];
  itemName: string;
}
function ItemImageDisplay({ srcProp, alt, itemType, itemName }: ItemImageDisplayProps) {
  const [currentSrc, setCurrentSrc] = useState(srcProp?.trim() || DIALOG_IMAGE_PLACEHOLDER);
  const aiHint = itemType === 'facility' ? "facility detail image" : "equipment detail image";

  useEffect(() => {
    const newSrc = srcProp?.trim() || DIALOG_IMAGE_PLACEHOLDER;
    setCurrentSrc(newSrc);
    console.log(`[ItemImageDisplay] Item: ${itemName}, Alt: ${alt}, Initial src for Image component: ${newSrc}`);
  }, [srcProp, alt, itemName]);

  return (
    <div className="relative w-full aspect-[3/2] rounded-md overflow-hidden border shadow-sm bg-muted flex-shrink-0">
      <Image
        key={currentSrc} // Added key prop
        src={currentSrc}
        alt={alt}
        fill 
        className="object-contain p-1" 
        data-ai-hint={aiHint}
        unoptimized={true}
        onError={() => {
          console.error(`[ItemImageDisplay] Error loading image for ${itemName}, alt: ${alt}, attempted src: ${srcProp}`);
          if (currentSrc !== DIALOG_IMAGE_ERROR_PLACEHOLDER) {
            setCurrentSrc(DIALOG_IMAGE_ERROR_PLACEHOLDER);
          }
        }}
      />
    </div>
  );
}


export function InventoryItemDetailDialog({ isOpen, onOpenChange, item, isAdmin, onDeleteItem }: InventoryItemDetailDialogProps) {
  if (!item) return null;

  const formattedStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/-/g, ' ');
  
  const handleDeleteClick = () => {
    if (onDeleteItem) {
      onDeleteItem(item);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center">
            <Package className="h-7 w-7 mr-3 text-primary" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow py-4 pr-2 -mr-2">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Status:</strong>
                <Badge variant={statusVariant[item.status]} className={`ml-2 ${statusColors[item.status]} text-white`}>
                  {formattedStatus}
                </Badge>
              </div>
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Quantity:</strong>
                <span className="ml-2">{item.quantity}</span>
              </div>
              {item.location && (
                <div className="flex items-center md:col-span-2">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <strong>Location:</strong>
                  <span className="ml-2">{item.location}</span>
                </div>
              )}
            </div>

            {item.description && (
              <div className="space-y-1">
                <h4 className="font-medium flex items-center"><Info className="h-4 w-4 mr-2 text-muted-foreground"/>Description:</h4>
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">{item.description}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">Images:</h4>
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex space-x-4 pb-4">
                    {item.imageUrls.map((url, index) => (
                      <div key={index} className="w-[240px] sm:w-[300px]">
                        <ItemImageDisplay 
                          srcProp={url} 
                          alt={`${item.name} - Image ${index + 1}`} 
                          itemType={item.itemType}
                          itemName={item.name} 
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                 <div className="flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 p-6 rounded-md h-48">
                    <ImageOff className="h-10 w-10 mb-2" />
                    <p className="text-sm">No images provided for this item.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t mt-auto flex justify-between items-center">
          <div>
            {isAdmin && onDeleteItem && (
              <Button variant="destructive" onClick={handleDeleteClick} className="mr-2">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
