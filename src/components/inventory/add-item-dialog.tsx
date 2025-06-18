
"use client";

import { useEffect, useState, type ChangeEvent } from "react"; // Added useState and ChangeEvent
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryItem, InventoryItemStatus, InventoryItemType } from "@/lib/types";
import { uploadFileToFirebase } from "@/lib/firebase/firestore-service"; // Import upload function
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { UploadCloud, XCircle } from "lucide-react";

const itemStatuses: InventoryItemStatus[] = ['available', 'in-use', 'reserved', 'out-of-stock', 'maintenance'];
const itemTypes: InventoryItemType[] = ['facility', 'equipment'];

const inventoryItemSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  itemType: z.enum(itemTypes, { required_error: "Item type is required."}).default('equipment'),
  description: z.string().optional(),
  status: z.enum(itemStatuses, { required_error: "Status is required." }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }),
  imageUrl: z.string().url({ message: "Invalid URL."}).optional().or(z.literal('')), // Will store URL from Firebase Storage
  location: z.string().optional(),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem?: InventoryItem | null;
  onSave: (data: InventoryItemFormValues, id?: string) => void;
  defaultItemType?: InventoryItemType;
}

export function AddItemDialog({ isOpen, onOpenChange, currentItem, onSave, defaultItemType }: AddItemDialogProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      itemType: defaultItemType || 'equipment',
      description: "",
      status: 'available',
      quantity: 0,
      imageUrl: "", // Will be populated after upload or if editing existing item
      location: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (currentItem) {
        form.reset({
          name: currentItem.name,
          itemType: currentItem.itemType || defaultItemType || 'equipment',
          description: currentItem.description || "",
          status: currentItem.status,
          quantity: currentItem.quantity,
          imageUrl: currentItem.imageUrl || "",
          location: currentItem.location || "",
        });
        if (currentItem.imageUrl) {
          setPreviewUrl(currentItem.imageUrl);
        }
      } else {
        form.reset({
          name: "",
          itemType: defaultItemType || 'equipment',
          description: "",
          status: 'available',
          quantity: 0,
          imageUrl: "",
          location: "",
        });
      }
    }
  }, [isOpen, currentItem, form, defaultItemType]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: "destructive", title: "File too large", description: "Please select an image smaller than 5MB." });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: "Please select a JPG, PNG, WEBP, or GIF image." });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      form.setValue('imageUrl', ''); // Clear any existing imageUrl if a new file is selected
    }
  };

  const clearImageSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    form.setValue('imageUrl', ''); 
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  async function onSubmit(values: InventoryItemFormValues) {
    setIsUploading(true);
    let finalImageUrl = values.imageUrl; // Use existing URL if no new file and it's an edit

    if (selectedFile) {
      try {
        // Note: In a real app, path should be more unique, e.g., include userId or itemId if editing
        const filePath = `inventory_images/${selectedFile.name}_${Date.now()}`;
        const downloadURL = await uploadFileToFirebase(selectedFile, filePath);
        finalImageUrl = downloadURL;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Image Upload Failed",
          description: (error as Error).message || "Could not upload the image.",
        });
        setIsUploading(false);
        return;
      }
    }
    
    onSave({ ...values, imageUrl: finalImageUrl }, currentItem?.id);
    setIsUploading(false);
  }

  const dialogTitle = currentItem ? "Edit Item" : "Add New Item";
  const dialogDescriptionText = currentItem
    ? "Update the details for this item."
    : "Fill in the details for the new item.";
  const submitButtonText = currentItem ? "Save Changes" : "Add Item";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // Reset states when dialog is closed
         setSelectedFile(null);
         setPreviewUrl(null);
         setIsUploading(false);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescriptionComponent>
            {dialogDescriptionText}
          </DialogDescriptionComponent>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CPR Manikin Adult / Sim Lab A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemTypes.map(type => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the item..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemStatuses.map(stat => (
                          <SelectItem key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1).replace(/-/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>Item Image</FormLabel>
              <FormControl>
                <Input 
                  id="imageFile"
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              {previewUrl && (
                <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden">
                  <Image src={previewUrl} alt="Preview" layout="fill" objectFit="cover" data-ai-hint="image preview" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-0 right-0 bg-background/50 hover:bg-destructive/80 hover:text-destructive-foreground rounded-full h-6 w-6"
                    onClick={clearImageSelection}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!previewUrl && (
                <div className="mt-2 flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Click to browse or drag & drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to 5MB</p>
                    </div>
                </div>
              )}
              <FormDescription>
                Upload an image for the item (max 5MB).
              </FormDescription>
              <FormField name="imageUrl" control={form.control} render={() => <FormMessage />} />
            </FormItem>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sim Lab A, Storage Room 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                {isUploading ? "Uploading..." : form.formState.isSubmitting ? "Saving..." : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
