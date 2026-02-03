import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultPathForRoles, hasAnyRole } from "@/lib/auth/role-routing";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enforce correct login portal: staff/manager/admin/kitchen must use POS login.
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const roles = auth.user?.roles ?? [];
    const isAdminOrManager = hasAnyRole(roles, ["AdminSystem", "Manager"]);
    const isStaffSide = hasAnyRole(roles, ["Staff", "StaffPOS", "StaffKitchen"]) && !isAdminOrManager;

    if (isStaffSide) {
      auth.logout();
      toast({
        title: "Sai cổng đăng nhập",
        description: "Tài khoản nhân viên vui lòng đăng nhập tại POS để mở ca.",
        variant: "destructive",
      });
      navigate("/auth/pos", { replace: true });
      return;
    }

    // Student/Parent already logged in => go to their home.
    navigate(getDefaultPathForRoles(roles), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const next = await auth.login(email.trim(), password);
      const roles = next.user?.roles ?? [];

      const isAdminOrManager = hasAnyRole(roles, ["AdminSystem", "Manager"]);
      const isStaffSide = hasAnyRole(roles, ["Staff", "StaffPOS", "StaffKitchen"]) && !isAdminOrManager;
      if (isStaffSide) {
        auth.logout();
        toast({
          title: "Sai cổng đăng nhập",
          description: "Tài khoản nhân viên vui lòng đăng nhập tại POS để mở ca.",
          variant: "destructive",
        });
        navigate("/auth/pos", { replace: true });
        return;
      }

      const target = getDefaultPathForRoles(roles);
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast({
        title: "Login failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%), url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1920&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-orange-900/40" />
      
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <div className="text-white">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            </div>
          </div>
          <span className="text-2xl font-bold">
            <span className="text-orange-500">Canteen</span>
            <span className="text-indigo-600">Plus</span>
          </span>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-500">
            Refuel your day. Login to access your canteen account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-indigo-600 mb-2">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="e.g. student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-600 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 pr-12 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-right mt-2">
              <Link to="/auth/forgot-password" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg rounded-xl"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-gray-400 text-sm uppercase">OR</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* SSO Button */}
        <Button
          variant="outline"
          className="w-full h-14 gap-3 border-gray-200 rounded-xl hover:bg-gray-50"
          onClick={() =>
            toast({
              title: "Not available",
              description: "School SSO is not implemented yet. Please sign in with email/password.",
            })
          }
        >
          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-gray-700 font-medium">Sign in with School Account</span>
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-700">Support</a>
          <a href="#" className="hover:text-gray-700">Privacy Policy</a>
        </div>
      </div>

      {/* Bottom Copyright */}
      <p className="relative mt-6 text-sm text-white/80">
        © 2023 CanteenPlus Systems
      </p>
    </div>
  );
}
