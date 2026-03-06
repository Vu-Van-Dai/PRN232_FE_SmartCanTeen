import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

const studentLinks = [
  { name: "Menu", icon: LayoutGrid, path: "/student/menu" },
  { name: "Giỏ hàng", icon: ShoppingCart, path: "/student/cart" },
  { name: "Ví của tôi", icon: Wallet, path: "/student/wallet" },
  { name: "Đơn hàng của tôi", icon: ShoppingBag, path: "/student/orders" },
  { name: "Hồ sơ", icon: User, path: "/student/profile" },
];

const parentLinks = [
  { name: "Đơn hàng của con", icon: ShoppingBag, path: "/parent/orders" },
  { name: "Chi tiêu của con", icon: Wallet, path: "/parent/spending" },
  { name: "Liên kết & hồ sơ", icon: User, path: "/parent/profile" },
];

interface ParentMobileNavProps {
  onNavigate?: () => void;
}

export function ParentMobileNav({ onNavigate }: ParentMobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <div className="h-full bg-card px-4 py-4 pt-12 overflow-auto">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Học sinh</p>
      <nav className="space-y-1">
        {studentLinks.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/student/menu" && location.pathname.startsWith("/student/menu"));
          return (
            <NavLink key={item.name} to={item.path} onClick={onNavigate} className={linkClass(isActive)}>
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Phụ huynh</p>
        <nav className="space-y-1">
          {parentLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.name} to={item.path} onClick={onNavigate} className={linkClass(isActive)}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => {
            auth.logout();
            onNavigate?.();
            navigate("/auth/login", { replace: true });
          }}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
