import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wifi, Battery, HelpCircle, Settings, ChevronDown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasAnyRole } from "@/lib/auth/role-routing";
import { ApiError } from "@/lib/api/http";
import * as shiftsApi from "@/lib/api/shifts";
import { formatVnTime } from "@/lib/datetime";

const campusLocations = [
  { id: 1, name: "North Campus Main Hall" },
  { id: 2, name: "South Campus Cafeteria" },
  { id: 3, name: "East Wing Food Court" },
  { id: 4, name: "West Building Canteen" },
];

export default function POSLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCampus, setSelectedCampus] = useState(campusLocations[0]);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({
        title: "Thiếu thông tin đăng nhập",
        description: "Vui lòng nhập email và mật khẩu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const next = await auth.login(email.trim(), password);
      const roles = next.user?.roles ?? [];

      const allowed = hasAnyRole(roles, ["StaffPOS", "Staff", "StaffKitchen", "StaffCoordination", "StaffDrink"]);
      if (!allowed) {
        auth.logout();
        toast({
          title: "Từ chối truy cập",
          description: "Tài khoản của bạn không thuộc nhóm nhân viên POS/Bếp. Vui lòng đăng nhập ở trang thường.",
          variant: "destructive",
        });
        navigate("/auth/login", { replace: true });
        return;
      }

      // NOTE: selectedCampus is currently UI-only; BE can add campus scoping later.
      void selectedCampus;

      const isPosStaff = hasAnyRole(roles, ["StaffPOS"]);
      const isStaffGeneric = hasAnyRole(roles, ["Staff"]);
      const isKitchenStaff = hasAnyRole(roles, ["StaffKitchen"]);
      const isCoordinationStaff = hasAnyRole(roles, ["StaffCoordination"]);
      const isDrinkStaff = hasAnyRole(roles, ["StaffDrink"]);

      if (isPosStaff) {
        try {
          await shiftsApi.openShift();
        } catch (err) {
          const apiErr = err as ApiError;
          const msg = apiErr?.message ?? "Không thể mở ca";

          // If shift already active, allow entering POS.
          if (!(apiErr instanceof ApiError && apiErr.status === 400 && /active shift/i.test(msg))) {
            toast({
              title: "Mở ca thất bại",
              description: msg,
              variant: "destructive",
            });
            return;
          }
        }

        navigate("/pos", { replace: true });
        return;
      }

      if (isKitchenStaff) {
        navigate("/kitchen/kds", { replace: true });
        return;
      }

      if (isCoordinationStaff) {
        navigate("/kitchen/board", { replace: true });
        return;
      }

      if (isDrinkStaff) {
        navigate("/drink/board", { replace: true });
        return;
      }

      if (isStaffGeneric) {
        navigate("/pos", { replace: true });
        return;
      }

      // Fallback
      navigate("/pos", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      toast({
        title: "Đăng nhập thất bại",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTime = formatVnTime(new Date());

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Canteen POS</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2">
            Đăng nhập nhân viên POS
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Nhập email và mật khẩu để đăng nhập.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/80 rounded-2xl p-6 space-y-6 border border-slate-700/50">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mật khẩu
              </label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl gap-2"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
