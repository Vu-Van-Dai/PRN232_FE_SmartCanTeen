import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, CreditCard, X } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { categoriesApi, menuItemsApi, ordersApi } from "@/lib/api";
import { apiRequest } from "@/lib/api/http";
import type { CategoryResponse, MenuItemResponse } from "@/lib/api/types";

const POS_DRAFT_STORAGE_KEY = "sc_pos_draft_order_v1";

type PosDraftOrder = {
  createdAt: string;
  orderItems: Array<OrderItem>;
  pendingOrderId?: string;
  pendingPayosOrderCode?: number;
  pendingPayosQrCode?: string;
};

function loadPosDraftOrder(): PosDraftOrder | null {
  try {
    const raw = localStorage.getItem(POS_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosDraftOrder;
    if (!parsed || !Array.isArray(parsed.orderItems)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePosDraftOrder(draft: PosDraftOrder) {
  try {
    localStorage.setItem(POS_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

function clearPosDraftOrder() {
  try {
    localStorage.removeItem(POS_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getPendingOrderIdFromDraft(): string | null {
  const draft = loadPosDraftOrder();
  return draft?.pendingOrderId ?? null;
}

function getPendingPayosOrderCodeFromDraft(): number | null {
  const draft = loadPosDraftOrder();
  return typeof draft?.pendingPayosOrderCode === "number" ? draft.pendingPayosOrderCode : null;
}

function getPendingPayosQrCodeFromDraft(): string | null {
  const draft = loadPosDraftOrder();
  return typeof draft?.pendingPayosQrCode === "string" ? draft.pendingPayosQrCode : null;
}

interface OrderItem extends MenuItemResponse {
  quantity: number;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function parseVndInput(raw: string): number {
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  if (!digitsOnly) return 0;
  const n = Number(digitsOnly);
  return Number.isFinite(n) ? n : 0;
}

function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function formatVndNumber(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Vui lòng thử lại.";
}

const fallbackImage =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop";

export default function POSTerminal() {
  const location = useLocation();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrWaitedLong, setQrWaitedLong] = useState(false);

  const [lastCashSummary, setLastCashSummary] = useState<null | { received: number; change: number }>(null);

  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoDialogTitle, setInfoDialogTitle] = useState<string>("");
  const [infoDialogDescription, setInfoDialogDescription] = useState<ReactNode | null>(null);

  const showInfoDialog = (title: string, description?: ReactNode) => {
    setInfoDialogTitle(title);
    setInfoDialogDescription(description ?? null);
    setInfoDialogOpen(true);
  };

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelDialogMode, setCancelDialogMode] = useState<"order" | "payment">("order");

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
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const draft = loadPosDraftOrder();
    return draft?.orderItems ?? [];
  });

  const [pendingOrderId, setPendingOrderId] = useState<string | null>(() => getPendingOrderIdFromDraft());
  const [pendingPayosOrderCode, setPendingPayosOrderCode] = useState<number | null>(() => getPendingPayosOrderCodeFromDraft());
  const [pendingPayosQrCode, setPendingPayosQrCode] = useState<string | null>(() => getPendingPayosQrCodeFromDraft());

  const orderNumber = 293;

  useEffect(() => {
    // Persist draft so leaving the POS page (PayOS redirect) doesn't lose the order.
    if (orderItems.length === 0) {
      clearPosDraftOrder();
      setPendingOrderId(null);
      setPendingPayosOrderCode(null);
      setPendingPayosQrCode(null);
      return;
    }

    const existing = loadPosDraftOrder();
    savePosDraftOrder({
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      orderItems,
      pendingOrderId: pendingOrderId ?? existing?.pendingOrderId,
      pendingPayosOrderCode: pendingPayosOrderCode ?? existing?.pendingPayosOrderCode,
      pendingPayosQrCode: pendingPayosQrCode ?? existing?.pendingPayosQrCode,
    });
  }, [orderItems, pendingOrderId, pendingPayosOrderCode, pendingPayosQrCode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payos = params.get("payos");
    if (!payos) return;

    if (payos === "paid") {
      showInfoDialog("Thanh toán thành công", "Đã thanh toán QR. Đơn đã được tạo trong hệ thống.");
      setOrderItems([]);
      clearPosDraftOrder();
      setPendingOrderId(null);
      setPendingPayosOrderCode(null);
      setPendingPayosQrCode(null);
    }

    if (payos === "cancel") {
      setCancelDialogMode("payment");
      setCancelDialogOpen(true);
    }

    // Remove PayOS params so the dialog doesn't re-trigger on refresh/back.
    params.delete("payos");
    const next = params.toString();
    const nextUrl = next ? `/pos?${next}` : "/pos";
    window.history.replaceState(null, "", nextUrl);
  }, [location.search]);

  const createQrOrderMutation = useMutation({
    mutationFn: async () => {
      if (orderItems.length === 0) throw new Error("Chưa có món trong đơn.");

      const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      return ordersApi.createPosOfflineOrder({
        totalPrice,
        items: orderItems.map((i) => ({ itemId: i.id, quantity: i.quantity })),
      });
    },
    onSuccess: (res) => {
      const nextOrderId = res?.orderId;
      const nextOrderCode = typeof res?.orderCode === "number" ? res.orderCode : null;
      const nextQrCode = typeof res?.qrCode === "string" ? res.qrCode : null;

      if (!nextOrderId) {
        showInfoDialog("Không tạo được QR", "Thiếu thông tin đơn hàng từ hệ thống.");
        return;
      }

      if (!nextQrCode) {
        showInfoDialog("Không tạo được QR", "Hệ thống không trả về nội dung QR.");
        return;
      }

      setPendingOrderId(nextOrderId);
      setPendingPayosOrderCode(nextOrderCode);
      setPendingPayosQrCode(nextQrCode);

      savePosDraftOrder({
        createdAt: new Date().toISOString(),
        orderItems,
        pendingOrderId: nextOrderId,
        pendingPayosOrderCode: nextOrderCode ?? undefined,
        pendingPayosQrCode: nextQrCode,
      });

      setQrDialogOpen(true);
    },
    onError: (err: unknown) => {
      showInfoDialog("Tạo QR thất bại", getErrorMessage(err));
    },
  });

  const createCashOrderMutation = useMutation({
    mutationFn: async () => {
      if (orderItems.length === 0) throw new Error("Chưa có món trong đơn.");

      const pendingOrderId = getPendingOrderIdFromDraft();
      if (pendingOrderId) {
        await ordersApi.payExistingPosOrderByCash(pendingOrderId);
        return { orderId: pendingOrderId };
      }

      const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return ordersApi.createPosOfflineOrderCash({
        totalPrice,
        items: orderItems.map((i) => ({ itemId: i.id, quantity: i.quantity })),
      });
    },
    onSuccess: () => {
      const description =
        lastCashSummary && lastCashSummary.received > 0 ? (
          <div className="space-y-0.5">
            <div className="text-sm text-muted-foreground">
              Tiền mặt: <span className="font-medium text-foreground">{formatVND(lastCashSummary.received)}</span>
            </div>
            <div className="text-sm font-semibold leading-tight text-destructive">
              Tiền thừa: {formatVND(Math.max(0, lastCashSummary.change))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Đơn đã được ghi nhận.</div>
        );

      showInfoDialog("Thanh toán thành công", description);
      setOrderItems([]);
      clearPosDraftOrder();
      setPendingOrderId(null);
      setPendingPayosOrderCode(null);
      setPendingPayosQrCode(null);
      setLastCashSummary(null);
    },
    onError: (err: unknown) => {
      showInfoDialog("Thanh toán CASH thất bại", getErrorMessage(err));
    },
  });

  const cancelPendingOrderMutation = useMutation({
    mutationFn: async () => {
      const pendingOrderId = getPendingOrderIdFromDraft();
      if (!pendingOrderId) return;
      await ordersApi.cancelExistingPosOrder(pendingOrderId);
    },
    onSuccess: () => {
      clearPosDraftOrder();
      setOrderItems([]);
      setPendingOrderId(null);
      setPendingPayosOrderCode(null);
      setPendingPayosQrCode(null);
      setQrDialogOpen(false);
      showInfoDialog("Đã hủy đơn", "Đơn đã được hủy trong hệ thống.");
    },
    onError: (err: unknown) => {
      showInfoDialog("Hủy đơn thất bại", getErrorMessage(err));
    },
  });

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
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  const [cashDigits, setCashDigits] = useState<string>("");
  const cashReceived = useMemo(() => (cashDigits ? Number(cashDigits) : 0), [cashDigits]);
  const cashChange = cashReceived - total;

  const paymentStatusQuery = useQuery({
    queryKey: ["pos", "payment-status", pendingOrderId],
    queryFn: () => ordersApi.getPosOrderPaymentStatus(pendingOrderId as string),
    enabled: qrDialogOpen && Boolean(pendingOrderId),
    refetchInterval: 2000,
  });

  const confirmPayosPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!pendingPayosOrderCode) throw new Error("Thiếu orderCode PayOS.");
      await apiRequest<void>("/api/payos/confirm", {
        method: "POST",
        query: { orderCode: pendingPayosOrderCode, status: "PAID" },
      });
    },
    onSuccess: async () => {
      await paymentStatusQuery.refetch();
    },
    onError: (err: unknown) => {
      showInfoDialog("Xác nhận thanh toán thất bại", getErrorMessage(err));
    },
  });

  useEffect(() => {
    if (!qrDialogOpen) {
      setQrWaitedLong(false);
      return;
    }

    const t = window.setTimeout(() => setQrWaitedLong(true), 15000);
    return () => window.clearTimeout(t);
  }, [qrDialogOpen]);

  useEffect(() => {
    if (!qrDialogOpen) return;
    if (!paymentStatusQuery.data?.isPaid) return;

    setQrDialogOpen(false);
    showInfoDialog("Thanh toán thành công", "Đã thanh toán QR. Đơn đã được tạo trong hệ thống.");
    setOrderItems([]);
    clearPosDraftOrder();
    setPendingOrderId(null);
    setPendingPayosOrderCode(null);
    setPendingPayosQrCode(null);
  }, [paymentStatusQuery.data, qrDialogOpen]);
  
  return (
    <>
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
                  src={item.imageUrls?.[0] ?? item.imageUrl ?? fallbackImage} 
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
                <img
                  src={item.imageUrls?.[0] ?? item.imageUrl ?? fallbackImage}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatVND(item.price)} / món</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{formatVND(item.price * item.quantity)}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label="Xóa món"
                      title="Xóa món"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => setPaymentDialogOpen(true)}
            disabled={orderItems.length === 0 && !pendingOrderId}
          >
            <CreditCard className="h-5 w-5" />
            Thanh toán
          </Button>
        </div>
      </div>
    </div>
    
    <AlertDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">{infoDialogTitle}</AlertDialogTitle>
          {infoDialogDescription ? (
            <AlertDialogDescription className="whitespace-pre-line">{infoDialogDescription}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction className="min-w-[160px]" onClick={() => setInfoDialogOpen(false)}>
            Hoàn tất
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {cancelDialogMode === "payment" ? "Đã hủy thanh toán" : "Hủy đơn"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {cancelDialogMode === "payment"
              ? "Đơn vẫn được giữ lại. Bạn có thể chọn CASH để thanh toán hoặc hủy đơn."
              : "Bạn có chắc muốn hủy đơn này?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel disabled={cancelPendingOrderMutation.isPending}>Quay lại</AlertDialogCancel>
          <AlertDialogAction
            disabled={cancelPendingOrderMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              cancelPendingOrderMutation.mutate();
              setCancelDialogOpen(false);
            }}
          >
            {cancelPendingOrderMutation.isPending ? "Đang hủy..." : "Hủy đơn"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
          <DialogDescription>Chọn Tiền mặt hoặc QR để thanh toán.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setPaymentDialogOpen(false);
              setCashDigits("");
              setCashDialogOpen(true);
            }}
            disabled={createCashOrderMutation.isPending || (orderItems.length === 0 && !pendingOrderId)}
          >
            Tiền mặt
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setPaymentDialogOpen(false);

              if (pendingOrderId) {
                if (pendingPayosQrCode) {
                  setQrDialogOpen(true);
                } else {
                  showInfoDialog(
                    "Không thể tạo lại QR",
                    "Đơn đang Pending nhưng không có dữ liệu QR để hiển thị. Vui lòng chọn Tiền mặt hoặc Hủy đơn."
                  );
                }
                return;
              }

              createQrOrderMutation.mutate();
            }}
            disabled={createQrOrderMutation.isPending || orderItems.length === 0}
          >
            QR
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="destructive"
            onClick={() => {
              setPaymentDialogOpen(false);
              setCancelDialogMode("order");
              setCancelDialogOpen(true);
            }}
            disabled={cancelPendingOrderMutation.isPending || (!pendingOrderId && orderItems.length === 0)}
          >
            Hủy đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
      <DialogContent
        className="max-w-sm [&>button]:hidden flex max-h-[85vh] flex-col"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between gap-3">
          <DialogHeader className="space-y-1">
            <DialogTitle>Thanh toán tiền mặt</DialogTitle>
          </DialogHeader>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mt-1"
            onClick={() => {
              setCashDialogOpen(false);
              setPaymentDialogOpen(true);
            }}
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <Input
              id="cash-received"
              inputMode="numeric"
              value={cashDigits}
              onChange={(e) => setCashDigits(digitsOnly(e.target.value).slice(0, 12))}
              className="mt-1 h-11 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Button
                key={d}
                type="button"
                variant="secondary"
                className="h-12 text-lg font-semibold"
                onClick={() => setCashDigits((prev) => (prev + d).replace(/^0+/, "").slice(0, 12))}
              >
                {d}
              </Button>
            ))}

            <Button
              type="button"
              variant="secondary"
              className="h-12 text-lg font-semibold"
              onClick={() => setCashDigits((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))}
            >
              ⌫
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="h-12 text-lg font-semibold"
              onClick={() => setCashDigits((prev) => (prev + "0").replace(/^0+/, "").slice(0, 12))}
            >
              0
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="h-12 text-lg font-semibold"
              onClick={() => setCashDigits((prev) => (prev + "00").replace(/^0+/, "").slice(0, 12))}
            >
              00
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            className="h-12 w-full"
            onClick={() => {
              setCashDialogOpen(false);
              setLastCashSummary({ received: cashReceived, change: cashChange });
              createCashOrderMutation.mutate();
            }}
            disabled={createCashOrderMutation.isPending || cashReceived < total || (orderItems.length === 0 && !pendingOrderId)}
          >
            {createCashOrderMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Quét QR để thanh toán</DialogTitle>
          <DialogDescription>
            Tổng thanh toán: <span className="font-medium">{formatVND(total)}</span>
            {pendingPayosOrderCode ? <span className="block">Mã: {pendingPayosOrderCode}</span> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="rounded-lg border bg-white p-4">
            {pendingPayosQrCode ? <QRCode value={pendingPayosQrCode} size={220} /> : <div>Không có QR</div>}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {paymentStatusQuery.isError ? (
            "Không kiểm tra được trạng thái thanh toán."
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Đang chờ thanh toán…
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
            Quay lại
          </Button>
          <Button
            variant="outline"
            onClick={() => paymentStatusQuery.refetch()}
            disabled={paymentStatusQuery.isFetching}
          >
            Kiểm tra lại
          </Button>
          <Button
            onClick={() => confirmPayosPaymentMutation.mutate()}
            disabled={!pendingPayosOrderCode || confirmPayosPaymentMutation.isPending}
          >
            {confirmPayosPaymentMutation.isPending ? "Đang xác nhận…" : "Xác nhận thanh toán"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setQrDialogOpen(false);
              setCancelDialogMode("order");
              setCancelDialogOpen(true);
            }}
          >
            Hủy đơn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
