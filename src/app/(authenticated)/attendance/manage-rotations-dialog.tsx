
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
import { getSpecialties, addRotation, updateRotation, deleteRotation } from "@/lib/firebase/firestore-service";
import type { Rotation } from "@/lib/types";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

const specialtySchema = z.object({
  name: z.string().min(3, "Specialty name is required."),
  locations: z.string().min(1, "At least one location is required."),
  stationNames: z.string().min(1, "At least one station name is required."),
});

type SpecialtyFormValues = z.infer<typeof specialtySchema>;

interface ManageRotationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRotationsUpdate: () => void;
}

export function ManageRotationsDialog({ isOpen, onOpenChange, onRotationsUpdate }: ManageRotationsDialogProps) {
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<Rotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<Rotation | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<Rotation | null>(null);

  const form = useForm<SpecialtyFormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: { name: "", locations: "", stationNames: "" },
  });

  const fetchSpecialties = async () => {
    setIsLoading(true);
    try {
      const fetchedSpecialties = await getSpecialties();
      setSpecialties(fetchedSpecialties);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch specialties." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSpecialties();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (isFormOpen) {
        if (specialtyToEdit) {
            form.reset({
                name: specialtyToEdit.name,
                locations: specialtyToEdit.locations.join(", "),
                stationNames: specialtyToEdit.stationNames.join(", "),
            });
        } else {
            form.reset({ name: "", locations: "", stationNames: "" });
        }
    }
  }, [isFormOpen, specialtyToEdit, form]);

  const handleOpenAddForm = () => {
    setSpecialtyToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (specialty: Rotation) => {
    setSpecialtyToEdit(specialty);
    setIsFormOpen(true);
  };

  const handleSaveSpecialty = async (values: SpecialtyFormValues) => {
    try {
      const stationNamesArray = values.stationNames.split(',').map(s => s.trim()).filter(Boolean);
      const locationsArray = values.locations.split(',').map(s => s.trim()).filter(Boolean);
      
      const specialtyData = {
          name: values.name,
          locations: locationsArray,
          stationNames: stationNamesArray
      };

      if (specialtyToEdit) {
        await updateRotation(specialtyToEdit.id, specialtyData);
        toast({ title: "Success", description: "Specialty updated." });
      } else {
        await addRotation(specialtyData);
        toast({ title: "Success", description: "New specialty created." });
      }
      
      fetchSpecialties();
      onRotationsUpdate(); // Notify parent to re-fetch data
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${specialtyToEdit ? 'update' : 'create'} specialty.` });
    }
  };

  const handleDeleteSpecialty = async () => {
    if (!specialtyToDelete) return;
    try {
      await deleteRotation(specialtyToDelete.id);
      toast({ title: "Success", description: `Specialty "${specialtyToDelete.name}" deleted.` });
      fetchSpecialties();
      onRotationsUpdate();
    } catch (error: any) {
        if (error.message.includes("permission-denied")) {
             toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete specialties. Please check Firestore rules." });
        } else {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete specialty." });
        }
    } finally {
      setSpecialtyToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Specialties</DialogTitle>
            <DialogDescription>Add, edit, or remove attendance specialties.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Button onClick={handleOpenAddForm}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Specialty
              </Button>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Specialty Name</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Stations</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialties.length > 0 ? specialties.map((specialty) => (
                      <TableRow key={specialty.id}>
                        <TableCell className="font-medium">{specialty.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {specialty.locations.map(loc => <Badge key={loc} variant="outline">{loc}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {specialty.stationNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(specialty.createdAt), "PP")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditForm(specialty)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSpecialtyToDelete(specialty)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No specialties found. Add one to get started.
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
                <DialogTitle>{specialtyToEdit ? 'Edit Specialty' : 'Create New Specialty'}</DialogTitle>
           </DialogHeader>
           <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveSpecialty)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Specialty Name</FormLabel><FormControl><Input placeholder="e.g. Emergency Medicine Year 5" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <Button type="submit">{specialtyToEdit ? 'Save Changes' : 'Create Specialty'}</Button>
                </DialogFooter>
              </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!specialtyToDelete} onOpenChange={() => setSpecialtyToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the specialty "{specialtyToDelete?.name}". This action cannot be undone and may affect past attendance records that reference it.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSpecialty} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
