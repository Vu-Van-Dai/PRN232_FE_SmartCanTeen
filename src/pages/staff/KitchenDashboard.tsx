import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Check, CheckCheck, AlertTriangle, Leaf, MoreHorizontal, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import * as kitchenApi from "@/lib/api/kitchen";
import type { Guid, KitchenOrderDto, KitchenOrdersResponse } from "@/lib/api/types";

type OrderStatus = "preparing" | "ready";

type CardOrder = {
  id: Guid;
  displayId: string;
  customerName: string;
  items: string[];
  time: string;
  status: OrderStatus;
  tags?: ("new" | "veg" | "allergy")[];
};

type BoardOrder = {
  id: Guid;
  displayId: string;
  customerName: string;
  items: string[];
  time: string;
  status: OrderStatus;
  tags?: ("new" | "veg" | "allergy")[];
};

const filters = [
  { label: "All Orders", icon: null },
  { label: "Vegetarian", icon: Leaf },
  { label: "Allergy Alert", icon: AlertTriangle, variant: "destructive" as const },
];

function OrderCard({
  order,
  onAction,
  isCompleting,
}: {
  order: CardOrder;
  onAction: (id: Guid, newStatus: OrderStatus) => void;
  isCompleting?: boolean;
}) {
  const isPreparing = order.status === "preparing";
  
  return (
    <div className={cn(
      "bg-card rounded-lg border p-4",
      order.status === "preparing" && "border-l-4 border-l-warning border-t-border border-r-border border-b-border",
      order.status === "ready" && "border-border"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{order.displayId}</span>
            {order.tags?.includes("new") && (
              <Badge className="bg-info/10 text-info text-[10px] px-1.5 py-0">NEW</Badge>
            )}
            {order.tags?.includes("veg") && (
              <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 gap-1">
                <Leaf className="w-2.5 h-2.5" /> VEG
              </Badge>
            )}
            {order.tags?.includes("allergy") && (
              <Badge className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0 gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> ALLERGY
              </Badge>
            )}
          </div>
          <h3 className="font-semibold mt-1">{order.customerName}</h3>
        </div>
        {order.status === "ready" && (
          <span className="text-primary">🛍️</span>
        )}
      </div>
      
      {/* Items */}
      <div className="space-y-1 mb-4">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-muted-foreground">{item}</p>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          {order.status === "ready" ? (
            <>
              <Check className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{order.time}</span>
            </>
          ) : (
            <>
                <Clock className={cn("w-4 h-4", "text-muted-foreground")} />
                <span className="text-muted-foreground">{order.time}</span>
            </>
          )}
        </div>

        {order.status === "ready" && (
          <Button 
            size="sm"
            className="gap-1"
            onClick={() => onAction(order.id, "ready")}
            disabled={!!isCompleting}
          >
            {isCompleting ? "Completing..." : "Complete"}
            <CheckCheck className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {/* Progress bar for preparing */}
      {order.status === "preparing" && (
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-warning rounded-full transition-all"
            style={{ width: `${Math.min(100, parseInt(order.time) * 10)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function shortId(id: string) {
  return id.length <= 6 ? id : id.slice(0, 6);
}

function minutesAgo(iso: string) {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${m}m`;
}

function mapOrder(x: KitchenOrderDto, status: OrderStatus): BoardOrder {
  const created = minutesAgo(x.createdAt);
  return {
    id: x.id,
    displayId: shortId(x.id),
    customerName: x.orderedBy,
    items: x.items.map((i) => `${i.quantity}x ${i.name}`),
    time: status === "ready" ? "Ready" : created || "Now",
    status,
    tags: undefined,
  };
}

export default function KitchenDashboard() {
  const [activeFilter, setActiveFilter] = useState("All Orders");
  const [completingId, setCompletingId] = useState<Guid | null>(null);
  const [searchParams] = useSearchParams();
  const screenKey = searchParams.get("screenKey") ?? "hot-kitchen";
  const ordersQueryKey = ["kitchen-orders", screenKey ?? "__all__"] as const;

  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => kitchenApi.getKitchenOrders(screenKey),
    refetchInterval: 2_000,
    staleTime: 0,
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.completeOrder(orderId),
    onMutate: async (orderId: Guid) => {
      setCompletingId(orderId);
      await qc.cancelQueries({ queryKey: ordersQueryKey });
      const prev = qc.getQueryData<KitchenOrdersResponse>(ordersQueryKey);
      if (prev) {
        qc.setQueryData<KitchenOrdersResponse>(ordersQueryKey, {
          ...prev,
          ready: prev.ready.filter((x) => x.id !== orderId),
        });
      }
      return { prev };
    },
    onError: (err, _orderId, ctx) => {
      if (ctx?.prev) qc.setQueryData(ordersQueryKey, ctx.prev);
      const msg = err instanceof Error ? err.message : "Complete failed";
      toast({ title: "Complete failed", description: msg, variant: "destructive" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ordersQueryKey });
    },
    onSettled: () => {
      setCompletingId(null);
    },
  });

  const handleStatusChange = (id: Guid, _newStatus: OrderStatus) => {
    completeMutation.mutate(id);
  };

  const preparingOrders = (data?.preparing ?? []).map((x) => mapOrder(x, "preparing"));
  const readyOrders = (data?.ready ?? []).map((x) => mapOrder(x, "ready"));
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Order Status</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">12:45 PM - Lunch Service</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              className={cn(
                "filter-chip",
                activeFilter === filter.label && "filter-chip-active"
              )}
            >
              {filter.icon && <filter.icon className="w-4 h-4" />}
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="grid grid-cols-2 gap-6">
        {/* Preparing Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-warning rounded-full" />
              <h2 className="font-semibold">Preparing</h2>
              <Badge variant="secondary" className="rounded-full">{preparingOrders.length}</Badge>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
              </div>
            )}
            {isError && (
              <div className="text-sm text-destructive">
                Failed to load orders: {error instanceof Error ? error.message : "Unknown error"}
              </div>
            )}
            {!isLoading && !isError && preparingOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">No orders in progress.</div>
            )}
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.id,
                  displayId: order.displayId,
                  customerName: order.customerName,
                  items: order.items,
                  time: order.time,
                  status: order.status,
                  tags: order.tags,
                }}
                onAction={() => {}}
              />
            ))}
          </div>
        </div>
        
        {/* Ready Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <h2 className="font-semibold">Ready for Pickup</h2>
              <Badge variant="secondary" className="rounded-full">{readyOrders.length}</Badge>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            {!isLoading && !isError && readyOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">No ready orders.</div>
            )}
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.id,
                  displayId: order.displayId,
                  customerName: order.customerName,
                  items: order.items,
                  time: order.time,
                  status: order.status,
                  tags: order.tags,
                }}
                onAction={handleStatusChange}
                isCompleting={completingId === order.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
