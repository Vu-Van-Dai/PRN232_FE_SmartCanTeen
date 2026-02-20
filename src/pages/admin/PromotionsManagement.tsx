import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
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
import { toast } from "@/hooks/use-toast";
import { categoriesApi, menuItemsApi, promotionsApi } from "@/lib/api";
import type { Guid, PromotionResponse, PromotionType } from "@/lib/api/types";

const promotionTypes: Array<{ value: PromotionType; label: string }> = [
  { value: "BuyXGetY", label: "Mua X tặng Y" },
  { value: "CategoryDiscount", label: "Giảm theo danh mục" },
  { value: "Bundle", label: "Combo" },
  { value: "Clearance", label: "Xả kho" },
  { value: "BuyMoreSaveMore", label: "Mua càng nhiều giảm càng sâu" },
];

function toDateTimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(v: string): string | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type BundleRow = { itemId: Guid; quantity: number };
type TierRow = { minQuantity: number; discountPercent: number };

export default function PromotionsManagement() {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
    staleTime: 30_000,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items"],
    queryFn: menuItemsApi.getMenuItems,
    staleTime: 30_000,
  });

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: promotionsApi.getPromotions,
    staleTime: 5_000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PromotionResponse | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<PromotionType>("BuyXGetY");
  const [isActive, setIsActive] = useState(true);
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  // Config state (dynamic)
  const [buyItemId, setBuyItemId] = useState<Guid>("");
  const [buyQuantity, setBuyQuantity] = useState("1");
  const [getItemId, setGetItemId] = useState<Guid>("");
  const [getQuantity, setGetQuantity] = useState("1");

  const [categoryId, setCategoryId] = useState<Guid>("");
  const [discountPercent, setDiscountPercent] = useState("10");

  const [bundleItems, setBundleItems] = useState<BundleRow[]>([]);
  const [bundlePrice, setBundlePrice] = useState("");

  const [clearanceItemId, setClearanceItemId] = useState<Guid>("");
  const [clearancePercent, setClearancePercent] = useState("20");

  const [tiers, setTiers] = useState<TierRow[]>([{ minQuantity: 2, discountPercent: 5 }]);

  const activeMenuItems = useMemo(
    () => menuItems.filter((x) => x.isActive),
    [menuItems]
  );

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setName("");
    setCode("");
    setType("BuyXGetY");
    setIsActive(true);
    setStartAt("");
    setEndAt("");

    setBuyItemId(activeMenuItems[0]?.id ?? "");
    setBuyQuantity("1");
    setGetItemId(activeMenuItems[0]?.id ?? "");
    setGetQuantity("1");

    setCategoryId(categories[0]?.id ?? "");
    setDiscountPercent("10");

    setBundleItems(activeMenuItems[0]?.id ? [{ itemId: activeMenuItems[0].id, quantity: 1 }] : []);
    setBundlePrice("");

    setClearanceItemId(activeMenuItems[0]?.id ?? "");
    setClearancePercent("20");

    setTiers([{ minQuantity: 2, discountPercent: 5 }]);

    setDialogOpen(true);
  };

  const openEdit = (p: PromotionResponse) => {
    setMode("edit");
    setEditing(p);
    setName(p.name);
    setCode(p.code);

    const t = (p.type as PromotionType) ?? "BuyXGetY";
    setType(t);
    setIsActive(p.isActive);
    setStartAt(toDateTimeLocalValue(p.startAt));
    setEndAt(toDateTimeLocalValue(p.endAt));

    // best-effort parse
    let parsed: any = {};
    try {
      parsed = p.configJson ? JSON.parse(p.configJson) : {};
    } catch {
      parsed = {};
    }

    if (t === "BuyXGetY") {
      setBuyItemId(parsed.buyItemId ?? activeMenuItems[0]?.id ?? "");
      setBuyQuantity(String(parsed.buyQuantity ?? 1));
      setGetItemId(parsed.getItemId ?? activeMenuItems[0]?.id ?? "");
      setGetQuantity(String(parsed.getQuantity ?? 1));
    }

    if (t === "CategoryDiscount") {
      setCategoryId(parsed.categoryId ?? categories[0]?.id ?? "");
      setDiscountPercent(String(parsed.discountPercent ?? 10));
    }

    if (t === "Bundle") {
      setBundleItems(Array.isArray(parsed.items) ? parsed.items : []);
      setBundlePrice(String(parsed.bundlePrice ?? ""));
    }

    if (t === "Clearance") {
      setClearanceItemId(parsed.itemId ?? activeMenuItems[0]?.id ?? "");
      setClearancePercent(String(parsed.discountPercent ?? 20));
    }

    if (t === "BuyMoreSaveMore") {
      setTiers(Array.isArray(parsed.tiers) ? parsed.tiers : [{ minQuantity: 2, discountPercent: 5 }]);
    }

    setDialogOpen(true);
  };

  const buildConfig = () => {
    switch (type) {
      case "BuyXGetY":
        return {
          buyItemId,
          buyQuantity: Number(buyQuantity),
          getItemId,
          getQuantity: Number(getQuantity),
        };
      case "CategoryDiscount":
        return {
          categoryId,
          discountPercent: Number(discountPercent),
        };
      case "Bundle":
        return {
          items: bundleItems.map((x) => ({ itemId: x.itemId, quantity: Number(x.quantity) })),
          bundlePrice: Number(bundlePrice),
        };
      case "Clearance":
        return {
          itemId: clearanceItemId,
          discountPercent: Number(clearancePercent),
        };
      case "BuyMoreSaveMore":
        return {
          tiers: tiers.map((t) => ({
            minQuantity: Number(t.minQuantity),
            discountPercent: Number(t.discountPercent),
          })),
        };
      default:
        return {};
    }
  };

  const createMutation = useMutation({
    mutationFn: promotionsApi.createPromotion,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Tạo thành công", description: "Đã tạo khuyến mãi." });
      setDialogOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Tạo thất bại";
      toast({ title: "Tạo thất bại", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (p: { id: Guid; body: any }) => promotionsApi.updatePromotion(p.id, p.body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Cập nhật thành công", description: "Đã cập nhật khuyến mãi." });
      setDialogOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast({ title: "Cập nhật thất bại", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: Guid) => promotionsApi.deletePromotion(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Đã xóa", description: "Đã xóa khuyến mãi." });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Xóa thất bại";
      toast({ title: "Xóa thất bại", description: msg, variant: "destructive" });
    },
  });

  const save = () => {
    const body = {
      name: name.trim(),
      code: code.trim(),
      type,
      isActive,
      startAt: fromDateTimeLocalValue(startAt),
      endAt: fromDateTimeLocalValue(endAt),
      config: buildConfig(),
    };

    if (mode === "create") {
      createMutation.mutate(body);
    } else if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    }
  };

  const formatWindow = (p: PromotionResponse) => {
    if (!p.startAt && !p.endAt) return "Always";
    const s = p.startAt ? new Date(p.startAt).toLocaleString() : "-";
    const e = p.endAt ? new Date(p.endAt).toLocaleString() : "-";
    return `${s} → ${e}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Khuyến mãi</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý danh mục khuyến mãi (5 loại).</p>
        </div>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Thêm khuyến mãi
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2 text-muted-foreground">
          <Tag className="w-4 h-4" />
          <span className="text-sm">{isLoading ? "Đang tải..." : `${promotions.length} khuyến mãi`}</span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Tên</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Mã</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Loại</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Kích hoạt</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Hiệu lực</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4 font-mono text-sm">{p.code}</td>
                <td className="px-6 py-4 text-muted-foreground">{String(p.type)}</td>
                <td className="px-6 py-4">
                  <Badge className={p.isActive ? "badge-success" : "badge-secondary"}>
                    {p.isActive ? "Bật" : "Tắt"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatWindow(p)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(p)}>
                      <Pencil className="w-4 h-4" />
                      Sửa
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa khuyến mãi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Thao tác này sẽ xóa mềm khuyến mãi (không thể khôi phục từ giao diện).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Chưa có khuyến mãi nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Tạo khuyến mãi" : "Chỉnh sửa khuyến mãi"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tên khuyến mãi</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên khuyến mãi" />
            </div>
            <div>
              <label className="text-sm font-medium">Mã khuyến mãi</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: PROMO2026" />
            </div>

            <div>
              <label className="text-sm font-medium">Loại</label>
              <Select value={type} onValueChange={(v) => setType(v as PromotionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {promotionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium">Kích hoạt</label>
                <div className="mt-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bắt đầu</label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Kết thúc</label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-semibold mb-3">Cấu hình</h3>

            {type === "BuyXGetY" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sản phẩm mua</label>
                  <Select value={buyItemId} onValueChange={setBuyItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMenuItems.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Số lượng mua</label>
                  <Input value={buyQuantity} onChange={(e) => setBuyQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Sản phẩm tặng</label>
                  <Select value={getItemId} onValueChange={setGetItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMenuItems.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Số lượng tặng</label>
                  <Input value={getQuantity} onChange={(e) => setGetQuantity(e.target.value)} />
                </div>
              </div>
            )}

            {type === "CategoryDiscount" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Danh mục</label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
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
                <div>
                  <label className="text-sm font-medium">Phần trăm giảm</label>
                  <Input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
                </div>
              </div>
            )}

            {type === "Clearance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sản phẩm</label>
                  <Select value={clearanceItemId} onValueChange={setClearanceItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMenuItems.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Phần trăm giảm</label>
                  <Input value={clearancePercent} onChange={(e) => setClearancePercent(e.target.value)} />
                </div>
              </div>
            )}

            {type === "Bundle" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Giá combo</label>
                    <Input value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} placeholder="VD: 45000" />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const fallbackId = activeMenuItems[0]?.id;
                        if (!fallbackId) return;
                        setBundleItems((prev) => [...prev, { itemId: fallbackId, quantity: 1 }]);
                      }}
                    >
                      + Thêm sản phẩm
                    </Button>
                  </div>
                </div>

                {bundleItems.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Sản phẩm</label>
                      <Select
                        value={row.itemId}
                        onValueChange={(v) =>
                          setBundleItems((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, itemId: v } : x))
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeMenuItems.map((x) => (
                            <SelectItem key={x.id} value={x.id}>
                              {x.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Số lượng</label>
                      <Input
                        value={String(row.quantity)}
                        onChange={(e) =>
                          setBundleItems((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, quantity: Number(e.target.value) } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setBundleItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Xóa dòng
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === "BuyMoreSaveMore" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Thiết lập các mức theo số lượng.</p>
                  <Button variant="outline" onClick={() => setTiers((prev) => [...prev, { minQuantity: 2, discountPercent: 5 }])}>
                    + Thêm mức
                  </Button>
                </div>

                {tiers.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-sm font-medium">Tối thiểu</label>
                      <Input
                        value={String(t.minQuantity)}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, minQuantity: Number(e.target.value) } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">% Giảm</label>
                      <Input
                        value={String(t.discountPercent)}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, discountPercent: Number(e.target.value) } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => setTiers((prev) => prev.filter((_, i) => i !== idx))}>
                        Xóa dòng
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={createMutation.isPending || updateMutation.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
