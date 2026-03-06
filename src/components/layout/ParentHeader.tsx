import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPrimaryRole } from "@/lib/auth/role-routing";

interface ParentHeaderProps {
  mobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
}

export function ParentHeader({ mobileNavOpen, onToggleMobileNav }: ParentHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    staleTime: 30_000,
    retry: false,
    enabled: !!user,
  });

  const resolvedName = profile?.fullName ?? user?.name ?? user?.email ?? "User";
  const resolvedRole = (profile?.roles?.[0] ? profile.roles[0] : undefined) ?? getPrimaryRole(user?.roles ?? []);

  const initials = useMemo(() => {
    const base = (resolvedName ?? "U").trim();
    if (!base) return "U";
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }, [resolvedName]);

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 sticky top-0 z-40 py-3 md:py-0 md:h-16">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground md:hidden"
              aria-label={mobileNavOpen ? "Đóng menu" : "Mở menu"}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/student/home")}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Quay lại trang học sinh"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-md hover:bg-muted/40 transition-colors px-2 py-1"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium leading-4">{resolvedName}</p>
                <p className="text-xs text-primary leading-4">{resolvedRole}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/parent/profile")}>Liên kết & hồ sơ</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/auth/login", { replace: true });
              }}
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
