
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LearningMaterial, LearningMaterialCategoryDoc, LearningMaterialType, LearningMaterialCategoryName } from "@/lib/types";

// const categories: LearningMaterialCategory[] = [ // Removed hardcoded categories
//   "Early Clinical Exposure",
//   "Focused Skill Station",
//   "Physical Examination",
//   "Procedural Skills",
//   "Communication Skills",
// ];
const materialTypes: LearningMaterialType[] = ["video", "document", "slides"];

const addMaterialSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  category: z.string().min(1, { message: "Category is required." }), // Changed from z.enum
  type: z.enum(materialTypes, { required_error: "Type is required."}),
  url: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().optional(),
  thumbnailUrl: z.string().url({ message: "Please enter a valid URL for the thumbnail." }).optional().or(z.literal('')),
  specialties: z.string().optional(), 
});

export type AddMaterialFormValues = z.infer<typeof addMaterialSchema>;

interface AddMaterialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentMaterial?: LearningMaterial | null;
  onSave: (data: AddMaterialFormValues, id?: string) => void;
  availableCategories: LearningMaterialCategoryDoc[]; // Added prop for dynamic categories
}

export function AddMaterialDialog({ isOpen, onOpenChange, currentMaterial, onSave, availableCategories }: AddMaterialDialogProps) {
  const form = useForm<AddMaterialFormValues>({
    resolver: zodResolver(addMaterialSchema),
    defaultValues: {
      title: "",
      category: undefined, // Ensure category is undefined initially if no currentMaterial
      description: "",
      url: "",
      thumbnailUrl: "",
      specialties: "",
      type: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentMaterial) {
        form.reset({
          ...currentMaterial,
          category: currentMaterial.category as LearningMaterialCategoryName, // Ensure type compatibility
          specialties: currentMaterial.specialties?.join(', ') || "",
        });
      } else {
        form.reset({
          title: "",
          category: undefined,
          type: undefined,
          url: "",
          description: "",
          thumbnailUrl: "",
          specialties: "",
        });
      }
    }
  }, [isOpen, currentMaterial, form]);

  const dialogTitle = currentMaterial ? "Edit Learning Material" : "Add New Learning Material";
  const dialogDescription = currentMaterial 
    ? "Update the details for the learning material. Click save when you're done."
    : "Fill in the details for the new learning material. Click save when you're done.";
  const submitButtonText = currentMaterial ? "Save Changes" : "Add Material";

  async function onSubmit(values: AddMaterialFormValues) {
    onSave(values, currentMaterial?.id);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Suturing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.length === 0 && <SelectItem value="loading" disabled>Loading categories...</SelectItem>}
                        {availableCategories.map(catDoc => (
                          <SelectItem key={catDoc.id} value={catDoc.name}>{catDoc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialTypes.map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/material.pdf or YouTube URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/thumbnail.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialties (comma-separated, optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paediatric, Internal Medicine" {...field} />
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
                      placeholder="A brief summary of the learning material..."
                      className="resize-none"
                      {...field}
                    />
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
