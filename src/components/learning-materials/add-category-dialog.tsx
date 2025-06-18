
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
import { useToast } from "@/hooks/use-toast";
import { addLearningMaterialCategory } from "@/lib/firebase/firestore-service";

const addCategorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }).max(50, { message: "Category name must be 50 characters or less."}),
});

export type AddCategoryFormValues = z.infer<typeof addCategorySchema>;

interface AddCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void; // Callback to refresh category list
}

export function AddCategoryDialog({ isOpen, onOpenChange, onCategoryAdded }: AddCategoryDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddCategoryFormValues>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: "" });
    }
  }, [isOpen, form]);

  async function onSubmit(values: AddCategoryFormValues) {
    try {
      await addLearningMaterialCategory(values.name);
      toast({
        title: "Category Added",
        description: `Category "${values.name}" has been successfully added.`,
      });
      onCategoryAdded(); // Trigger refresh
      onOpenChange(false); // Close dialog
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Adding Category",
        description: (error instanceof Error && error.message) ? error.message : "Could not add category.",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Learning Category</DialogTitle>
          <DialogDescription>
            Enter the name for the new category. This will be available when adding or editing learning materials.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cardiology Simulations" {...field} />
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
                {form.formState.isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
