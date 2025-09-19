
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Topic } from "@/lib/types";

const addTopicSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
  thumbnailUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  tags: z.string().optional(),
  yearLevels: z.string().optional(),
});

export type AddTopicFormValues = z.infer<typeof addTopicSchema>;

interface AddTopicDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddTopicFormValues, id?: string) => void;
  currentTopic?: Topic | null;
}

export function AddTopicDialog({ isOpen, onOpenChange, onSave, currentTopic }: AddTopicDialogProps) {
  const form = useForm<AddTopicFormValues>({
    resolver: zodResolver(addTopicSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnailUrl: "",
      tags: "",
      yearLevels: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentTopic) {
        form.reset({
          title: currentTopic.title,
          description: currentTopic.description || "",
          thumbnailUrl: currentTopic.thumbnailUrl || "",
          tags: currentTopic.tags?.join(', ') || "",
          yearLevels: currentTopic.yearLevels?.join(', ') || "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          thumbnailUrl: "",
          tags: "",
          yearLevels: "",
        });
      }
    }
  }, [isOpen, currentTopic, form]);

  const dialogTitle = currentTopic ? "Edit Topic" : "Add New Topic";
  const dialogDescription = currentTopic
    ? "Update the details for this learning topic."
    : "Create a new topic to house learning materials like videos and documents.";

  const handleSubmit = (values: AddTopicFormValues) => {
    onSave(values, currentTopic?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Arterial Blood Gas Sampling" {...field} />
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
                    <Textarea placeholder="A brief summary of the topic." {...field} />
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
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                   <FormDescription>A general image for the topic card.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags / Specialties (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Emergency Medicine, Respiratory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearLevels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable Year Levels (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3, 4, 5" {...field} />
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
                {form.formState.isSubmitting ? "Saving..." : "Save Topic"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
