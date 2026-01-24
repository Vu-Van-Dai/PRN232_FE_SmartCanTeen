import { useState } from "react";
import { Clock, ArrowRight, Check, CheckCheck, AlertTriangle, Leaf, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "preparing" | "ready";

interface Order {
  id: string;
  customerName: string;
  items: string[];
  time: string;
  status: OrderStatus;
  tags?: ("new" | "veg" | "allergy")[];
  readyTime?: string;
}

const initialOrders: Order[] = [
  { id: "ORD-405", customerName: "Leo Mitchell", items: ["2x Beef Burger", "1x Apple Juice"], time: "02:15", status: "pending", tags: ["new"] },
  { id: "ORD-407", customerName: "Sarah Jenkins", items: ["1x Peanut Cookie"], time: "12:45", status: "pending", tags: ["allergy"] },
  { id: "ORD-408", customerName: "Guest Teacher", items: ["1x Caesar Salad", "1x Water"], time: "00:30", status: "pending" },
  { id: "ORD-402", customerName: "Mia Wong", items: ["1x Veggie Wrap", "1x Orange Juice"], time: "08:30", status: "preparing", tags: ["veg"] },
  { id: "ORD-401", customerName: "Tom Baker", items: ["2x Fries"], time: "05:12", status: "preparing" },
  { id: "ORD-399", customerName: "Alice Chen", items: ["1x Pasta Carbonara"], time: "Ready 2m ago", status: "ready" },
  { id: "ORD-398", customerName: "Mr. Henderson", items: ["1x Club Sandwich", "1x Iced Coffee"], time: "Ready 5m ago", status: "ready" },
];

const filters = [
  { label: "All Orders", icon: null },
  { label: "Vegetarian", icon: Leaf },
  { label: "Allergy Alert", icon: AlertTriangle, variant: "destructive" as const },
];

function OrderCard({ order, onAction }: { order: Order; onAction: (id: string, newStatus: OrderStatus) => void }) {
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

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeFilter, setActiveFilter] = useState("All Orders");
  
  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => 
      o.id === id 
        ? { ...o, status: newStatus, time: newStatus === "ready" ? "Ready just now" : o.time } 
        : o
    ));
  };
  
  const pendingOrders = orders.filter(o => o.status === "pending");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  
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
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} onAction={handleStatusChange} />
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
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} order={order} onAction={handleStatusChange} />
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
            {readyOrders.map((order) => (
              <OrderCard key={order.id} order={order} onAction={handleStatusChange} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
