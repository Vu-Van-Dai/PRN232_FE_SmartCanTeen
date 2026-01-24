import { useState } from "react";
import { Trash2, Minus, Plus, Wallet, QrCode, Info, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}

const initialCartItems: CartItem[] = [
  {
    id: "1",
    name: "Grilled Sandwich",
    description: "Spicy chicken with cheddar cheese and signature sauce.",
    price: 25000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=150&fit=crop"
  },
  {
    id: "2",
    name: "Orange Juice",
    description: "Freshly squeezed, no sugar added.",
    price: 15000,
    quantity: 2,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=150&fit=crop"
  },
  {
    id: "3",
    name: "Fruit Salad",
    description: "Seasonal fruits with yogurt dressing.",
    price: 20000,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=200&h=150&fit=crop"
  },
];

export default function StudentCart() {
  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "vnpay">("wallet");
  const walletBalance = 150000;
  
  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };
  
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = subtotal * 0.08;
  const total = subtotal + vat;
  
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">▶</span>
          </div>
          <span className="font-semibold">School Canteen</span>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Menu</Link>
          <Link to="/cart" className="text-sm text-primary font-medium">Cart</Link>
          <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">Orders</Link>
          <Link to="/wallet" className="text-sm text-muted-foreground hover:text-foreground">Wallet</Link>
        </nav>
        
        <div className="flex items-center gap-3">
          <button className="relative p-2">
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">2</span>
            🔔
          </button>
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-muted-foreground">Canteen</span>
          <span>/</span>
          <span className="text-foreground">Cart</span>
        </div>
        
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <span className="text-primary font-medium">({items.length} items)</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-semibold">{formatVND(item.price)}</p>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (8%)</span>
                  <span>{formatVND(vat)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-xl text-primary">{formatVND(total)}</span>
                </div>
              </div>
              
              {/* Payment Method */}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Payment Method
              </p>
              
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setPaymentMethod("wallet")}
                  className={cn(
                    "w-full p-3 rounded-lg border flex items-center justify-between transition-colors",
                    paymentMethod === "wallet" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Internal Wallet</p>
                      <p className="text-xs text-primary">Balance: {formatVND(walletBalance)}</p>
                    </div>
                  </div>
                  {paymentMethod === "wallet" && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </button>
                
                <button
                  onClick={() => setPaymentMethod("vnpay")}
                  className={cn(
                    "w-full p-3 rounded-lg border flex items-center justify-between transition-colors",
                    paymentMethod === "vnpay" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">VNPay QR</p>
                      <p className="text-xs text-muted-foreground">Scan to pay</p>
                    </div>
                  </div>
                  {paymentMethod === "vnpay" && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
              
              <Button className="w-full gap-2" size="lg">
                Place Order
                <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs">
                  {formatVND(total)}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                By placing an order, you agree to our{" "}
                <a href="#" className="text-primary underline">Terms of Service</a>.
              </p>
            </div>
            
            {/* Help */}
            <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Need help with your order?</p>
                <p className="text-xs text-muted-foreground">
                  Contact the canteen support at{" "}
                  <a href="mailto:support@schoolcanteen.com" className="text-primary underline">
                    support@schoolcanteen.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
