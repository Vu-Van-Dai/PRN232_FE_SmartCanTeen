import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, Shield, Trash2, UserPlus, UserRoundCog } from "lucide-react";
import * as XLSX from "xlsx";
import { adminUsersApi } from "@/lib/api";
import type { AdminUserListItem, CreateUserRequest } from "@/lib/api/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

function getPrimaryRole(roles: string[]): string {
  const normalized = new Set(roles.map((r) => r.trim()));

  // Any staff sub-role should still display as Staff (primary)
  if (normalized.has("Staff") || normalized.has("StaffPOS") || normalized.has("StaffKitchen") || normalized.has("StaffCoordination")) {
    return "Staff";
  }

  const priority = [
    "AdminSystem",
    "Manager",
    "Student",
    "Parent",
  ];
  for (const r of priority) {
    if (normalized.has(r)) return r;
  }
  return roles[0] ?? "";
}

function statusLabel(isActive: boolean) {
  return isActive ? "Hoạt động" : "Bị khóa";
}

type ImportRole = "Student" | "Parent";

type ImportUserRow = {
  rowNumber: number;
  email: string;
  fullName: string;
  studentCode?: string;
};

function downloadExcelTemplate(role: ImportRole) {
  const wb = XLSX.utils.book_new();

  const headers =
    role === "Student"
      ? [["Họ Và Tên", "MSSV", "Email"]]
      : [["Họ Và Tên", "Email"]];

  const ws = XLSX.utils.aoa_to_sheet(headers);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = role === "Student" ? "import-students-template.xlsx" : "import-parents-template.xlsx";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeHeaderKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function getRowValue(row: Record<string, unknown>, candidateKeys: string[]) {
  const keys = Object.keys(row);
  for (const k of keys) {
    const nk = normalizeHeaderKey(k);
    if (candidateKeys.includes(nk)) return row[k];
  }
  return undefined;
}

async function parseUserExcel(file: File): Promise<ImportUserRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const parsed: ImportUserRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {};
    const rowNumber = i + 2; // header is row 1 in the template

    const email = String(getRowValue(r, ["email"]) ?? "").trim();
    const fullName = String(getRowValue(r, ["hovaten", "hoten", "fullname", "name"]) ?? "").trim();
    const studentCode = String(getRowValue(r, ["mssv", "studentcode", "mahocsinh"]) ?? "").trim();

    const allEmpty = !email && !fullName && !studentCode;
    if (allEmpty) continue;

    parsed.push({ rowNumber, email, fullName, studentCode: studentCode || undefined });
  }

  return parsed;
}

