import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultPathForRoles } from "@/lib/auth/role-routing";
import { decodeJwtPayload, getJwtRoles } from "@/lib/auth/jwt";

export default function ForceChangePasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ các trường.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng nhập lại xác nhận mật khẩu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.changePassword({ currentPassword, newPassword });
      auth.reloadFromStorage();

      toast({
        title: "Đổi mật khẩu thành công",
        description: "Bạn có thể tiếp tục sử dụng hệ thống.",
      });

      const token = localStorage.getItem("accessToken");
      const roles = getJwtRoles(decodeJwtPayload(token ?? ""));
      navigate(getDefaultPathForRoles(roles), { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể đổi mật khẩu";
      toast({
        title: "Đổi mật khẩu thất bại",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-bold">Đổi mật khẩu lần đầu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vì lý do bảo mật, bạn cần đổi mật khẩu trước khi tiếp tục.
        </p>

        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
