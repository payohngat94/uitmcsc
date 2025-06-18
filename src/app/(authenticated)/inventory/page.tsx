
"use client";

import { useState, useEffect, useMemo } from "react";
import { InventoryItemRow } from "@/components/inventory/inventory-item-row";
import { InventoryItemDetailDialog } from "@/components/inventory/inventory-item-detail-dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ListFilter, Archive } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import type { InventoryItem, InventoryItemStatus } from "@/lib/types";
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/firebase/firestore-service";
import { AddItemDialog, type InventoryItemFormValues } from "@/components/inventory/add-item-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const itemStatuses: InventoryItemStatus[] = ['all', 'available', 'in-use', 'reserved', 'out-of-stock', 'maintenance'];

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<InventoryItemStatus | "all">("all");

  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  // const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null); // For future edit functionality
  // const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null); // For future delete functionality


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

  const handleOpenAddItemDialog = () => {
    // setItemToEdit(null);
    setIsAddItemDialogOpen(true);
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

    const urlsArray = formData.imageUrls
      ? formData.imageUrls.split(',').map(url => url.trim()).filter(url => {
          try { new URL(url); return true; } catch { return false; }
        })
      : [];

    const itemDataForDb = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      quantity: formData.quantity,
      imageUrls: urlsArray,
      location: formData.location,
    };

    try {
      if (id) {
        // await updateInventoryItem(id, itemDataForDb); // For edit functionality
        // toast({ title: "Item Updated", description: `"${itemDataForDb.name}" updated.` });
      } else {
        await addInventoryItem(itemDataForDb);
        toast({ title: "Item Added", description: `"${itemDataForDb.name}" added to inventory.` });
      }
      fetchInventory(); // Refresh the list
    } catch (error) {
      toast({
        variant: "destructive",
        title: id ? "Error Updating Item" : "Error Adding Item",
        description: (error instanceof Error && error.message) || "An unexpected error occurred.",
      });
    } finally {
      setIsAddItemDialogOpen(false);
      // setItemToEdit(null);
    }
  };

  const filteredInventory = useMemo(() => {
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


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Facilities and Equipment</h1>
        <p className="text-muted-foreground">
          Browse available simulation equipment, check their status, and make loan requests.
        </p>
      </div>

      {currentUser?.role === 'admin' && (
        <AddItemDialog
          isOpen={isAddItemDialogOpen}
          onOpenChange={setIsAddItemDialogOpen}
          // currentItem={itemToEdit} // For edit functionality
          onSave={handleSaveItem}
        />
      )}

      <InventoryItemDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        item={selectedItemForDetail}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Available Equipment</CardTitle>
              <CardDescription>
                Find the tools you need for your clinical practice. Click item name for details.
              </CardDescription>
            </div>
            {currentUser?.role === 'admin' && (
              <Button onClick={handleOpenAddItemDialog} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
              </Button>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search equipment..."
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
          ) : filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Name</TableHead>
                    <TableHead className="text-center min-w-[120px]">Status</TableHead>
                    <TableHead className="text-center min-w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      onViewDetails={handleOpenDetailDialog}
                      // onEdit={currentUser?.role === 'admin' ? () => {} : undefined} // Placeholder for edit
                      // onDelete={currentUser?.role === 'admin' ? () => {} : undefined} // Placeholder for delete
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-12">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Equipment Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || selectedStatusFilter !== "all"
                  ? "No equipment matches your current filters."
                  : "The inventory is currently empty. Admins can add new items."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
