import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wifi, Clock, AlertTriangle, Play, ChefHat, BarChart3, Info, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as kitchenApi from "@/lib/api/kitchen";
import type { KitchenOrderDto, KitchenOrdersResponse } from "@/lib/api/types";

interface OrderItem {
  quantity: number;
  name: string;
  notes?: string;
}

interface Order {
  id: string;
  rawId?: string;
  status: "overdue" | "cooking";
  source: string;
  server?: string;
  timeRemaining: string;
  isOverdue?: boolean;
  items: OrderItem[];
}

function formatDueTimeLocal(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function minutesUntil(iso: string) {
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 60000);
}

function getForecastStyle(mins: number) {
  if (mins <= 15) {
    return {
      text: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      dot: "bg-amber-400",
      label: "DUE SOON",
    };
  }

  if (mins <= 30) {
    return {
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      dot: "bg-emerald-400",
      label: "NEXT UP",
    };
  }

  return {
    text: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    label: "UPCOMING",
  };
}

export default function KitchenKDS() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: kitchenApi.getKitchenOrders,
    refetchInterval: 2_000,
    staleTime: 0,
  });

  const startCookingMutation = useMutation({
    mutationFn: (orderId: string) => kitchenApi.startCooking(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (orderId: string) => kitchenApi.markOrderReady(orderId),
    onMutate: async (orderId: string) => {
      await qc.cancelQueries({ queryKey: ["kitchen-orders"] });
      const prev = qc.getQueryData<KitchenOrdersResponse>(["kitchen-orders"]);

      if (prev) {
        qc.setQueryData<KitchenOrdersResponse>(["kitchen-orders"], {
          ...prev,
          preparing: prev.preparing.filter((x) => x.id !== orderId),
        });
      }

      return { prev };
    },
    onError: (_err, _orderId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["kitchen-orders"], ctx.prev);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  const orders = useMemo<Order[]>(() => {
    const preparing = data?.preparing ?? [];
    const now = Date.now();

    return preparing
      .slice()
      .sort((a: KitchenOrderDto, b: KitchenOrderDto) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .slice(0, 10)
      .map((x: KitchenOrderDto) => {
        if (!x.pickupTime) {
          return {
            id: `#${x.id.slice(0, 4)}`,
            rawId: x.id,
            status: "cooking",
            source: "ASAP",
            server: x.orderedBy,
            timeRemaining: "COOKING",
            items: x.items.map((i) => ({ quantity: i.quantity, name: i.name })),
          };
        }

        const pickupMs = Date.parse(x.pickupTime);
        const remainingMs = pickupMs - now;
        const overdue = remainingMs < 0;
        const min = Math.abs(Math.floor(remainingMs / 60000));
        const sec = Math.abs(Math.floor((remainingMs % 60000) / 1000));
        const timeRemaining = `${overdue ? "-" : ""}${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

        return {
          id: `#${x.id.slice(0, 4)}`,
          rawId: x.id,
          status: overdue ? "overdue" : "cooking",
          source: `Due ${formatDueTimeLocal(x.pickupTime)}`,
          server: x.orderedBy,
          timeRemaining,
          isOverdue: overdue,
          items: x.items.map((i) => ({ quantity: i.quantity, name: i.name })),
        };
      });
  }, [data]);

  const forecast = useMemo(() => {
    const upcoming = (data?.upcoming ?? []).filter((x) => !!x.pickupTime);
    return upcoming
      .map((x) => {
        const mins = x.pickupTime ? minutesUntil(x.pickupTime) : null;
        return { x, mins: mins ?? 999 };
      })
      .filter((p) => p.mins > 0 && p.mins <= 60)
      .sort((a, b) => a.mins - b.mins);
  }, [data]);
  const currentTime = new Date().toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "overdue":
        return <Badge className="bg-red-500 text-white uppercase text-xs px-2 py-0.5">Overdue</Badge>;
      case "cooking":
        return <Badge className="bg-emerald-600 text-white uppercase text-xs px-2 py-0.5">Cooking</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Canteen KDS - Hot Kitchen</h1>
            <p className="text-xs text-slate-500">Station 1 • Main Campus</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1.5 px-3 py-1">
            <Wifi className="w-3 h-3" />
            ONLINE
          </Badge>
          
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm">{currentTime}</span>
          </div>
          
          <Avatar className="h-9 w-9 border-2 border-slate-700">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
            <AvatarFallback>KC</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Main Content - Orders */}
        <main className="flex-1 p-5 overflow-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍳</span>
              <h2 className="text-lg font-bold text-white">COOK NOW</h2>
              <span className="text-slate-500 text-sm">(Priority Queue)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 px-3 py-1">
                {orders.length} Cooking
              </Badge>
              <Badge variant="outline" className="border-red-500/50 text-red-400 px-3 py-1">
                {orders.filter((o) => o.isOverdue).length} Overdue
              </Badge>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-2 gap-4">
            {orders.length === 0 && (
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
                No cooking orders yet. Start cooking from the Upcoming panel.
              </div>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl overflow-hidden ${
                  order.isOverdue 
                    ? "bg-slate-900 border-2 border-red-500/40" 
                    : "bg-slate-900 border border-slate-800"
                }`}
              >
                {/* Order Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{order.id}</span>
                      {getStatusBadge(order.status)}
                      {order.isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-lg font-mono font-medium ${order.isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                        {order.timeRemaining}
                      </span>
                      <p className="text-xs text-slate-600">remaining</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-1">
                    {order.source}{order.server && ` • ${order.server}`}
                  </p>
                </div>

                {/* Order Items */}
                <div className="px-4 pb-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center text-sm font-medium text-slate-300 flex-shrink-0">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium text-white text-sm">{item.name}</p>
                        {item.notes && (
                          <p className={`text-xs mt-0.5 ${item.notes.includes("!!") ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-4 pt-2">
                  <Button 
                    className={`w-full h-11 gap-2 font-semibold text-sm ${
                      order.isOverdue 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                    onClick={() => {
                      if (order.rawId) markReadyMutation.mutate(order.rawId);
                    }}
                  >
                    <CheckCheck className="w-4 h-4" />
                    MARK DONE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Prep Forecast */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 p-5 overflow-auto">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-white">UPCOMING</h3>
          </div>
          <p className="text-slate-500 text-xs mb-5">Prep Forecast (Next 60m)</p>

          <div className="space-y-2">
            {forecast.length === 0 && (
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 text-slate-400 text-sm">
                No pickups scheduled in the next 60 minutes.
              </div>
            )}

            {forecast.map(({ x, mins }) => {
              const style = getForecastStyle(mins);
              const dueAt = x.pickupTime ? formatDueTimeLocal(x.pickupTime) : "";
              return (
                <div
                  key={x.id}
                  className={`rounded-xl p-3 border ${style.border} ${style.bg}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <h4 className="font-medium text-white text-sm truncate">#{x.id.slice(0, 6)}</h4>
                        <span className={`text-[10px] font-semibold ${style.text}`}>{style.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">{x.orderedBy}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono font-semibold ${style.text}`}>in {mins}m</div>
                      <div className="text-[10px] text-slate-500">due {dueAt}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-300">
                    {x.items.slice(0, 2).map((i, idx) => (
                      <div key={idx} className="truncate">
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                    {x.items.length > 2 && (
                      <div className="text-slate-500">+{x.items.length - 2} more</div>
                    )}
                  </div>

                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      onClick={() => startCookingMutation.mutate(x.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      COOK NOW
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Staff Notice */}
          <div className="mt-5 bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-xs text-white">Staff Notice</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delivery of fresh produce expected at 12:15 PM via Back Door.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
