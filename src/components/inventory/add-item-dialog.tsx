
"use client";

import { useEffect } from "react";
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

const itemStatuses: InventoryItemStatus[] = ['available', 'in-use', 'reserved', 'out-of-stock', 'maintenance'];
const itemTypes: InventoryItemType[] = ['facility', 'equipment'];

const inventoryItemSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  itemType: z.enum(itemTypes, { required_error: "Item type is required."}).default('equipment'),
  description: z.string().optional(),
  status: z.enum(itemStatuses, { required_error: "Status is required." }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }),
  imageUrls: z.string().optional(), // String for comma-separated URLs from textarea
  location: z.string().optional(),
});

export type InventoryItemFormValues = Omit<z.infer<typeof inventoryItemSchema>, 'imageUrls'> & {
  imageUrls?: string[]; // Parsed array for saving
};

// Type for the form data itself, where imageUrls is a string
type DialogFormValues = z.infer<typeof inventoryItemSchema>;


interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem?: InventoryItem | null;
  onSave: (data: InventoryItemFormValues, id?: string) => void; // Expects parsed array
  defaultItemType?: InventoryItemType;
}

export function AddItemDialog({ isOpen, onOpenChange, currentItem, onSave, defaultItemType }: AddItemDialogProps) {
  const form = useForm<DialogFormValues>({ // Use DialogFormValues for form
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      itemType: defaultItemType || 'equipment',
      description: "",
      status: 'available',
      quantity: 0,
      imageUrls: "", // Initialize as empty string for textarea
      location: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentItem) {
        form.reset({
          name: currentItem.name,
          itemType: currentItem.itemType || defaultItemType || 'equipment',
          description: currentItem.description || "",
          status: currentItem.status,
          quantity: currentItem.quantity,
          imageUrls: currentItem.imageUrls?.join(', ') || "", // Join array to string for textarea
          location: currentItem.location || "",
        });
      } else {
        form.reset({
          name: "",
          itemType: defaultItemType || 'equipment',
          description: "",
          status: 'available',
          quantity: 0,
          imageUrls: "",
          location: "",
        });
      }
    }
  }, [isOpen, currentItem, form, defaultItemType]);

  async function onSubmit(values: DialogFormValues) { // Receives DialogFormValues
    const parsedImageUrls = values.imageUrls
      ? values.imageUrls.split(',').map(url => url.trim()).filter(url => url)
      : [];
    
    const dataToSave: InventoryItemFormValues = {
      ...values,
      imageUrls: parsedImageUrls,
    };
    onSave(dataToSave, currentItem?.id);
  }

  const dialogTitle = currentItem ? "Edit Item" : "Add New Item";
  const dialogDescriptionText = currentItem
    ? "Update the details for this item."
    : "Fill in the details for the new item.";
  const submitButtonText = currentItem ? "Save Changes" : "Add Item";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URLs (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="https://example.com/image1.png, https://example.com/image2.jpg"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste full image URLs, separated by commas. The first image will be used as the thumbnail.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
