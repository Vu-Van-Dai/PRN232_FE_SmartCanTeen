import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, LogOut, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { authApi, usersApi, walletApi } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/lib/auth/AuthContext";

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    staleTime: 30_000,
    retry: false,
  });

  const { data: walletMe } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: walletApi.getMyWallet,
    staleTime: 15_000,
    retry: false,
  });

  const patchProfile = useMutation({
    mutationFn: usersApi.patchMe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });

  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
  });

  const displayName = profile?.fullName ?? user?.name ?? user?.email ?? "User";
  const initials = useMemo(() => {
    const base = (displayName ?? "U").trim();
    if (!base) return "U";
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }, [displayName]);

  const roleText = useMemo(() => {
    const roles = profile?.roles ?? user?.roles ?? [];
    if (roles.length === 0) return "—";
    return roles[0];
  }, [profile?.roles, user?.roles]);

  const studentIdText = profile?.studentCode ?? user?.id ?? "—";

  const handlePickAvatar = () => {
    fileRef.current?.click();
  };

  const handleAvatarSelected = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "File không hợp lệ", description: "Vui lòng chọn file ảnh.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ảnh quá lớn", description: "Vui lòng chọn ảnh <= 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadImageToCloudinary(file);
      await patchProfile.mutateAsync({ avatarUrl: uploaded.url });
      toast({ title: "Đã cập nhật avatar" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tải lên thất bại";
      toast({ title: "Upload thất bại", description: msg, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const formatVND = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hồ sơ</h1>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => {
            logout();
            navigate("/auth/login", { replace: true });
          }}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleAvatarSelected(e.target.files?.[0] ?? null)}
      />

      {/* Account Info (read-only) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Thông tin tài khoản</CardTitle>
          <div className="flex items-center gap-3">
            {(profile?.roles ?? user?.roles ?? []).map((r) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? profile?.email ?? "—"}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={handlePickAvatar}
                    disabled={isUploadingAvatar || patchProfile.isPending}
                  >
                    <Camera className="h-4 w-4" />
                    {isUploadingAvatar ? "Uploading…" : "Change avatar"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Họ và tên</p>
                <p className="mt-1 text-sm font-medium">{profileLoading ? "…" : profile?.fullName ?? user?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="mt-1 text-sm font-medium">{profileLoading ? "…" : profile?.email ?? user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mã sinh viên</p>
                <p className="mt-1 text-sm font-mono break-all">{profileLoading ? "…" : studentIdText}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vai trò</p>
                <p className="mt-1 text-sm font-medium">{profileLoading ? "…" : roleText}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tổng quan ví</CardTitle>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/student/wallet">
              <Eye className="h-4 w-4" />
              Xem ví
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
            <p className="text-sm font-semibold">{typeof walletMe?.balance === "number" ? formatVND(walletMe.balance) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Thông báo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Order ready</p>
            <p className="text-xs text-muted-foreground">Bật để nhận thông báo khi món đã sẵn sàng.</p>
          </div>
          <Switch
            checked={!!profile?.orderReadyNotificationsEnabled}
            onCheckedChange={(checked) => {
              patchProfile.mutate(
                { orderReadyNotificationsEnabled: checked },
                {
                  onError: (err) => {
                    const msg = err instanceof Error ? err.message : "Update failed";
                    toast({ title: "Cập nhật thất bại", description: msg, variant: "destructive" });
                  },
                }
              );
            }}
            disabled={!profile || patchProfile.isPending}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                className="mt-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                className="mt-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="mt-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              className="gap-2"
              disabled={changePassword.isPending}
              onClick={async () => {
                if (!currentPassword || !newPassword) {
                  toast({ title: "Thiếu thông tin", description: "Vui lòng nhập đủ mật khẩu.", variant: "destructive" });
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast({ title: "Không khớp", description: "Mật khẩu xác nhận không khớp.", variant: "destructive" });
                  return;
                }

                try {
                  await changePassword.mutateAsync({ currentPassword, newPassword });
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  toast({ title: "Đổi mật khẩu thành công" });
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
                  toast({ title: "Đổi mật khẩu thất bại", description: msg, variant: "destructive" });
                }
              }}
            >
              <Save className="h-4 w-4" />
              Đổi mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
