import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar as CalendarIcon, CheckCircle, Info, Minus, Plus, QrCode, Trash2, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ordersApi, walletApi } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import { useCart } from "@/lib/cart/CartContext";
import { cn } from "@/lib/utils";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

const CANTEEN_OPEN_MINUTES = 6 * 60; // 06:00
const CANTEEN_CLOSE_MINUTES = 22 * 60; // 22:00
const VN_OFFSET_MINUTES = 7 * 60; // UTC+7 (no DST)

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minutesOfDay(h: number, m: number) {
  return h * 60 + m;
}

function fmtVnYmd(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function buildUtcMsFromVnSelection(date: Date, hour: number, minute: number) {
  // Interpret selected Y-M-D and H:M as Vietnam local time, then convert to UTC.
  const y = date.getFullYear();
  const mon = date.getMonth() + 1;
  const d = date.getDate();
  return Date.UTC(y, mon - 1, d, hour - 7, minute, 0, 0);
}

function vnPartsFromUtcMs(utcMs: number) {
  const shifted = new Date(utcMs + VN_OFFSET_MINUTES * 60_000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    min: shifted.getUTCMinutes(),
  };
}

function addDaysYmd(y: number, m: number, d: number, days: number) {
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() };
}

function ceilTo5MinutesUtc(utcMs: number) {
  const step = 5 * 60_000;
  return Math.ceil(utcMs / step) * step;
}

