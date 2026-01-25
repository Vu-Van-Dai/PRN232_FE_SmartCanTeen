import { Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPrimaryRole } from "@/lib/auth/role-routing";

interface AdminHeaderProps {
  userName?: string;
  userRole?: string;
  showExport?: boolean;
  onExport?: () => void;
}

export function AdminHeader({ 
  userName,
  userRole,
  showExport = false,
  onExport
}: AdminHeaderProps) {
  const { user } = useAuth();
  const resolvedName = userName ?? user?.name ?? user?.email ?? "User";
  const resolvedRole = userRole ?? getPrimaryRole(user?.roles ?? []);

  return (
    <header className="h-14 bg-primary px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left - can be used for breadcrumb or title */}
      <div />
      
      {/* Right Side */}
      <div className="flex items-center gap-4">
        {showExport && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        )}
        
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors">
          <Bell className="w-5 h-5 text-primary-foreground" />
        </button>
        
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-primary-foreground">{resolvedName}</p>
            <p className="text-xs text-primary-foreground/70">{resolvedRole}</p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-primary-foreground/20">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
