import { Search, Bell, ChevronDown, ShoppingCart, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface StudentHeaderProps {
  userName?: string;
  userRole?: string;
  walletBalance?: number;
  cartCount?: number;
}

export function StudentHeader({ 
  userName = "Alex M.", 
  userRole = "Student",
  walletBalance = 15.50,
  cartCount = 2
}: StudentHeaderProps) {
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
        {/* Wallet Balance */}
        <Link 
          to="/wallet"
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Wallet Balance</span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Wallet className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold">${walletBalance.toFixed(2)}</span>
          </div>
        </Link>
        
        {/* Cart */}
        <Link to="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <ShoppingCart className="w-5 h-5 text-muted-foreground" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {cartCount}
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
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-primary">{userRole}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
