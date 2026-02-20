import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { menuItemsApi, type MenuItemResponse } from "@/lib/api";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&h=120&fit=crop";

export default function MenuManagementReadOnly() {
  const [searchQuery, setSearchQuery] = useState("");

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

  const getFirstImage = (item: MenuItemResponse) => item.imageUrls?.[0] ?? item.imageUrl ?? FALLBACK_IMAGE;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Món ăn</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm món ăn theo tên, danh mục..."
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
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Hình ảnh</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Tên món</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Danh mục</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Giá</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Tồn kho</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={5}>
                  Đang tải…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={5}>
                  Không tìm thấy món ăn.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                      <img src={getFirstImage(item)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.isActive ? "Active" : "Inactive"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-muted text-foreground">{item.categoryName}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatVND(item.price)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        item.inventoryQuantity > 0
                          ? "text-primary text-sm font-medium"
                          : "text-destructive text-sm font-medium"
                      }
                    >
                      {item.inventoryQuantity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {filteredItems.length} item(s)</p>
        </div>
      </div>
    </div>
  );
}
