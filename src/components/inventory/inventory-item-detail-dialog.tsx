
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { InventoryItem, InventoryItemStatus, InventoryItemType } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Package, Tag, MapPin, BarChart, Info } from "lucide-react";
import { useState, useEffect } from "react"; // Added useState and useEffect

// Consistent status styling with InventoryItemRow
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

const DetailImage = ({ src, alt, itemType }: { src: string; alt: string; itemType?: InventoryItemType }) => {
  const DIALOG_ERROR_PLACEHOLDER = "https://placehold.co/200x150.png?text=Not+Found";
  const [currentImageSrc, setCurrentImageSrc] = useState(src);
  const aiHint = itemType === 'facility' ? "facility detail image" : "equipment detail image";

  useEffect(() => {
    setCurrentImageSrc(src); // Reset image src if the prop changes
  }, [src]);

  return (
    <Image
      src={currentImageSrc}
      alt={alt}
      width={200}
      height={150}
      className="h-[150px] w-auto max-w-[200px] rounded-md object-cover border shadow-sm"
      data-ai-hint={aiHint}
      unoptimized={true} // Added unoptimized prop
      onError={() => {
        if (currentImageSrc !== DIALOG_ERROR_PLACEHOLDER) {
          setCurrentImageSrc(DIALOG_ERROR_PLACEHOLDER);
        }
      }}
    />
  );
};


export function InventoryItemDetailDialog({ isOpen, onOpenChange, item }: InventoryItemDetailDialogProps) {
  if (!item) return null;

  const formattedStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/-/g, ' ');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center">
            <Package className="h-7 w-7 mr-3 text-primary" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto pr-2 -mr-2">
          <div className="py-4 space-y-5">
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
            
            {item.imageUrls && item.imageUrls.length > 0 && (
              <div className="space-y-1">
                <h4 className="font-medium">Images:</h4>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-secondary/30">
                  <div className="flex space-x-4 p-4">
                    {item.imageUrls.map((url, index) => (
                      <div key={index} className="flex-shrink-0">
                        <DetailImage
                          src={url}
                          alt={`${item.name} image ${index + 1}`}
                          itemType={item.itemType}
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
            {(!item.imageUrls || item.imageUrls.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No images available for this item.</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {/* Could add a "Request Item" button here too if desired */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
