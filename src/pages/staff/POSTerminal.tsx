import { useState } from "react";
import { Minus, Plus, Trash2, CreditCard, QrCode, Printer, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface POSMenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface OrderItem extends POSMenuItem {
  quantity: number;
}

const categories = ["All Items", "Hot Meals", "Sandwiches", "Drinks", "Snacks"];

const menuItems: POSMenuItem[] = [
  { id: "1", name: "Chicken Burger", price: 4.50, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop", category: "Hot Meals" },
  { id: "2", name: "Veggie Wrap", price: 3.00, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop", category: "Sandwiches" },
  { id: "3", name: "Apple Juice", price: 1.50, image: "https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=200&h=200&fit=crop", category: "Drinks" },
  { id: "4", name: "Fruit Cup", price: 2.00, image: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=200&h=200&fit=crop", category: "Snacks" },
  { id: "5", name: "Pizza Slice", price: 2.50, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop", category: "Hot Meals" },
  { id: "6", name: "Chocolate Milk", price: 1.75, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop", category: "Drinks" },
  { id: "7", name: "Garden Salad", price: 3.50, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop", category: "Snacks" },
  { id: "8", name: "Hot Dog", price: 3.00, image: "https://images.unsplash.com/photo-1612392062422-ef19b42f74df?w=200&h=200&fit=crop", category: "Hot Meals" },
];

const categoryColors: Record<string, string> = {
  "Hot Meals": "bg-blue-100",
  "Sandwiches": "bg-green-100",
  "Drinks": "bg-amber-100",
  "Snacks": "bg-rose-100",
};

export default function POSTerminal() {
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { ...menuItems[0], quantity: 2 },
    { ...menuItems[2], quantity: 1 },
  ]);
  const orderNumber = 293;
  
  const filteredItems = activeCategory === "All Items" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);
  
  const addToOrder = (item: POSMenuItem) => {
    const existing = orderItems.find(o => o.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map(o => 
        o.id === item.id ? { ...o, quantity: o.quantity + 1 } : o
      ));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };
  
  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(orderItems.map(o => {
      if (o.id === id) {
        const newQty = o.quantity + delta;
        return newQty > 0 ? { ...o, quantity: newQty } : o;
      }
      return o;
    }).filter(o => o.quantity > 0));
  };
  
  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(o => o.id !== id));
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "filter-chip gap-2",
                activeCategory === cat && "filter-chip-active"
              )}
            >
              {cat === "All Items" && "🍽️"}
              {cat === "Hot Meals" && "🔥"}
              {cat === "Sandwiches" && "🥪"}
              {cat === "Drinks" && "🥤"}
              {cat === "Snacks" && "🍪"}
              {cat}
            </button>
          ))}
        </div>
        
        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToOrder(item)}
              className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow text-left"
            >
              <div className={cn("aspect-square", categoryColors[item.category] || "bg-muted")}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm">{item.name}</h3>
                <p className="text-sm text-primary font-semibold">${item.price.toFixed(2)}</p>
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
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} ea</p>
                  </div>
                  <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
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
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="font-bold text-xl">${total.toFixed(2)}</span>
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
