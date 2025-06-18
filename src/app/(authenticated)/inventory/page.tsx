
"use client";

import * as React from "react"; 
import { useState, useEffect, useMemo } from "react";
import { InventoryItemRow } from "@/components/inventory/inventory-item-row";
import { InventoryItemDetailDialog } from "@/components/inventory/inventory-item-detail-dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ListFilter, Archive, Building, Package, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/contexts/auth-context";
import type { InventoryItem, InventoryItemStatus, InventoryItemType } from "@/lib/types";
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/firebase/firestore-service";
import { AddItemDialog, type InventoryItemFormValues } from "@/components/inventory/add-item-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription as ShadCNAlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";


const itemStatuses: InventoryItemStatus[] = ['all', 'available', 'in-use', 'reserved', 'out-of-stock', 'maintenance'];

// IMPORTANT: Replace this with your actual Google Form link for booking/requesting inventory items.
const INVENTORY_BOOKING_FORM_URL = "YOUR_GOOGLE_FORM_LINK_HERE";

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<InventoryItemStatus | "all">("all");

  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [defaultItemTypeForDialog, setDefaultItemTypeForDialog] = useState<InventoryItemType>('equipment');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);


  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await getInventoryItems();
      setInventory(fetchedItems);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching inventory",
        description: (error instanceof Error && error.message) || "Could not load inventory items.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAddItemDialog = (itemType: InventoryItemType) => {
    setItemToEdit(null);
    setDefaultItemTypeForDialog(itemType);
    setIsAddItemDialogOpen(true);
  };
  
  const handleOpenEditDialog = (item: InventoryItem) => {
    setItemToEdit(item);
    setDefaultItemTypeForDialog(item.itemType || 'equipment');
    setIsAddItemDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: InventoryItem) => {
    setSelectedItemForDetail(null); 
    setIsDetailDialogOpen(false);
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !currentUser || currentUser.role !== 'admin') return;
    try {
      await deleteInventoryItem(itemToDelete.id); 
      toast({
        title: "Item Deleted",
        description: `"${itemToDelete.name}" has been removed.`,
      });
      fetchInventory(); 
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Deleting Item",
        description: (error instanceof Error && error.message) || "Could not delete the item.",
      });
    } finally {
      setItemToDelete(null);
    }
  };


  const handleOpenDetailDialog = (item: InventoryItem) => {
    setSelectedItemForDetail(item);
    setIsDetailDialogOpen(true);
  };

  const handleSaveItem = async (formData: InventoryItemFormValues, id?: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ variant: "destructive", title: "Not Authorized", description: "Only admins can manage inventory." });
      return;
    }
    
    const itemDataForDb = {
      name: formData.name,
      itemType: formData.itemType,
      description: formData.description,
      status: formData.status,
      quantity: formData.quantity,
      imageUrls: formData.imageUrls || [],
      location: formData.location,
    };
    
    console.log("[InventoryPage] handleSaveItem - itemDataForDb.imageUrls before save:", itemDataForDb.imageUrls);

    try {
      if (id) { 
        await updateInventoryItem(id, itemDataForDb); 
        toast({ title: "Item Updated", description: `"${itemDataForDb.name}" updated.` });
      } else { 
        await addInventoryItem(itemDataForDb);
        toast({ title: "Item Added", description: `"${itemDataForDb.name}" added to inventory.` });
      }
      fetchInventory(); 
    } catch (error) {
      toast({
        variant: "destructive",
        title: id ? "Error Updating Item" : "Error Adding Item",
        description: (error instanceof Error && error.message) || "An unexpected error occurred.",
      });
    } finally {
      setIsAddItemDialogOpen(false);
      setItemToEdit(null);
    }
  };

  const globallyFilteredItems = useMemo(() => {
    return inventory.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" ||
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower));

      const matchesStatus = selectedStatusFilter === "all" || item.status === selectedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchTerm, selectedStatusFilter]);

  const facilityItems = useMemo(() => {
    return globallyFilteredItems.filter(item => item.itemType === 'facility');
  }, [globallyFilteredItems]);

  const equipmentItems = useMemo(() => {
    return globallyFilteredItems.filter(item => item.itemType === 'equipment' || !item.itemType); 
  }, [globallyFilteredItems]);


  const renderInventorySection = (
    title: string,
    icon: React.ElementType,
    items: InventoryItem[],
    itemTypeForAdding: InventoryItemType,
    emptyStateMessage: string,
    emptyStateFilterMessage: string
  ) => (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center">
              {React.createElement(icon, { className: "mr-3 h-7 w-7 text-primary"})}
              {title}
            </CardTitle>
            <CardDescription>
              Browse available {title.toLowerCase()}. Click item name for details.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={INVENTORY_BOOKING_FORM_URL} target="_blank" rel="noopener noreferrer">
                 Book {itemTypeForAdding === 'facility' ? 'Facility' : 'Equipment'} <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {currentUser?.role === 'admin' && (
              <Button onClick={() => handleOpenAddItemDialog(itemTypeForAdding)} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New {itemTypeForAdding === 'facility' ? 'Facility' : 'Equipment'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2 border-b">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Name</TableHead>
                  <TableHead className="text-center min-w-[120px]">Status</TableHead>
                  <TableHead className="text-center min-w-[100px]">Quantity</TableHead>
                  <TableHead className="text-right min-w-[120px]">Actions</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    onViewDetails={handleOpenDetailDialog}
                    onEdit={currentUser?.role === 'admin' ? () => handleOpenEditDialog(item) : undefined}
                    onDelete={currentUser?.role === 'admin' ? () => handleOpenDeleteDialog(item) : undefined}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
           <div className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No {title} Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || selectedStatusFilter !== "all"
                ? emptyStateFilterMessage
                : emptyStateMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Facilities and Equipment</h1>
        <p className="text-muted-foreground">
          Browse available facilities and simulation equipment, check their status, and manage inventory. 
          Use the "Book" buttons to request items via our Google Form.
        </p>
      </div>

      {INVENTORY_BOOKING_FORM_URL === "YOUR_GOOGLE_FORM_LINK_HERE" && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <ShadCNAlertTitle className="font-semibold text-yellow-800">Action Required</ShadCNAlertTitle>
          <ShadCNAlertDescription>
            Please update the `INVENTORY_BOOKING_FORM_URL` placeholder in the code 
            (`src/app/(authenticated)/inventory/page.tsx`) with your actual Google Form link for item bookings.
          </ShadCNAlertDescription>
        </Alert>
      )}

      {currentUser?.role === 'admin' && (
        <AddItemDialog
          isOpen={isAddItemDialogOpen}
          onOpenChange={setIsAddItemDialogOpen}
          onSave={handleSaveItem}
          defaultItemType={defaultItemTypeForDialog}
          currentItem={itemToEdit}
        />
      )}

      <InventoryItemDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        item={selectedItemForDetail}
        isAdmin={currentUser?.role === 'admin'}
        onDeleteItem={selectedItemForDetail ? () => handleOpenDeleteDialog(selectedItemForDetail) : undefined}
      />
      
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="sticky top-0 md:top-16 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:-mx-8 md:px-8 rounded-b-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedStatusFilter} onValueChange={(value) => setSelectedStatusFilter(value as InventoryItemStatus | "all")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {itemStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderInventorySection(
        "List of Facilities",
        Building,
        facilityItems,
        "facility",
        "The inventory is currently empty of facilities. Admins can add new facilities.",
        "No facilities match your current filters."
      )}

      {renderInventorySection(
        "Available Equipment",
        Package,
        equipmentItems,
        "equipment",
        "The inventory is currently empty of equipment. Admins can add new equipment.",
        "No equipment matches your current filters."
      )}
      
    </div>
  );
}
