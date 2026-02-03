import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Thiếu email", description: "Vui lòng nhập email.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.forgotPassword({ email: email.trim() });
      setStep("reset");
      toast({
        title: "Đã gửi OTP",
        description: "Nếu email tồn tại, hệ thống đã gửi OTP. Vui lòng kiểm tra hộp thư.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể gửi OTP";
      toast({ title: "Thất bại", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || !newPassword || !confirmPassword) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập đầy đủ các trường.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Mật khẩu không khớp", description: "Vui lòng nhập lại xác nhận mật khẩu.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.resetPasswordWithOtp({ email: email.trim(), otp: otp.trim(), newPassword });
      toast({ title: "Đặt lại mật khẩu thành công", description: "Bạn có thể đăng nhập bằng mật khẩu mới." });
      navigate("/auth/login", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể đặt lại mật khẩu";
      toast({ title: "Thất bại", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-bold">Quên mật khẩu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nhập email để nhận OTP và đặt lại mật khẩu.
        </p>

        {step === "request" && (
          <form className="space-y-4 mt-6" onSubmit={requestOtp}>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi OTP"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form className="space-y-4 mt-6" onSubmit={resetPassword}>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={email} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">OTP</label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Nhập OTP (6 số)" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => setStep("request")}>
              Gửi lại OTP
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
