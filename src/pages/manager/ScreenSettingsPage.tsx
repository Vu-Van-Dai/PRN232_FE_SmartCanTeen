import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import * as screensApi from "@/lib/api/screens";
import { categoriesApi } from "@/lib/api";
import type { Guid } from "@/lib/api/types";

function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function ScreenSettingsPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<Guid | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftActive, setDraftActive] = useState(true);
  const [draftCategoryIds, setDraftCategoryIds] = useState<Guid[]>([]);

  const screensQuery = useQuery({
    queryKey: ["manager-screens"],
    queryFn: screensApi.listManagerScreens,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
  });

  const categories = categoriesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        key: normalizeKey(draftKey),
        name: draftName.trim(),
        isActive: draftActive,
        categoryIds: draftCategoryIds,
      };

      if (editingId) {
        await screensApi.updateManagerScreen(editingId, body);
        return { id: editingId };
      }

      return screensApi.createManagerScreen(body);
    },
    onSuccess: async () => {
      setEditingId(null);
      setDraftKey("");
      setDraftName("");
      setDraftActive(true);
      setDraftCategoryIds([]);
      await qc.invalidateQueries({ queryKey: ["manager-screens"] });
      toast({ title: editingId ? "Đã cập nhật" : "Đã tạo màn hình" });
    },
    onError: (err) => {
      toast({ title: "Tạo màn hình thất bại", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: Guid) => screensApi.deleteManagerScreen(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["manager-screens"] });
      toast({ title: "Đã xóa" });
    },
    onError: (err) => {
      toast({ title: "Xóa thất bại", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    },
  });

  const screens = screensQuery.data?.items ?? [];

  const categoryNameById = useMemo(() => {
    const map = new Map<Guid, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thiết lập màn hình theo danh mục</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mỗi màn hình có thể hiển thị nhiều danh mục để tách quầy (ví dụ: bếp nóng, quầy nước).
        </p>
      </div>

      <Card className="p-5 space-y-4">
        {editingId && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <p className="text-sm">Đang chỉnh sửa màn hình.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setDraftKey("");
                setDraftName("");
                setDraftActive(true);
                setDraftCategoryIds([]);
              }}
            >
              Hủy
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Key (duy nhất)</label>
            <Input value={draftKey} onChange={(e) => setDraftKey(e.target.value)} placeholder="vd: hot-kitchen, drink" />
            <p className="text-xs text-muted-foreground mt-1">Sẽ tự chuẩn hóa về dạng chữ thường + dấu gạch.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tên màn hình</label>
            <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="vd: Bếp nóng, Quầy nước" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={draftActive} onCheckedChange={setDraftActive} />
          <span className="text-sm">Kích hoạt</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Danh mục hiển thị</span>
            <span className="text-xs text-muted-foreground">{draftCategoryIds.length} đã chọn</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const selected = draftCategoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setDraftCategoryIds((prev) =>
                      selected ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm border ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo màn hình"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {screens.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">Key: {s.key}</p>
                <p className="text-xs text-muted-foreground">{s.isActive ? "Đang bật" : "Đang tắt"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(s.id);
                    setDraftKey(s.key);
                    setDraftName(s.name);
                    setDraftActive(s.isActive);
                    setDraftCategoryIds(s.categoryIds ?? []);
                  }}
                >
                  Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(s.id)}>
                  Xóa
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(s.categoryIds ?? []).length === 0 ? (
                <span className="text-xs text-muted-foreground">Chưa chọn danh mục (màn hình sẽ không lọc).</span>
              ) : (
                s.categoryIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {categoryNameById.get(id) ?? String(id)}
                  </Badge>
                ))
              )}
            </div>
          </Card>
        ))}

        {!screensQuery.isLoading && screens.length === 0 && (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Chưa có màn hình nào. Tạo ở form phía trên.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