export default function UserManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRole, setImportRole] = useState<ImportRole>("Student");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: "",
    fullName: "",
    studentCode: "",
    role: "Student",
  });

  const usersQuery = useQuery({
    queryKey: ["adminUsers", roleFilter],
    queryFn: () => adminUsersApi.getAdminUsers(roleFilter === "all" ? undefined : roleFilter),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.toggleUserActive(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Cập nhật trạng thái thành công" });
    },
    onError: (err) => {
      toast({
        title: "Thất bại",
        description: err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.resetUserPassword(id),
    onSuccess: async () => {
      toast({
        title: "Đã đặt lại mật khẩu",
        description: "Hệ thống đã gửi email chứa mật khẩu tạm thời.",
      });
    },
    onError: (err) => {
      toast({
        title: "Thất bại",
        description: err instanceof Error ? err.message : "Không thể đặt lại mật khẩu",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.deleteUser(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Đã xóa tài khoản" });
    },
    onError: (err) => {
      toast({
        title: "Thất bại",
        description: err instanceof Error ? err.message : "Không thể xóa tài khoản",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserRequest) => adminUsersApi.createAdminUser(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsCreateOpen(false);
      setCreateForm({ email: "", fullName: "", studentCode: "", role: "Student" });
      toast({
        title: "Tạo tài khoản thành công",
        description: "Hệ thống đã gửi email chứa mật khẩu tạm thời.",
      });
    },
    onError: (err) => {
      toast({
        title: "Thất bại",
        description: err instanceof Error ? err.message : "Không thể tạo tài khoản",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { file: File; role: ImportRole }) => {
      const rows = await parseUserExcel(payload.file);
      if (rows.length === 0) throw new Error("File không có dữ liệu hợp lệ");

      let success = 0;
      const failures: Array<{ rowNumber: number; message: string }> = [];

      for (const r of rows) {
        const email = r.email.trim();
        const fullName = r.fullName.trim();
        const studentCode = (r.studentCode ?? "").trim();

        if (!email || !fullName) {
          failures.push({ rowNumber: r.rowNumber, message: "Thiếu Email/Họ tên" });
          continue;
        }

        if (payload.role === "Student" && !studentCode) {
          failures.push({ rowNumber: r.rowNumber, message: "Thiếu MSSV" });
          continue;
        }

        try {
          await adminUsersApi.createAdminUser({
            email,
            fullName,
            role: payload.role,
            studentCode: payload.role === "Student" ? studentCode : undefined,
          });
          success += 1;
        } catch (err) {
          failures.push({
            rowNumber: r.rowNumber,
            message: err instanceof Error ? err.message : "Không thể tạo tài khoản",
          });
        }
      }

      return {
        total: rows.length,
        success,
        failures,
      };
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["adminUsers"] });

      setIsImportOpen(false);
      setImportFile(null);

      if (result.failures.length === 0) {
        toast({
          title: "Import hoàn tất",
          description: `Đã tạo ${result.success}/${result.total} tài khoản.`,
        });
        return;
      }

      const preview = result.failures
        .slice(0, 5)
        .map((f) => `Dòng ${f.rowNumber}: ${f.message}`)
        .join(" | ");

      toast({
        title: "Import hoàn tất (có lỗi)",
        description: `Thành công ${result.success}/${result.total}. Lỗi: ${preview}`,
        variant: "destructive",
      });
    },
    onError: (err) => {
      toast({
        title: "Import thất bại",
        description: err instanceof Error ? err.message : "Không thể import file",
        variant: "destructive",
      });
    },
  });

  const onImport = async () => {
    if (!importFile) {
      toast({
        title: "Chưa chọn file",
        description: "Vui lòng chọn file Excel (.xlsx/.xls).",
        variant: "destructive",
      });
      return;
    }

    await importMutation.mutateAsync({ file: importFile, role: importRole });
  };

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const primaryRole = getPrimaryRole(u.roles ?? []);
      const matchesSearch =
        !q ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.id ?? "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "locked" && !u.isActive);

      // roleFilter is server-side for performance, but keep client-side as fallback
      const matchesRoleClient = roleFilter === "all" || primaryRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRoleClient;
    });
  }, [usersQuery.data, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const users = usersQuery.data ?? [];
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const locked = total - active;
    return { total, active, locked };
  }, [usersQuery.data]);

  const roleOptions = ["Student", "Parent", "Staff", "Manager"];

  const onCreate = async () => {
    const email = createForm.email.trim();
    const fullName = createForm.fullName.trim();
    const studentCode = (createForm.studentCode ?? "").trim();
    const role = createForm.role;

    if (!email || !fullName || !role) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Email, Họ tên và Vai trò.",
        variant: "destructive",
      });
      return;
    }

    if (role === "Student" && !studentCode) {
      toast({
        title: "Thiếu MSSV",
        description: "Vui lòng nhập StudentCode/MSSV cho tài khoản Student.",
        variant: "destructive",
      });
      return;
    }

    await createMutation.mutateAsync({
      email,
      fullName,
      role,
      studentCode: role === "Student" ? studentCode || undefined : undefined,
    });
  };

  const renderRoleBadge = (user: AdminUserListItem) => {
    const primary = getPrimaryRole(user.roles ?? []);
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Shield className="w-3.5 h-3.5" />
          {primary}
        </Badge>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">Lấy dữ liệu từ hệ thống và quản lý tài khoản.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>

          <Dialog
            open={isImportOpen}
            onOpenChange={(open) => {
              setIsImportOpen(open);
              if (!open) setImportFile(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" disabled={importMutation.isPending}>
                {importMutation.isPending ? "Đang import..." : "Import Excel"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Excel</DialogTitle>
                <DialogDescription>
                  Tạo hàng loạt tài khoản và hệ thống sẽ gửi email thông tin đăng nhập cho từng tài khoản.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Vai trò import</label>
                  <Select value={importRole} onValueChange={(v) => setImportRole(v as ImportRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Student yêu cầu có MSSV; Parent không cần MSSV.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => downloadExcelTemplate(importRole)}>
                    Tải file mẫu
                  </Button>

                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setImportFile(file);
                    }}
                  />

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!importFileInputRef.current) return;
                      importFileInputRef.current.value = "";
                      importFileInputRef.current.click();
                    }}
                  >
                    Chọn file
                  </Button>

                  <div className="text-sm text-muted-foreground truncate flex-1">
                    {importFile ? importFile.name : "Chưa chọn file"}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={onImport} disabled={importMutation.isPending || !importFile}>
                  {importMutation.isPending ? "Đang import..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Tạo tài khoản
                </DialogTitle>
                <DialogDescription>
                  Hệ thống sẽ gửi email chứa mật khẩu tạm thời và yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
                </div>

                {createForm.role === "Student" && (
                  <div>
                    <label className="text-sm font-medium">MSSV (StudentCode)</label>
                    <Input
                      placeholder="Ví dụ: QE180122"
                      value={createForm.studentCode ?? ""}
                      onChange={(e) => setCreateForm((p) => ({ ...p, studentCode: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Họ và tên</label>
                  <Input
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Vai trò</label>
                  <Select
                    value={createForm.role}
                    onValueChange={(v) =>
                      setCreateForm((p) => ({
                        ...p,
                        role: v,
                        studentCode: v === "Student" ? p.studentCode : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chọn vai trò chính cho tài khoản này.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={onCreate} disabled={createMutation.isPending} className="gap-2">
                  <UserRoundCog className="w-4 h-4" />
                  {createMutation.isPending ? "Đang tạo..." : "Tạo và gửi email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Tổng user</p>
          <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Hoạt động</p>
          <h3 className="text-3xl font-bold mt-1">{stats.active}</h3>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Bị khóa</p>
          <h3 className="text-3xl font-bold mt-1">{stats.locked}</h3>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, họ tên..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="locked">Bị khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Họ tên</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Role chính</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Trạng thái</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.isLoading && (
              <tr>
                <td className="px-6 py-6 text-muted-foreground" colSpan={5}>
                  Đang tải...
                </td>
              </tr>
            )}

            {usersQuery.isError && (
              <tr>
                <td className="px-6 py-6 text-destructive" colSpan={5}>
                  Không thể tải danh sách user.
                </td>
              </tr>
            )}

            {!usersQuery.isLoading && filteredUsers.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-muted-foreground" colSpan={5}>
                  Không có dữ liệu.
                </td>
              </tr>
            )}

            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-mono text-sm">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="font-medium">{u.fullName ?? "(Chưa có tên)"}</span>
                </td>
                <td className="px-6 py-4">{renderRoleBadge(u)}</td>
                <td className="px-6 py-4">
                  <Badge className={u.isActive ? "badge-success" : "badge-danger"}>{statusLabel(u.isActive)}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate(u.id)}
                      disabled={toggleMutation.isPending}
                    >
                      {u.isActive ? "Khóa" : "Mở khóa"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Reset MK
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset mật khẩu?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hệ thống sẽ tạo mật khẩu tạm thời, gửi email cho user và bắt buộc đổi mật khẩu khi đăng nhập.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => resetPwdMutation.mutate(u.id)}>Xác nhận</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa tài khoản?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Thao tác này sẽ xóa (soft-delete) tài khoản và không thể đăng nhập nữa.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(u.id)}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
