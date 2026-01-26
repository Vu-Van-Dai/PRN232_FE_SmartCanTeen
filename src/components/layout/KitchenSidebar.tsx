import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MonitorPlay, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

const menuItems = [
  { name: "Orders Board", icon: LayoutDashboard, path: "/kitchen/board" },
  { name: "KDS (Full Screen)", icon: MonitorPlay, path: "/kitchen/kds" },
];

export function KitchenSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  
  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-sm">
            🍳
          </div>
          <div>
            <span className="font-semibold">Canteen OS</span>
            <p className="text-xs text-primary font-medium">KITCHEN VIEW</p>
          </div>
        </div>
      </div>
      
      {/* Menu */}
      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/kitchen" && location.pathname.startsWith(item.path));
            
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
      
      {/* Log Out */}
      <div className="p-4 border-t border-border">
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          onClick={() => {
            auth.logout();
            navigate("/auth/pos", { replace: true });
          }}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
