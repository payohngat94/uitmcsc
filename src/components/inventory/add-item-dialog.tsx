
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionComponent, // Renamed to avoid conflict with FormDescription
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription, // Added FormDescription to import
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryItem, InventoryItemStatus } from "@/lib/types";

const itemStatuses: InventoryItemStatus[] = ['available', 'in-use', 'reserved', 'out-of-stock', 'maintenance'];

const inventoryItemSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  description: z.string().optional(),
  status: z.enum(itemStatuses, { required_error: "Status is required." }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }),
  imageUrls: z.string().optional(), // Comma-separated URLs
  location: z.string().optional(),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem?: InventoryItem | null;
  onSave: (data: InventoryItemFormValues, id?: string) => void;
}

export function AddItemDialog({ isOpen, onOpenChange, currentItem, onSave }: AddItemDialogProps) {
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      description: "",
      status: 'available',
      quantity: 0,
      imageUrls: "",
      location: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentItem) {
        form.reset({
          name: currentItem.name,
          description: currentItem.description || "",
          status: currentItem.status,
          quantity: currentItem.quantity,
          imageUrls: currentItem.imageUrls?.join(', ') || "",
          location: currentItem.location || "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
          status: 'available',
          quantity: 0,
          imageUrls: "",
          location: "",
        });
      }
    }
  }, [isOpen, currentItem, form]);

  const dialogTitle = currentItem ? "Edit Inventory Item" : "Add New Inventory Item";
  const dialogDescriptionText = currentItem // Renamed variable to avoid conflict
    ? "Update the details for this inventory item."
    : "Fill in the details for the new inventory item.";
  const submitButtonText = currentItem ? "Save Changes" : "Add Item";

  async function onSubmit(values: InventoryItemFormValues) {
    onSave(values, currentItem?.id);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescriptionComponent> {/* Use renamed import */}
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
                    <Input placeholder="e.g., CPR Manikin Adult" {...field} />
                  </FormControl>
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
                      placeholder="Enter image URLs, separated by commas (e.g., https://url1.com/image.png, https://url2.com/image.jpg)" 
                      className="resize-y min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide one or more image URLs, separated by commas.
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