export default function StudentCart() {
  const navigate = useNavigate();
  const cart = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "vnpay">("wallet");
  const [pickupMode, setPickupMode] = useState<"asap" | "scheduled">("asap");
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [pickupHour, setPickupHour] = useState<string>("06");
  const [pickupMinute, setPickupMinute] = useState<string>("00");

  const { data: walletMe } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: walletApi.getMyWallet,
    staleTime: 15_000,
    retry: false,
  });

  // Menu prices are VAT-inclusive. Derive VAT portion from total.
  const total = cart.subtotal;
  const vat = Math.round(total * (0.08 / 1.08));
  const subtotal = Math.max(0, total - vat);

  const itemLabel = useMemo(() => {
    const n = cart.itemCount;
    return n === 1 ? "(1 item)" : `(${n} items)`;
  }, [cart.itemCount]);

  const handlePlaceOrder = async () => {
    if (cart.lines.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm món vào giỏ trước khi đặt hàng.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "vnpay") {
      toast({
        title: "VNPay chưa hỗ trợ",
        description: "Phương thức thanh toán này hiện chưa được BE hỗ trợ cho đơn online.",
        variant: "destructive",
      });
      return;
    }

    try {
      let pickupTime: string | null | undefined = null;

      if (pickupMode === "scheduled") {
        if (!pickupDate) {
          toast({
            title: "Thiếu thời gian nhận",
            description: "Vui lòng chọn ngày và giờ nhận món.",
            variant: "destructive",
          });
          return;
        }

        const h = Number(pickupHour);
        const mi = Number(pickupMinute);
        if (!Number.isFinite(h) || !Number.isFinite(mi)) {
          toast({
            title: "Thời gian không hợp lệ",
            description: "Vui lòng chọn lại giờ/phút.",
            variant: "destructive",
          });
          return;
        }

        const minUtcMs = Date.now() + 2 * 60_000;
        const candidateUtcMs = buildUtcMsFromVnSelection(pickupDate, h, mi);

        // Do NOT auto-adjust invalid times; just notify the user.
        if (candidateUtcMs < minUtcMs) {
          toast({
            title: "Thời gian nhận chưa hợp lệ",
            description: "Vui lòng chọn thời gian nhận sau hiện tại ít nhất 2 phút.",
            variant: "destructive",
          });
          return;
        }

        const p = vnPartsFromUtcMs(candidateUtcMs);
        const mins = minutesOfDay(p.h, p.min);
        if (mins < CANTEEN_OPEN_MINUTES || mins > CANTEEN_CLOSE_MINUTES) {
          toast({
            title: "Ngoài giờ hoạt động",
            description: "Nhà ăn chỉ nhận đặt trước trong khung 06:00–22:00. Vui lòng chọn lại.",
            variant: "destructive",
          });
          return;
        }

        pickupTime = new Date(candidateUtcMs).toISOString();
      }

      const res = await ordersApi.createOnlineOrder({
        pickupTime,
        items: cart.lines.map((l) => ({ itemId: l.id, quantity: l.quantity })),
      });

      await ordersApi.payOnlineOrderWithWallet(res.orderId);
      cart.clear();

      setPickupMode("asap");
      setPickupDate(undefined);
      setPickupHour("06");
      setPickupMinute("00");

      toast({
        title: "Đặt hàng thành công",
        description: "Thanh toán thành công.",
      });

      navigate("/student/orders", { replace: true });
    } catch (err) {
      // Provide clearer error details (status + message + actionable hint).
      if (err instanceof ApiError) {
        console.error("Checkout API error", { status: err.status, body: err.body });

        const rawMessage = err.message || "Thanh toán thất bại";
        const missingMatch = /item\s+([0-9a-fA-F-]{36})\s+not\s+found/i.exec(rawMessage);
        const missingId = missingMatch?.[1]?.toLowerCase();
        const missingLine = missingId
          ? cart.lines.find((l) => l.id.toLowerCase() === missingId)
          : undefined;

        if (missingId) {
          // Cart has a stale item (deleted/disabled in menu). Remove it to help user recover.
          cart.removeItem(missingId);

          toast({
            title: `Thanh toán thất bại (HTTP ${err.status})`,
            description: missingLine
              ? `Món "${missingLine.name}" không còn tồn tại trong menu. Đã tự động xoá khỏi giỏ hàng.`
              : `Item ${missingId} không còn tồn tại trong menu. Đã tự động xoá khỏi giỏ hàng.`,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: `Thanh toán thất bại (HTTP ${err.status})`,
          description: rawMessage,
          variant: "destructive",
        });
        return;
      }

      const msg = err instanceof Error ? err.message : "Thanh toán thất bại";
      console.error("Checkout error", err);
      toast({ title: "Thanh toán thất bại", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/student/home" className="hover:text-foreground">
          Trang Chủ
        </Link>
        <span>/</span>
        <Link to="/student/menu" className="hover:text-foreground">
          Menu
        </Link>
        <span>/</span>
        <span className="text-foreground">Giỏ Hàng</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Giỏ Hàng</h1>
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
            <h3 className="font-semibold text-lg mb-4">Tóm Tắt Đơn Hàng</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm Tính</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Thuế VAT (8%)</span>
                <span>{formatVND(vat)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-xl text-primary">{formatVND(total)}</span>
              </div>
            </div>

              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Thời gian nhận món
                </p>

                <RadioGroup value={pickupMode} onValueChange={(v) => setPickupMode(v as "asap" | "scheduled")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="asap" id="pickup-asap" />
                    <Label htmlFor="pickup-asap">Lấy ngay</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="pickup-scheduled" />
                      <Label htmlFor="pickup-scheduled">Hẹn giờ đến lấy</Label>
                  </div>
                </RadioGroup>

                {pickupMode === "scheduled" && (
                  <div className="mt-3">
                    <Label className="text-sm">Chọn ngày</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "mt-2 w-full justify-start text-left font-normal",
                            !pickupDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pickupDate ? fmtVnYmd(pickupDate) : "Chọn ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} initialFocus />
                      </PopoverContent>
                    </Popover>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Giờ (24h)</Label>
                        <Select value={pickupHour} onValueChange={setPickupHour}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Giờ" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }).map((_, i) => (
                              <SelectItem key={i} value={pad2(i)}>
                                {pad2(i)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Phút</Label>
                        <Select value={pickupMinute} onValueChange={setPickupMinute}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Phút" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }).map((_, i) => {
                              const v = pad2(i * 5);
                              return (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Giờ mở cửa từ 06:00–22:00 hàng ngày.
                    </p>
                  </div>
                )}
              </div>
              
            <p className="mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 ">Payment Method</p>

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
                    <p className="text-sm font-medium">Ví Nội Bộ</p>
                    <p className="text-xs text-primary">
                      Số dư: {typeof walletMe?.balance === "number" ? formatVND(Number(walletMe.balance)) : "—"}
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
                    <p className="text-xs text-muted-foreground">Quét mã để thanh toán</p>
                  </div>
                </div>
                {paymentMethod === "vnpay" && <CheckCircle className="w-5 h-5 text-primary" />}
              </button>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handlePlaceOrder} disabled={cart.lines.length === 0}>
              Đặt Hàng
              <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs">{formatVND(total)}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
