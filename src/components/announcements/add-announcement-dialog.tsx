
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { Announcement, UserRole } from "@/lib/types";

const audienceRoles: UserRole[] = ['student', 'admin', 'guest']; // Added 'guest'

const announcementSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  isPinned: z.boolean().default(false),
  audience: z.array(z.enum(audienceRoles)).default(['student']), 
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AddAnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentAnnouncement?: Omit<Announcement, 'authorId' | 'authorName' | 'createdAt' | 'updatedAt'> & { id?: string }; // Simplified for form
  onSave: (data: AnnouncementFormValues, id?: string) => void;
}

export function AddAnnouncementDialog({ isOpen, onOpenChange, currentAnnouncement, onSave }: AddAnnouncementDialogProps) {
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      isPinned: false,
      audience: ['student'], // Default audience for new announcements in UI
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (currentAnnouncement) {
        form.reset({
          title: currentAnnouncement.title,
          content: currentAnnouncement.content,
          isPinned: currentAnnouncement.isPinned || false,
          audience: currentAnnouncement.audience || ['student'],
        });
      } else {
        form.reset({
          title: "",
          content: "",
          isPinned: false,
          audience: ['student'],
        });
      }
    }
  }, [isOpen, currentAnnouncement, form]);

  const dialogTitle = currentAnnouncement ? "Edit Announcement" : "Create New Announcement";
  const dialogDescription = currentAnnouncement
    ? "Update the details for the announcement. Click save when you're done."
    : "Fill in the details for the new announcement. Click save when you're done.";
  const submitButtonText = currentAnnouncement ? "Save Changes" : "Create Announcement";

  async function onSubmit(values: AnnouncementFormValues) {
    onSave(values, currentAnnouncement?.id);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upcoming OSCE Schedule" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed information about the announcement..."
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audience"
              render={() => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <div className="space-y-2">
                  {audienceRoles.map((role) => (
                    <FormField
                      key={role}
                      control={form.control}
                      name="audience"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), role])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {role.charAt(0).toUpperCase() + role.slice(1)}s
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Pin Announcement</FormLabel>
                    <DialogDescription className="text-xs">
                      Pinned announcements appear at the top of the list.
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
