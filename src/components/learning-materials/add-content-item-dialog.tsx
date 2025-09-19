
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
import type { Topic, ContentItem, ContentItemType } from "@/lib/types";

const contentItemTypes: ContentItemType[] = ["video", "document", "slides"];

const addContentItemSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  type: z.enum(contentItemTypes, { required_error: "Type is required."}),
  url: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().optional(),
  thumbnailUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export type AddContentItemFormValues = z.infer<typeof addContentItemSchema>;

interface AddContentItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddContentItemFormValues, id?: string) => void;
  currentTopic: Topic | null;
  currentItem?: ContentItem | null;
}

export function AddContentItemDialog({ isOpen, onOpenChange, onSave, currentTopic, currentItem }: AddContentItemDialogProps) {
  const form = useForm<AddContentItemFormValues>({
    resolver: zodResolver(addContentItemSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      thumbnailUrl: "",
      type: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentItem) {
        form.reset({
          title: currentItem.title,
          type: currentItem.type,
          url: currentItem.url,
          description: currentItem.description || "",
          thumbnailUrl: currentItem.thumbnailUrl || "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          url: "",
          thumbnailUrl: "",
          type: undefined,
        });
      }
    }
  }, [isOpen, currentItem, form]);

  const dialogTitle = currentItem ? "Edit Content Item" : "Add New Content Item";
  const dialogDescription = `Adding/editing content for topic: "${currentTopic?.title}"`;

  const handleSubmit = (values: AddContentItemFormValues) => {
    onSave(values, currentItem?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                  <FormLabel>Content Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABG Interpretation Basics" {...field} />
                  </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!!currentItem}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contentItemTypes.map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!!currentItem && <FormDescription>Type cannot be changed after creation.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/watch?v=... or Google Doc link" {...field} />
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
                  <FormLabel>Specific Thumbnail URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Overrides topic thumbnail for this item" {...field} />
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
                    <Textarea placeholder="A brief summary of this specific content item." {...field} />
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
                {form.formState.isSubmitting ? "Saving..." : "Save Content"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    