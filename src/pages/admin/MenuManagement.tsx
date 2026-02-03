import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { categoriesApi, inventoryApi, menuItemsApi, type MenuItemResponse } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&h=120&fit=crop";

export default function MenuManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formPrice, setFormPrice] = useState("");
  const [formInventory, setFormInventory] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [formImageFiles, setFormImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const qc = useQueryClient();
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<MenuItemResponse | null>(null);
  const [restockQty, setRestockQty] = useState("1");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
    staleTime: 30_000,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: menuItemsApi.getMenuItems,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!editOpen) return;
    if (!formCategoryId && categories.length > 0) {
      setFormCategoryId(categories[0].id);
    }
  }, [categories, editOpen, formCategoryId]);

  useEffect(() => {
    // revoke old previews
    for (const u of imagePreviewUrls) URL.revokeObjectURL(u);
    if (formImageFiles.length === 0) {
      setImagePreviewUrls([]);
      return;
    }
    const urls = formImageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formImageFiles]);

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

  const createMutation = useMutation({
    mutationFn: menuItemsApi.createMenuItem,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Created", description: "Menu item created." });
      setEditOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Create failed";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (p: { id: string; body: Parameters<typeof menuItemsApi.updateMenuItem>[1] }) =>
      menuItemsApi.updateMenuItem(p.id, p.body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Updated", description: "Menu item updated." });
      setEditOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.deleteMenuItem(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: "Deleted", description: "Menu item deleted." });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditMode("create");
    setEditingItem(null);
    setFormName("");
    setFormPrice("");
    setFormInventory("0");
    setFormIsActive(true);
    setFormImageUrls([]);
    setFormImageFiles([]);
    setFormCategoryId(categories[0]?.id ?? "");
    setEditOpen(true);
  };

  const openEdit = (item: MenuItemResponse) => {
    setEditMode("edit");
    setEditingItem(item);
    setFormName(item.name);
    setFormCategoryId(item.categoryId);
    setFormPrice(String(item.price));
    setFormInventory(String(item.inventoryQuantity));
    setFormIsActive(Boolean(item.isActive));
    setFormImageUrls((item.imageUrls ?? []).filter(Boolean) as string[]);
    if ((item.imageUrls?.length ?? 0) === 0 && item.imageUrl) setFormImageUrls([item.imageUrl]);
    setFormImageFiles([]);
    setEditOpen(true);
  };

  const handlePickImage = () => fileRef.current?.click();

  const handleImagesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please choose image files only.", variant: "destructive" });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Each image must be <= 5MB.", variant: "destructive" });
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    setFormImageFiles((prev) => [...prev, ...valid]);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      toast({ title: "Invalid name", description: "Name is required.", variant: "destructive" });
      return;
    }
    if (!formCategoryId) {
      toast({ title: "Invalid category", description: "Please choose a category.", variant: "destructive" });
      return;
    }

    const price = Number(formPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: "Invalid price", description: "Price must be a positive number.", variant: "destructive" });
      return;
    }

    const inventoryQuantity = Math.floor(Number(formInventory));
    if (!Number.isFinite(inventoryQuantity) || inventoryQuantity < 0) {
      toast({ title: "Invalid inventory", description: "Inventory must be 0 or more.", variant: "destructive" });
      return;
    }

    try {
      let imageUrls = [...formImageUrls];

      if (formImageFiles.length > 0) {
        const uploaded = await Promise.all(
          formImageFiles.map((f) => uploadImageToCloudinary(f, { folder: "smartcanteen/menu-items" }))
        );
        imageUrls = [...imageUrls, ...uploaded.map((u) => u.url)];
      }

      // keep legacy field in sync (first image)
      const imageUrl = imageUrls[0] ?? null;

      if (editMode === "create") {
        await createMutation.mutateAsync({
          categoryId: formCategoryId,
          name,
          price,
          inventoryQuantity,
          imageUrls,
          imageUrl,
          isActive: formIsActive,
        });
        return;
      }

      if (!editingItem) return;
      await updateMutation.mutateAsync({
        id: editingItem.id,
        body: {
          name,
          price,
          inventoryQuantity,
          imageUrls,
          imageUrl,
          isActive: formIsActive,
          xmin: editingItem.xmin ?? undefined,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  
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
        
        <Button className="gap-2" onClick={openCreate}>
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
                      src={item.imageUrls?.[0] ?? item.imageUrl ?? FALLBACK_IMAGE}
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

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <span className="font-medium">{item.name}</span> from the menu.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleImagesSelected(e.target.files)}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingItem(null);
            setFormImageFiles([]);
            if (fileRef.current) fileRef.current.value = "";
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode === "create" ? "Add Menu Item" : "Edit Menu Item"}</DialogTitle>
            <DialogDescription>
              {editMode === "create" ? "Create a new menu item." : "Update menu item details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Banh mi" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (VND)</label>
                <Input
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 20000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inventory</label>
                <Input
                  value={formInventory}
                  onChange={(e) => setFormInventory(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this item to students</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="gap-2" onClick={handlePickImage}>
                    <Upload className="h-4 w-4" />
                    Upload images
                  </Button>
                  {(formImageUrls.length > 0 || formImageFiles.length > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormImageUrls([]);
                        setFormImageFiles([]);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {(formImageUrls.length === 0 && formImageFiles.length === 0) ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img src={FALLBACK_IMAGE} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {formImageUrls.map((url, idx) => (
                      <div key={`url-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 rounded bg-background/80 p-1 hover:bg-background"
                          onClick={() => setFormImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove image"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={`file-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt={`new-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 rounded bg-background/80 p-1 hover:bg-background"
                          onClick={() =>
                            setFormImageFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Remove image"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">PNG/JPG, up to 5MB each. Uploads to Cloudinary.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formName.trim() ||
                !formCategoryId
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
