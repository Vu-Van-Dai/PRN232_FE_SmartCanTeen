import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, Search, ShoppingBag, ShoppingCart, User, Wallet } from "lucide-react";
import type { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { hubs, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPrimaryRole } from "@/lib/auth/role-routing";
import { useCart } from "@/lib/cart/CartContext";
import { toast } from "@/hooks/use-toast";

interface StudentHeaderProps {
  userName?: string;
  userRole?: string;
}

export function StudentHeader({ 
  userName,
  userRole
}: StudentHeaderProps) {
  const { user } = useAuth();
  const auth = useAuth();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const queryClient = useQueryClient();

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: "ready" | "completed"; orderId: string; createdAt: string }>
  >([]);
  const hubRef = useRef<HubConnection | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    staleTime: 30_000,
    retry: false,
    enabled: !!user,
  });

  // Realtime: listen for kitchen status updates.
  useEffect(() => {
    if (!user) return;

    const token = (() => {
      try {
        return localStorage.getItem("accessToken") ?? "";
      } catch {
        return "";
      }
    })();

    if (!token) return;

    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
    if (!baseUrl) return;

    const hubUrl = baseUrl.replace(/\/+$/, "") + hubs.order;

    const conn = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          try {
            return localStorage.getItem("accessToken") ?? "";
          } catch {
            return "";
          }
        },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    hubRef.current = conn;

    conn.on("OrderReady", (payload: { orderId: string; pickupTime?: string | null }) => {
      if (!payload?.orderId) return;

      setNotifications((prev) => [
        {
          id: `${Date.now()}-${payload.orderId}-ready`,
          type: "ready",
          orderId: payload.orderId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);

      toast({
        title: "Đơn đã sẵn sàng",
        description: `Đơn #${payload.orderId.substring(0, 8)} đã xong.`,
      });

      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    });

    conn.on("OrderCompleted", (payload: { orderId: string }) => {
      if (!payload?.orderId) return;

      setNotifications((prev) => [
        {
          id: `${Date.now()}-${payload.orderId}-completed`,
          type: "completed",
          orderId: payload.orderId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);

      toast({
        title: "Đơn đã hoàn thành",
        description: `Đơn #${payload.orderId.substring(0, 8)} đã được giao.`,
      });

      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    });

    conn
      .start()
      .catch((e) => console.warn("OrderHub connection failed", e));

    return () => {
      try {
        conn.stop();
      } catch {
        // ignore
      }
      hubRef.current = null;
    };
  }, [queryClient, user]);

  const resolvedName = profile?.fullName ?? userName ?? user?.name ?? user?.email ?? "User";
  const resolvedRole =
    userRole ??
    (profile?.roles?.[0] ? profile.roles[0] : undefined) ??
    getPrimaryRole(user?.roles ?? []);

  const initials = useMemo(() => {
    const base = (resolvedName ?? "U").trim();
    if (!base) return "U";
    const parts = base.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }, [resolvedName]);

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
        <Popover
          open={notifOpen}
          onOpenChange={(open) => {
            setNotifOpen(open);
            if (open) setUnreadCount(0);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Notifications</p>
              {notifications.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">Chưa có thông báo.</p>
                  <p className="text-xs text-muted-foreground">
                    Bật “Order ready” trong{" "}
                    <Link to="/student/profile" className="underline">Profile</Link>
                    {" "}để nhận thông báo khi món sẵn sàng.
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="rounded-md border p-2">
                      <p className="text-sm font-medium">
                        {n.type === "ready" ? "Đơn đã sẵn sàng" : "Đơn đã hoàn thành"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đơn #{n.orderId.substring(0, 8)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Link to="/student/orders" className="text-xs underline">
                      Xem My Orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 pl-4 border-l border-border rounded-md hover:bg-muted/40 transition-colors pr-2 py-1"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium leading-4">{resolvedName}</p>
                <p className="text-xs text-primary leading-4">{resolvedRole}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/student/wallet" className="cursor-pointer">
                <Wallet className="mr-2 h-4 w-4" />
                My Wallet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/student/orders" className="cursor-pointer">
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/student/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => {
                auth.logout();
                navigate("/auth/login", { replace: true });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
