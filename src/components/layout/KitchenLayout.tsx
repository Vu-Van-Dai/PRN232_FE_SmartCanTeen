import { Outlet } from "react-router-dom";
import { KitchenSidebar } from "./KitchenSidebar";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function KitchenLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <KitchenSidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-lg font-semibold">Kitchen Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Search orders..."
                className="pl-10 bg-muted/50 border-0 h-9"
              />
            </div>
            
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback>KC</AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
