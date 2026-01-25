import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Info, Minus, Plus, QrCode, Trash2, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ordersApi, walletApi } from "@/lib/api";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

export default function StudentCart() {
  const navigate = useNavigate();
  const cart = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "vnpay">("wallet");

  const { data: walletMe } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: walletApi.getMyWallet,
    staleTime: 15_000,
    retry: false,
  });

  const subtotal = cart.subtotal;
  const vat = subtotal * 0.08;
  const total = subtotal + vat;

  const itemLabel = useMemo(() => {
    const n = cart.itemCount;
    return n === 1 ? "(1 item)" : `(${n} items)`;
  }, [cart.itemCount]);

  const handlePlaceOrder = async () => {
    if (cart.lines.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items before placing an order.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "vnpay") {
      toast({
        title: "VNPay not available",
        description: "This payment method is not implemented for online orders in BE yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await ordersApi.createOnlineOrder({
        items: cart.lines.map((l) => ({ itemId: l.id, quantity: l.quantity })),
      });

      await ordersApi.payOnlineOrderWithWallet(res.orderId);
      cart.clear();

      toast({
        title: "Order placed",
        description: "Payment successful.",
      });

      navigate("/student/orders", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      toast({
        title: "Checkout failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/student/home" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link to="/student/menu" className="hover:text-foreground">
          Menu
        </Link>
        <span>/</span>
        <span className="text-foreground">Cart</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="text-primary font-medium">{itemLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.lines.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="font-medium mb-2">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mb-4">Go to the menu to add items.</p>
              <Button asChild>
                <Link to="/student/menu">Browse menu</Link>
              </Button>
            </div>
          ) : (
            cart.lines.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {!!item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => cart.removeItem(item.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="font-semibold">{formatVND(item.price)}</p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cart.setQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => cart.setQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Payment Method</p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => setPaymentMethod("wallet")}
                className={cn(
                  "w-full p-3 rounded-lg border flex items-center justify-between transition-colors",
                  paymentMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Internal Wallet</p>
                    <p className="text-xs text-primary">
                      Balance: {typeof walletMe?.balance === "number" ? formatVND(Number(walletMe.balance)) : "—"}
                    </p>
                  </div>
                </div>
                {paymentMethod === "wallet" && <CheckCircle className="w-5 h-5 text-primary" />}
              </button>

              <button
                onClick={() => setPaymentMethod("vnpay")}
                className={cn(
                  "w-full p-3 rounded-lg border flex items-center justify-between transition-colors",
                  paymentMethod === "vnpay" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
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
                {paymentMethod === "vnpay" && <CheckCircle className="w-5 h-5 text-primary" />}
              </button>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handlePlaceOrder} disabled={cart.lines.length === 0}>
              Place Order
              <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs">{formatVND(total)}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-3">
              By placing an order, you agree to our{" "}
              <a href="#" className="text-primary underline">
                Terms of Service
              </a>
              .
            </p>
          </div>

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
  );
}
