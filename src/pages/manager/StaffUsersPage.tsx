import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { managerStaffApi, staffRolesApi } from "@/lib/api";
import type { Guid, ManagerStaffListItem } from "@/lib/api/types";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const secondaryRoleOrder = [
  "StaffKitchen",
  "StaffPOS",
  "StaffCoordination",
  "StaffDrink",
] as const;

type SecondaryRole = (typeof secondaryRoleOrder)[number];

const secondaryRoleLabel: Record<SecondaryRole, string> = {
  StaffKitchen: "Bếp",
  StaffPOS: "POS",
  StaffCoordination: "Điều phối",
  StaffDrink: "Quầy nước",
};

function resolveCurrentSecondaryRole(user: ManagerStaffListItem): SecondaryRole | null {
  const roles = user.secondaryRoles ?? [];
  for (const r of secondaryRoleOrder) {
    if (roles.includes(r)) return r;
  }
  return null;
}

export default function StaffUsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["manager", "staff-users"],
    queryFn: () => managerStaffApi.getStaffUsers(),
  });

  const users = useMemo(() => staffQuery.data ?? [], [staffQuery.data]);

  const toggleMutation = useMutation({
    mutationFn: (id: Guid) => managerStaffApi.toggleStaffUserActive(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["manager", "staff-users"] });
      toast({ title: "Đã cập nhật trạng thái" });
    },
    onError: (err) => {
      toast({
        title: "Cập nhật thất bại",
        description: err instanceof Error ? err.message : "Lỗi không xác định",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: Guid) => managerStaffApi.deleteStaffUser(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["manager", "staff-users"] });
      toast({ title: "Đã xoá nhân viên" });
    },
    onError: (err) => {
      toast({
        title: "Xoá thất bại",
        description: err instanceof Error ? err.message : "Lỗi không xác định",
        variant: "destructive",
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (payload: { user: ManagerStaffListItem; next: SecondaryRole | null }) => {
      const { user, next } = payload;
      const currentRoles = user.secondaryRoles ?? [];
      const current = resolveCurrentSecondaryRole(user);

      // Remove all existing secondary roles first if changing or clearing
      const toRemove = secondaryRoleOrder.filter((r) => currentRoles.includes(r) && r !== next);
      for (const r of toRemove) {
        await staffRolesApi.removeStaffRole(user.id, r);
      }

      if (next && current !== next) {
        await staffRolesApi.assignStaffRole(user.id, next);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["manager", "staff-users"] });
      toast({ title: "Đã cập nhật vai trò phụ" });
    },
    onError: (err) => {
      toast({
        title: "Cập nhật vai trò thất bại",
        description: err instanceof Error ? err.message : "Lỗi không xác định",
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
          <p className="text-muted-foreground mt-1">
            Đổi vai trò phụ, vô hiệu hoá hoặc xoá nhân viên.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Nhân viên
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Email
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Vai trò phụ
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                Trạng thái
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
              </th>
            </tr>
          </thead>
          <tbody>
            {staffQuery.isLoading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={5}>
                  Đang tải…
                </td>
              </tr>
            ) : staffQuery.isError ? (
              <tr>
                <td className="px-6 py-6 text-sm text-destructive" colSpan={5}>
                  {String((staffQuery.error as Error)?.message ?? "Không tải được danh sách nhân viên")}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={5}>
                  Chưa có nhân viên.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const current = resolveCurrentSecondaryRole(u);
                const roleText = current ? secondaryRoleLabel[current] : "Chưa gán";

                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{u.fullName ?? "(Chưa có tên)"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{roleText}</Badge>
                        <Select
                          value={current ?? "none"}
                          onValueChange={(val) => {
                            const next = val === "none" ? null : (val as SecondaryRole);
                            roleMutation.mutate({ user: u, next });
                          }}
                          disabled={roleMutation.isPending}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không gán</SelectItem>
                            {secondaryRoleOrder.map((r) => (
                              <SelectItem key={r} value={r}>
                                {secondaryRoleLabel[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={u.isActive ? "text-primary text-sm font-medium" : "text-muted-foreground text-sm"}>
                        {u.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={toggleMutation.isPending}
                        >
                          {u.isActive ? "Vô hiệu" : "Kích hoạt"}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                              Xoá
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xoá nhân viên?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Thao tác này sẽ xoá (soft-delete) tài khoản và nhân viên sẽ không thể đăng nhập nữa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(u.id)}>
                                Xoá
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
