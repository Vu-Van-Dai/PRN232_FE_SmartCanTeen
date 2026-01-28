import { Outlet, useNavigate } from "react-router-dom";
import { Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function POSLayout() {
  const navigate = useNavigate();

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
              <p className="text-xs text-muted-foreground">Staff Portal </p>
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
          
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => navigate("/pos/shift-close")}
          >
            <Lock className="w-4 h-4" />
            Khai báo
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
