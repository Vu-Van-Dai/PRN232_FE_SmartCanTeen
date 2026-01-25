import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, CreditCard, QrCode, Printer, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoriesApi, menuItemsApi } from "@/lib/api";
import type { CategoryResponse, MenuItemResponse } from "@/lib/api/types";

interface OrderItem extends MenuItemResponse {
  quantity: number;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

const fallbackImage =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop";

export default function POSTerminal() {
  const categoriesQuery = useQuery({
    queryKey: ["pos", "categories"],
    queryFn: () => categoriesApi.getCategories(),
  });

  const menuItemsQuery = useQuery({
    queryKey: ["pos", "menu-items"],
    queryFn: () => menuItemsApi.getMenuItems(),
  });

  const categories = useMemo<CategoryResponse[]>(() => {
    return (categoriesQuery.data ?? []).filter((c) => c.isActive);
  }, [categoriesQuery.data]);

  const menuItems = useMemo<MenuItemResponse[]>(() => {
    return (menuItemsQuery.data ?? []).filter((m) => m.isActive);
  }, [menuItemsQuery.data]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const orderNumber = 293;

  const filteredItems = useMemo(() => {
    if (activeCategoryId === "all") return menuItems;
    return menuItems.filter((m) => m.categoryId === activeCategoryId);
  }, [activeCategoryId, menuItems]);

  const addToOrder = (item: MenuItemResponse) => {
    const existing = orderItems.find((o) => o.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map((o) => (o.id === item.id ? { ...o, quantity: o.quantity + 1 } : o)));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };
  
  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((o) => {
          if (o.id === id) {
            const newQty = o.quantity + delta;
            return newQty > 0 ? { ...o, quantity: newQty } : o;
          }
          return o;
        })
        .filter((o) => o.quantity > 0)
    );
  };
  
  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter((o) => o.id !== id));
  };
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Menu Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Category Filters */}
        <div className="flex gap-2 mb-6">
          <button
            key="all"
            onClick={() => setActiveCategoryId("all")}
            className={cn("filter-chip gap-2", activeCategoryId === "all" && "filter-chip-active")}
          >
            🍽️ All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "filter-chip gap-2",
                activeCategoryId === cat.id && "filter-chip-active"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {menuItemsQuery.isLoading ? (
            <div className="col-span-full text-muted-foreground">Đang tải menu…</div>
          ) : menuItemsQuery.isError ? (
            <div className="col-span-full text-destructive">Không tải được menu từ hệ thống.</div>
          ) : null}

          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToOrder(item)}
              className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow text-left"
            >
              <div className={cn("aspect-square", "bg-muted")}>
                <img 
                  src={item.imageUrl || fallbackImage} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm">{item.name}</h3>
                <p className="text-sm text-primary font-semibold">{formatVND(item.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Order Panel */}
      <div className="w-80 bg-card border-l border-border flex flex-col">
        {/* Order Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">Order #{orderNumber}</h2>
            <Badge variant="outline" className="text-primary border-primary">
              Dining In
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>🕐</span>
            <span>12:42 PM</span>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {orderItems.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={item.imageUrl || fallbackImage} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatVND(item.price)} / món</p>
                  </div>
                  <p className="font-semibold text-sm">{formatVND(item.price * item.quantity)}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="border-t border-border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span>{formatVND(tax)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="font-bold text-xl">{formatVND(total)}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-4 gap-2">
            <button className="aspect-square rounded-lg border border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-1 hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="text-xs text-destructive">Cancel</span>
            </button>
            <button className="aspect-square rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors">
              <Printer className="w-5 h-5" />
              <span className="text-xs">Print</span>
            </button>
            <button className="aspect-square rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors">
              <QrCode className="w-5 h-5" />
              <span className="text-xs">QR Pay</span>
            </button>
            <button className="aspect-square rounded-lg bg-primary text-primary-foreground flex flex-col items-center justify-center gap-1 hover:bg-primary/90 transition-colors">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">CASH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
