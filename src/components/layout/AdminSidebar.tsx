import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Users, BarChart3, LogOut, Tag, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPrimaryRole } from "@/lib/auth/role-routing";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { name: "Menu Items", icon: UtensilsCrossed, path: "/admin/menu" },
  { name: "Khuyến mãi", icon: Tag, path: "/admin/promotions" },
  { name: "Users", icon: Users, path: "/admin/users" },
  { name: "Account Linking", icon: Link2, path: "/admin/account-linking" },
  { name: "Reports", icon: BarChart3, path: "/admin/reports" },
];

interface AdminSidebarProps {
  schoolName?: string;
  userName?: string;
  userRole?: string;
}

export function AdminSidebar({ 
  schoolName = "Springfield High",
  userName,
  userRole
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const resolvedName = userName ?? auth.user?.name ?? auth.user?.email ?? "User";
  const resolvedRole = userRole ?? getPrimaryRole(auth.user?.roles ?? []);
  
  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Canteen Admin</span>
        </div>
      </div>
      
      {/* School Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-lg">🏫</span>
          </div>
          <div>
            <p className="text-sm font-medium">{schoolName}</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </div>
      
      {/* Menu */}
      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{resolvedName}</p>
            <p className="text-xs text-muted-foreground">{resolvedRole}</p>
          </div>
          <LogOut
            onClick={() => {
              auth.logout();
              navigate("/auth/login", { replace: true });
            }}
            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
          />
        </div>
      </div>
    </aside>
  );
}
