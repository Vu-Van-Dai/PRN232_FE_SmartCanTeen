import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ArrowRight, Check, CheckCheck, AlertTriangle, Leaf, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import * as kitchenApi from "@/lib/api/kitchen";
import type { Guid, KitchenOrderDto } from "@/lib/api/types";

type OrderStatus = "pending" | "preparing" | "ready";

type CardOrder = {
  id: string;
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

function OrderCard({ order, onAction }: { order: CardOrder; onAction: (id: string, newStatus: OrderStatus) => void }) {
  const isUrgent = order.status === "pending" && parseInt(order.time) > 10;
  const isPreparing = order.status === "preparing";
  
  return (
    <div className={cn(
      "bg-card rounded-lg border p-4",
      order.status === "pending" && "border-border",
      order.status === "preparing" && "border-l-4 border-l-warning border-t-border border-r-border border-b-border",
      order.status === "ready" && "border-border"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{order.id}</span>
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
              <Clock className={cn("w-4 h-4", isUrgent ? "text-destructive" : "text-muted-foreground")} />
              <span className={isUrgent ? "text-destructive font-medium" : "text-muted-foreground"}>
                {order.time}
              </span>
            </>
          )}
        </div>
        
        {order.status === "pending" && (
          <Button 
            size="sm" 
            className="gap-1"
            onClick={() => onAction(order.id, "preparing")}
          >
            Start Prep
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
        
        {order.status === "preparing" && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAction(order.id, "ready")}
            className="gap-1"
          >
            Mark Ready
            <Check className="w-3 h-3" />
          </Button>
        )}
        
        {order.status === "ready" && (
          <Button 
            size="sm"
            className="gap-1"
            onClick={() => {}}
          >
            Complete
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
    tags: status === "pending" ? ["new"] : undefined,
  };
}

export default function KitchenDashboard() {
  const [activeFilter, setActiveFilter] = useState("All Orders");

  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: kitchenApi.getKitchenOrders,
    refetchInterval: 2_000,
    staleTime: 0,
  });

  const startCookingMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.startCooking(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Start cooking failed";
      toast({ title: "Start cooking failed", description: msg, variant: "destructive" });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.markOrderReady(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Mark ready failed";
      toast({ title: "Mark ready failed", description: msg, variant: "destructive" });
    },
  });
  
  const handleStatusChange = (id: Guid, newStatus: OrderStatus) => {
    if (newStatus === "preparing") {
      startCookingMutation.mutate(id);
      return;
    }
    if (newStatus === "ready") {
      markReadyMutation.mutate(id);
      return;
    }
  };

  const pendingOrders = (data?.pending ?? []).map((x) => mapOrder(x, "pending"));
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
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-info rounded-full" />
              <h2 className="font-semibold">New / Pending</h2>
              <Badge variant="secondary" className="rounded-full">{pendingOrders.length}</Badge>
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
            {!isLoading && !isError && pendingOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">No new orders.</div>
            )}
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.displayId,
                  customerName: order.customerName,
                  items: order.items,
                  time: order.time,
                  status: order.status,
                  tags: order.tags,
                }}
                onAction={() => handleStatusChange(order.id, "preparing")}
              />
            ))}
          </div>
        </div>
        
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
            {!isLoading && !isError && preparingOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">No orders in progress.</div>
            )}
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.displayId,
                  customerName: order.customerName,
                  items: order.items,
                  time: order.time,
                  status: order.status,
                  tags: order.tags,
                }}
                onAction={() => handleStatusChange(order.id, "ready")}
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
                  id: order.displayId,
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
      </div>
    </div>
  );
}
