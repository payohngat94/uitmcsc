import { mockInventoryItems } from "@/lib/mock-data";
import { InventoryItemRow } from "@/components/inventory/inventory-item-row";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function InventoryPage() {
  // In a real app, search and filter state would be managed here
  const items = mockInventoryItems;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Equipment Inventory</h1>
        <p className="text-muted-foreground">
          Browse available simulation equipment, check their status, and make loan requests.
        </p>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Available Equipment</CardTitle>
              <CardDescription>
                Find the tools you need for your clinical practice.
              </CardDescription>
            </div>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Item (Admin)
            </Button>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search equipment..." className="pl-10 w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                 <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
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
                  {items.map((item) => (
                    <InventoryItemRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-12">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Equipment Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The inventory is currently empty or your search/filter yielded no results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
