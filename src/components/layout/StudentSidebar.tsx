import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, Coffee, UtensilsCrossed, Cookie, Soup, LogOut, Wallet, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All Items", icon: LayoutGrid, path: "/" },
  { name: "Drinks", icon: Coffee, path: "/category/drinks" },
  { name: "Rice", icon: UtensilsCrossed, path: "/category/rice" },
  { name: "Snacks", icon: Cookie, path: "/category/snacks" },
  { name: "Noodles", icon: Soup, path: "/category/noodles" },
];

const accountLinks = [
  { name: "My Wallet", icon: Wallet, path: "/wallet" },
  { name: "Orders", icon: ShoppingBag, path: "/orders" },
  { name: "Profile", icon: User, path: "/profile" },
];

export function StudentSidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Canteen Connect</span>
        </div>
      </div>
      
      {/* Categories */}
      <div className="p-4 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
          Categories
        </p>
        <nav className="space-y-1">
          {categories.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
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
        
        <div className="mt-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Account
          </p>
          <nav className="space-y-1">
            {accountLinks.map((item) => {
              const isActive = location.pathname === item.path;
              
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
      </div>
      
      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
