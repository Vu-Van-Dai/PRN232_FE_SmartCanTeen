import { Search, Bell, ChevronDown, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPrimaryRole } from "@/lib/auth/role-routing";
import { useCart } from "@/lib/cart/CartContext";

interface StudentHeaderProps {
  userName?: string;
  userRole?: string;
}

export function StudentHeader({ 
  userName,
  userRole
}: StudentHeaderProps) {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const resolvedName = userName ?? user?.name ?? user?.email ?? "User";
  const resolvedRole = userRole ?? getPrimaryRole(user?.roles ?? []);

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Search for food, drinks..."
          className="pl-10 bg-muted/50 border-0"
        />
      </div>
      
      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Cart */}
        <Link to="/student/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {itemCount}
            </Badge>
          )}
        </Link>
        
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* User */}
        <button className="flex items-center gap-3 pl-4 border-l border-border">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">{resolvedName}</p>
            <p className="text-xs text-primary">{resolvedRole}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
