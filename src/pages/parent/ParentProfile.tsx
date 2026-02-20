import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { parentApi, usersApi } from "@/lib/api";

const SELECTED_CHILD_KEY = "parentSelectedStudentId";

export default function ParentProfile() {
  const queryClient = useQueryClient();
  const [linkQuery, setLinkQuery] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    staleTime: 30_000,
    retry: false,
  });

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: parentApi.listMyLinkedChildren,
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_CHILD_KEY);
      if (raw) setSelectedChildId(raw);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!children.length) return;
    const stillExists = selectedChildId && children.some((c) => c.id === selectedChildId);
    if (!stillExists) {
      setSelectedChildId(children[0]!.id);
      try {
        localStorage.setItem(SELECTED_CHILD_KEY, children[0]!.id);
      } catch {
        // ignore
      }
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const linkMutation = useMutation({
    mutationFn: (q: string) => parentApi.linkChild(q),
    onSuccess: async (res) => {
      toast({ title: "Liên kết thành công", description: res.message ?? "Đã liên kết." });
      setLinkQuery("");
      await queryClient.invalidateQueries({ queryKey: ["parent", "children"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Liên kết thất bại";
      toast({ title: "Liên kết thất bại", description: msg, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (studentId: string) => parentApi.unlinkChild(studentId),
    onSuccess: async (res) => {
      toast({ title: "Đã huỷ liên kết", description: res.message ?? "Đã huỷ liên kết." });
      await queryClient.invalidateQueries({ queryKey: ["parent", "children"] });
      await queryClient.invalidateQueries({ queryKey: ["parent", "child-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["parent", "child-wallet"] });
      await queryClient.invalidateQueries({ queryKey: ["parent", "child-wallet-transactions"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Huỷ liên kết thất bại";
      toast({ title: "Huỷ liên kết thất bại", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Hồ sơ phụ huynh</h1>
        <p className="text-muted-foreground">Liên kết học sinh và xem lịch sử chi tiêu/đơn hàng.</p>
      </div>

      <Card className="p-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{me?.email ?? "—"}</p>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Liên kết học sinh</h2>
          <p className="text-sm text-muted-foreground">Nhập email của học sinh.</p>
        </div>

        <div className="flex gap-2">
          <Input
            value={linkQuery}
            onChange={(e) => setLinkQuery(e.target.value)}
            placeholder="VD: STU001 hoặc student@fpt.edu.vn"
          />
          <Button
            onClick={() => linkMutation.mutate(linkQuery)}
            disabled={!linkQuery.trim() || linkMutation.isPending}
          >
            Liên kết
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Học sinh đã liên kết</p>
          {childrenLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : !children.length ? (
            <p className="text-sm text-muted-foreground">Chưa có học sinh được liên kết.</p>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={selectedChildId ?? undefined}
                onValueChange={(v) => {
                  setSelectedChildId(v);
                  try {
                    localStorage.setItem(SELECTED_CHILD_KEY, v);
                  } catch {
                    // ignore
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn học sinh" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(c.name ?? c.email) + (c.studentCode ? ` (${c.studentCode})` : "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                disabled={!selectedChildId || unlinkMutation.isPending}
                onClick={() => {
                  if (!selectedChildId) return;
                  if (confirm("Bạn có chắc chắn muốn huỷ liên kết học sinh này không?")) {
                    unlinkMutation.mutate(selectedChildId);
                  }
                }}
              >
                Huỷ liên kết
              </Button>
            </div>
          )}

          {selectedChild && (
            <p className="text-xs text-muted-foreground">
              Đang chọn: {selectedChild.name ?? selectedChild.email}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
