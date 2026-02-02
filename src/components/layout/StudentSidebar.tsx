import { NavLink, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  ShoppingBag,
  User,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const mainLinks = [{ name: "Menu", icon: LayoutGrid, path: "/student/menu" }];

const accountLinks = [
  { name: "My Wallet", icon: Wallet, path: "/student/wallet" },
  { name: "My Orders", icon: ShoppingBag, path: "/student/orders" },
  { name: "Profile", icon: User, path: "/student/profile" },
];

type StudentSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function StudentSidebar({ collapsed, onToggleCollapsed }: StudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  
  return (
    <aside
      className={cn(
        "bg-card border-r border-border flex flex-col h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-border">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>

            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Expand sidebar"
              title="Expand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="ml-1 font-semibold text-lg">Canteen Connect</span>
            </div>

            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Collapse sidebar"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Main */}
      <div className="p-4 flex-1">
        <TooltipProvider delayDuration={150}>
          <nav className="space-y-1">
            {mainLinks.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith("/student/menu");
              const link = (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && item.name}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>
        
          <div className={cn("mt-8", collapsed && "mt-6")}>
            {!collapsed && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Account
              </p>
            )}
            <nav className="space-y-1">
              {accountLinks.map((item) => {
                const isActive = location.pathname === item.path;
                const link = (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-0" : "",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    {!collapsed && item.name}
                  </NavLink>
                );

                return collapsed ? (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </nav>
          </div>
        </TooltipProvider>
      </div>
      
      {/* Sign Out */}
      <div className={cn("p-4 border-t border-border", collapsed && "px-2")}>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  auth.logout();
                  navigate("/auth/login", { replace: true });
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? "Sign Out" : undefined}
              >
                <LogOut className="w-5 h-5" />
                {!collapsed && "Sign Out"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
