import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { inventoryApi, menuItemsApi, type MenuItemResponse } from "@/lib/api";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&h=120&fit=crop";

export default function MenuManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const qc = useQueryClient();
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<MenuItemResponse | null>(null);
  const [restockQty, setRestockQty] = useState("1");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: menuItemsApi.getMenuItems,
    staleTime: 10_000,
  });

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) => x.name.toLowerCase().includes(q) || x.categoryName.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const restockMutation = useMutation({
    mutationFn: (p: { itemId: string; quantity: number }) =>
      inventoryApi.restock({ itemId: p.itemId, quantity: p.quantity }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Stock updated", description: "Inventory quantity increased." });
      setRestockOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Restock failed";
      toast({ title: "Restock failed", description: msg, variant: "destructive" });
    },
  });
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage food items, prices, and stock availability.
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Item
        </Button>
      </div>
      
      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search food items by name, category..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
      </div>
      
      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Image</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Item Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Category</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Price</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Inventory</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                  No items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl ?? FALLBACK_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.isActive ? "Active" : "Inactive"}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge className="bg-muted text-foreground">{item.categoryName}</Badge>
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatVND(item.price)}
                </td>
                <td className="px-6 py-4">
                  <span className={item.inventoryQuantity > 0 ? "text-primary text-sm font-medium" : "text-destructive text-sm font-medium"}>
                    {item.inventoryQuantity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRestockItem(item);
                        setRestockQty("1");
                        setRestockOpen(true);
                      }}
                    >
                      Add Stock
                    </Button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {filteredItems.length} item(s)</p>
        </div>
      </div>

      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Increase inventory quantity for <span className="font-medium">{restockItem?.name ?? ""}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 10"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!restockItem) return;
                const qty = Math.floor(Number(restockQty));
                if (!Number.isFinite(qty) || qty <= 0) {
                  toast({ title: "Invalid quantity", description: "Please enter a positive number.", variant: "destructive" });
                  return;
                }
                restockMutation.mutate({ itemId: restockItem.id, quantity: qty });
              }}
              disabled={restockMutation.isPending || !restockItem}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
