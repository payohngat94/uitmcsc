"use client";

import { useState, useEffect } from "react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getRotations, addRotation, updateRotation, deleteRotation } from "@/lib/firebase/firestore-service";
import type { Rotation } from "@/lib/types";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

const rotationSchema = z.object({
  name: z.string().min(3, "Rotation name is required."),
  locations: z.string().min(1, "At least one location is required."),
  stationNames: z.string().min(1, "At least one station name is required."),
});

type RotationFormValues = z.infer<typeof rotationSchema>;

interface ManageRotationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRotationsUpdate: () => void;
}

export function ManageRotationsDialog({ isOpen, onOpenChange, onRotationsUpdate }: ManageRotationsDialogProps) {
  const { toast } = useToast();
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rotationToEdit, setRotationToEdit] = useState<Rotation | null>(null);
  const [rotationToDelete, setRotationToDelete] = useState<Rotation | null>(null);

  const form = useForm<RotationFormValues>({
    resolver: zodResolver(rotationSchema),
    defaultValues: { name: "", locations: "", stationNames: "" },
  });

  const fetchRotations = async () => {
    setIsLoading(true);
    try {
      const fetchedRotations = await getRotations();
      setRotations(fetchedRotations);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch rotations." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRotations();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (isFormOpen) {
        if (rotationToEdit) {
            form.reset({
                name: rotationToEdit.name,
                locations: rotationToEdit.locations.join(", "),
                stationNames: rotationToEdit.stationNames.join(", "),
            });
        } else {
            form.reset({ name: "", locations: "", stationNames: "" });
        }
    }
  }, [isFormOpen, rotationToEdit, form]);

  const handleOpenAddForm = () => {
    setRotationToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (rotation: Rotation) => {
    setRotationToEdit(rotation);
    setIsFormOpen(true);
  };

  const handleSaveRotation = async (values: RotationFormValues) => {
    try {
      const stationNamesArray = values.stationNames.split(',').map(s => s.trim()).filter(Boolean);
      const locationsArray = values.locations.split(',').map(s => s.trim()).filter(Boolean);
      
      const rotationData = {
          name: values.name,
          locations: locationsArray,
          stationNames: stationNamesArray
      };

      if (rotationToEdit) {
        await updateRotation(rotationToEdit.id, rotationData);
        toast({ title: "Success", description: "Rotation updated." });
      } else {
        await addRotation(rotationData);
        toast({ title: "Success", description: "New rotation created." });
      }
      
      fetchRotations();
      onRotationsUpdate(); // Notify parent to re-fetch data
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${rotationToEdit ? 'update' : 'create'} rotation.` });
    }
  };

  const handleDeleteRotation = async () => {
    if (!rotationToDelete) return;
    try {
      await deleteRotation(rotationToDelete.id);
      toast({ title: "Success", description: `Rotation "${rotationToDelete.name}" deleted.` });
      fetchRotations();
      onRotationsUpdate();
    } catch (error: any) {
        if (error.message.includes("permission-denied")) {
             toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete rotations. Please check Firestore rules." });
        } else {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete rotation." });
        }
    } finally {
      setRotationToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Rotations</DialogTitle>
            <DialogDescription>Add, edit, or remove attendance rotations.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Button onClick={handleOpenAddForm}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Rotation
              </Button>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rotation Name</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Stations</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rotations.length > 0 ? rotations.map((rotation) => (
                      <TableRow key={rotation.id}>
                        <TableCell className="font-medium">{rotation.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rotation.locations.map(loc => <Badge key={loc} variant="outline">{loc}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rotation.stationNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(rotation.createdAt), "PP")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditForm(rotation)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setRotationToDelete(rotation)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No rotations found. Add one to get started.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Form Dialog (for add/edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
           <DialogHeader>
                <DialogTitle>{rotationToEdit ? 'Edit Rotation' : 'Create New Rotation'}</DialogTitle>
           </DialogHeader>
           <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveRotation)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Rotation Name</FormLabel><FormControl><Input placeholder="e.g. Emergency Medicine Year 5" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="stationNames" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Station Names</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g. Suturing, Basic Airway, IV Cannulation" {...field} />
                        </FormControl>
                        <FormDescription>
                            Enter multiple station names separated by a comma.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="locations" render={({ field }) => (
                  <FormItem><FormLabel>Locations</FormLabel><FormControl><Input placeholder="e.g. Sim Lab B, Ward 5A" {...field} /></FormControl>
                  <FormDescription>
                    Enter multiple locations separated by a comma.
                  </FormDescription>
                  <FormMessage />
                  </FormItem>
                )}/>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit">{rotationToEdit ? 'Save Changes' : 'Create Rotation'}</Button>
                </DialogFooter>
              </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!rotationToDelete} onOpenChange={() => setRotationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the rotation "{rotationToDelete?.name}". This action cannot be undone and may affect past attendance records that reference it.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRotation} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
