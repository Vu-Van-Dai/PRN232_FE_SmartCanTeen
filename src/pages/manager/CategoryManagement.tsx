import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "@/hooks/use-toast";
import { categoriesApi, type CategoryResponse } from "@/lib/api";

export default function CategoryManagement() {
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [formName, setFormName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
    staleTime: 10_000,
  });

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const createMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Created", description: "Category created." });
      setEditOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Create failed";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (p: { id: string; name: string; isActive: boolean }) =>
      categoriesApi.updateCategory(p.id, { name: p.name, isActive: p.isActive }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Updated", description: "Category updated." });
      setEditOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Deleted", description: "Category deleted." });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditMode("create");
    setEditing(null);
    setFormName("");
    setFormIsActive(true);
    setEditOpen(true);
  };

  const openEdit = (cat: CategoryResponse) => {
    setEditMode("edit");
    setEditing(cat);
    setFormName(cat.name);
    setFormIsActive(Boolean(cat.isActive));
    setEditOpen(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      toast({ title: "Invalid name", description: "Name is required.", variant: "destructive" });
      return;
    }

    if (editMode === "create") {
      await createMutation.mutateAsync({ name });
      return;
    }

    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, name, isActive: formIsActive });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-1">Create, update and delete categories.</p>
        </div>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Active</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={3}>
                  No categories found.
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4">
                    <span className={cat.isActive ? "text-primary text-sm font-medium" : "text-muted-foreground text-sm"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(cat)}>
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
                            <AlertDialogTitle>Delete category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete <span className="font-medium">{cat.name}</span>. If the category has menu items, the API will block deletion.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(cat.id)}
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

        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} category(ies)</p>
        </div>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode === "create" ? "Add Category" : "Edit Category"}</DialogTitle>
            <DialogDescription>
              {editMode === "create" ? "Create a new category." : "Update category details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Food" />
            </div>

            {editMode === "edit" && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Allow using this category</p>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !formName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
