import { Outlet } from "react-router-dom";
import { Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function POSLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground">🍽️</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Canteen POS</p>
              <p className="text-xs text-muted-foreground">Staff Portal • Terminal 04</p>
            </div>
          </div>
          
          <div className="relative w-80 ml-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search menu items or barcode..."
              className="pl-10 bg-muted/50 border-0 h-9"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">Sarah Jenkins</p>
              <p className="text-xs text-muted-foreground">Shift Manager</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
          </div>
          
          <Button variant="default" size="sm" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
            <Lock className="w-4 h-4" />
            Lock
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
