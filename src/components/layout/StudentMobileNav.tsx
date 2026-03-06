import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Link2,
  LogOut,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasAnyRole } from "@/lib/auth/role-routing";

const mainLinks = [{ name: "Menu", icon: LayoutGrid, path: "/student/menu" }];

const accountLinks = [
  { name: "Ví của tôi", icon: Wallet, path: "/student/wallet" },
  { name: "Đơn của tôi", icon: ShoppingBag, path: "/student/orders" },
  { name: "Trang cá nhân", icon: User, path: "/student/profile" },
];

const parentLinks = [
  { name: "Liên kết học sinh", icon: Link2, path: "/parent/profile" },
  { name: "Đơn hàng của con", icon: ShoppingBag, path: "/parent/orders" },
  { name: "Chi tiêu của con", icon: Wallet, path: "/parent/spending" },
];

interface StudentMobileNavProps {
  onNavigate?: () => void;
}

export function StudentMobileNav({ onNavigate }: StudentMobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const isParent = hasAnyRole(auth.user?.roles ?? [], ["Parent"]);

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <div className="h-full bg-card px-4 py-4 pt-12 overflow-auto">
      <nav className="space-y-1">
        {mainLinks.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith("/student/menu");
          return (
            <NavLink key={item.name} to={item.path} onClick={onNavigate} className={linkClass(isActive)}>
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Tài khoản</p>
        <nav className="space-y-1">
          {accountLinks.map((item) => {
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

      {isParent && (
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
      )}

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
          Sign Out
        </button>
      </div>
    </div>
  );
}
