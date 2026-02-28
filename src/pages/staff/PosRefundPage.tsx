import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ordersApi } from "@/lib/api";
import type { PosRefundInfoResponse } from "@/lib/api/types";

function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function hexOnly(raw: string): string {
  return raw.replace(/[^0-9a-fA-F-]/g, "").toLowerCase();
}

function isGuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
}

type KeypadField = "orderKey" | "amountReturned" | "reason" | null;

export default function PosRefundPage() {
  const navigate = useNavigate();

  const [orderKey, setOrderKey] = useState("");
  const [refundInfo, setRefundInfo] = useState<PosRefundInfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [amountReturnedDigits, setAmountReturnedDigits] = useState("");
  const [amountReturnedTouched, setAmountReturnedTouched] = useState(false);
  const [reason, setReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [keypadField, setKeypadField] = useState<KeypadField>(null);

  const [selectedQtyByOrderItemId, setSelectedQtyByOrderItemId] = useState<Record<string, number>>({});

  const computedRefundAmount = useMemo(() => {
    if (!refundInfo) return 0;
    const qtyMap = selectedQtyByOrderItemId;
    return refundInfo.items.reduce((sum, it) => {
      const qty = qtyMap[String(it.orderItemId)] ?? 0;
      if (!qty) return sum;
      return sum + qty * (it.unitPrice ?? 0);
    }, 0);
  }, [refundInfo, selectedQtyByOrderItemId]);

  const amountReturned = useMemo(
    () => (amountReturnedDigits ? Number(amountReturnedDigits) : 0),
    [amountReturnedDigits]
  );

  useEffect(() => {
    if (!refundInfo) return;
    if (amountReturnedTouched) return;
    setAmountReturnedDigits(String(Math.max(0, Math.floor(computedRefundAmount ?? 0))));
  }, [amountReturnedTouched, computedRefundAmount, refundInfo]);

  async function handleLookup() {
    const key = orderKey.trim();
    if (!key) {
      toast({
        title: "Thiếu mã đơn",
        description: "Vui lòng nhập 8 ký tự đầu (ví dụ: 44d2a80d) hoặc GUID đầy đủ.",
        variant: "destructive",
      });
      return;
    }

    setKeypadField(null);
    setLoadingInfo(true);

    try {
      const info = isGuid(key)
        ? await ordersApi.getPosOrderRefundInfo(key)
        : await ordersApi.getPosOrderRefundInfoByKey(key);

      setRefundInfo(info);
      setSelectedQtyByOrderItemId(
        Object.fromEntries((info.items ?? []).map((it) => [String(it.orderItemId), 0]))
      );
      setAmountReturnedTouched(false);
      setAmountReturnedDigits("0");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không tra cứu được đơn";
      toast({ title: "Tra cứu thất bại", description: message, variant: "destructive" });
      setRefundInfo(null);
      setSelectedQtyByOrderItemId({});
    } finally {
      setLoadingInfo(false);
    }
  }

  function keypadAppend(key: string) {
    if (!keypadField) return;

    const setValue = (updater: (prev: string) => string) => {
      if (keypadField === "orderKey") setOrderKey((prev) => updater(prev));
      else if (keypadField === "amountReturned") setAmountReturnedDigits((prev) => updater(prev));
      else if (keypadField === "reason") setReason((prev) => updater(prev));
    };

    if (key === "BACK") {
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    if (key === "CLEAR") {
      setValue(() => "");
      return;
    }

    if (keypadField === "orderKey") {
      setValue((prev) => hexOnly(prev + key).slice(0, 36));
      return;
    }

    if (keypadField === "amountReturned") {
      setValue((prev) => digitsOnly(prev + key).slice(0, 12));
      return;
    }

    if (keypadField === "reason") {
      setValue((prev) => {
        const next = (prev + key).replace(/\s+/g, " ");
        return next.slice(0, 120);
      });
    }
  }

  async function handleRefund() {
    if (!refundInfo) return;

    const items = Object.entries(selectedQtyByOrderItemId)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }))
      .filter((x) => x.quantity > 0);

    if (items.length === 0) {
      toast({
        title: "Chưa chọn món để hủy",
        description: "Vui lòng chọn số lượng hủy cho ít nhất 1 món.",
        variant: "destructive",
      });
      return;
    }

    if (computedRefundAmount <= 0) {
      toast({
        title: "Số tiền hoàn không hợp lệ",
        description: "Tổng tiền hoàn phải > 0",
        variant: "destructive",
      });
      return;
    }

    if (computedRefundAmount > refundInfo.refundableRemaining) {
      toast({
        title: "Vượt quá số tiền có thể hoàn",
        description: `Tối đa: ${formatVnd(refundInfo.refundableRemaining)}`,
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(amountReturned) || amountReturned < 0 || amountReturned > computedRefundAmount) {
      toast({
        title: "Số tiền thực trả không hợp lệ",
        description: "Số tiền thực trả phải nằm trong [0, Số tiền hoàn]",
        variant: "destructive",
      });
      return;
    }

    setSubmittingRefund(true);
    setKeypadField(null);

    try {
      const res = await ordersApi.refundPosOrderByItems(refundInfo.orderId, {
        items: items.map((x) => ({ orderItemId: x.orderItemId, quantity: x.quantity })),
        amountReturned,
        reason: reason.trim() || null,
      });

      toast({
        title: "Hoàn tiền thành công",
        description: `Biên lai hủy: ${String(res.refundReceiptId).slice(0, 8)} | ${formatVnd(res.refundAmount)}`,
      });

      navigate("/pos", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể hoàn tiền";
      toast({ title: "Hoàn tiền thất bại", description: message, variant: "destructive" });
    } finally {
      setSubmittingRefund(false);
    }
  }

  const isBusy = loadingInfo || submittingRefund;

  function setAllItemsToMax() {
    if (!refundInfo) return;
    setSelectedQtyByOrderItemId((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const it of refundInfo.items) {
        next[String(it.orderItemId)] = Math.max(0, it.refundableQuantity ?? 0);
      }
      return next;
    });
    setAmountReturnedTouched(false);
  }

  function adjustSelectedQty(orderItemId: string, delta: number) {
    if (!refundInfo) return;
    const item = refundInfo.items.find((x) => String(x.orderItemId) === orderItemId);
    if (!item) return;
    const max = Math.max(0, item.refundableQuantity ?? 0);
    setSelectedQtyByOrderItemId((prev) => {
      const current = prev[orderItemId] ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [orderItemId]: next };
    });
    setAmountReturnedTouched(false);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hủy bill / Hoàn tiền</CardTitle>
            <CardDescription>Tra cứu mã đơn, chọn số lượng hủy theo món, hệ thống sẽ tự tính số tiền hoàn.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="refund-order-key">Mã đơn</Label>
                <Input
                  id="refund-order-key"
                  value={orderKey}
                  onChange={(e) => setOrderKey(e.target.value)}
                  onFocus={() => setKeypadField("orderKey")}
                  placeholder="8 ký tự đầu (vd: 44d2a80d) hoặc GUID"
                />
              </div>
              <Button type="button" onClick={handleLookup} disabled={loadingInfo}>
                {loadingInfo ? "Đang tải..." : "Tra cứu"}
              </Button>
            </div>

            {refundInfo ? (
              <>
                <Separator />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Tổng tiền</div>
                  <div className="text-right font-medium">{formatVnd(refundInfo.totalPrice)}</div>

                  <div className="text-muted-foreground">Thanh toán</div>
                  <div className="text-right">{refundInfo.paymentMethod}</div>

                  <div className="text-muted-foreground">Trạng thái</div>
                  <div className="text-right">{refundInfo.status}</div>

                  <div className="text-muted-foreground">Đã hoàn</div>
                  <div className="text-right">{formatVnd(refundInfo.refundedTotal)}</div>

                  <div className="text-muted-foreground">Còn có thể hoàn</div>
                  <div className="text-right font-semibold">{formatVnd(refundInfo.refundableRemaining)}</div>

                  <div className="text-muted-foreground">Số tiền hoàn (tính theo món)</div>
                  <div className="text-right font-semibold">{formatVnd(computedRefundAmount)}</div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="refund-returned">Số tiền thực trả</Label>
                  <Input
                    id="refund-returned"
                    inputMode="numeric"
                    value={amountReturnedDigits}
                    onFocus={() => setKeypadField("amountReturned")}
                    onChange={(e) => {
                      setAmountReturnedTouched(true);
                      setAmountReturnedDigits(digitsOnly(e.target.value).slice(0, 12));
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="refund-reason">Lý do hoàn tiền</Label>
                  <Input
                    id="refund-reason"
                    value={reason}
                    onFocus={() => setKeypadField("reason")}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ví dụ: Khách đổi món / Sai bill"
                  />
                </div>
              </>
            ) : null}

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate("/pos", { replace: true })} disabled={isBusy}>
                Quay lại POS
              </Button>
              <Button type="button" onClick={handleRefund} disabled={!refundInfo || isBusy}>
                {submittingRefund ? "Đang hoàn..." : "Xác nhận hoàn"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Chi tiết đơn</CardTitle>
              <CardDescription>Chọn số lượng hủy cho từng món.</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={setAllItemsToMax} disabled={!refundInfo || isBusy}>
              Hủy toàn bộ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!refundInfo ? (
              <div className="text-sm text-muted-foreground">Tra cứu để xem danh sách món.</div>
            ) : refundInfo.items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đơn không có món.</div>
            ) : (
              <div className="space-y-2">
                {refundInfo.items.map((it) => {
                  const key = String(it.orderItemId);
                  const selected = selectedQtyByOrderItemId[key] ?? 0;
                  const max = Math.max(0, it.refundableQuantity ?? 0);
                  const disabled = isBusy || max === 0;
                  return (
                    <div key={key} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatVnd(it.unitPrice)} · SL mua: {it.quantity} · Còn hủy: {max}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => adjustSelectedQty(key, -1)}
                            disabled={disabled || selected <= 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="w-10 text-center font-medium">{selected}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => adjustSelectedQty(key, +1)}
                            disabled={disabled || selected >= max}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {refundInfo && refundInfo.refunds.length > 0 ? (
              <>
                <Separator />
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium mb-2">Lịch sử hoàn</div>
                  <div className="space-y-1">
                    {refundInfo.refunds.slice(0, 5).map((r) => (
                      <div key={r.refundReceiptId} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                        <span className="font-medium">-{formatVnd(r.refundAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {keypadField ? (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Bàn phím ({keypadField === "orderKey" ? "Mã đơn" : keypadField === "reason" ? "Lý do" : "Số tiền"})
            </CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={() => setKeypadField(null)}>
              Đóng
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {keypadField === "orderKey" ? (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "0",
                  "a",
                  "b",
                  "c",
                  "d",
                  "e",
                  "f",
                ].map((k) => (
                  <Button key={k} type="button" variant="outline" size="sm" onClick={() => keypadAppend(k)}>
                    {k}
                  </Button>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("BACK")}>
                  ⌫
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("CLEAR")}>
                  C
                </Button>
              </div>
            ) : keypadField === "reason" ? (
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {[
                  "q",
                  "w",
                  "e",
                  "r",
                  "t",
                  "y",
                  "u",
                  "i",
                  "o",
                  "p",
                  "a",
                  "s",
                  "d",
                  "f",
                  "g",
                  "h",
                  "j",
                  "k",
                  "l",
                  " ",
                  "z",
                  "x",
                  "c",
                  "v",
                  "b",
                  "n",
                  "m",
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "/",
                  "-",
                ].map((k, idx) => (
                  <Button
                    key={`${k}-${idx}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => keypadAppend(k)}
                    className={k === " " ? "col-span-3 sm:col-span-4" : undefined}
                  >
                    {k === " " ? "Space" : k}
                  </Button>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("BACK")}>
                  ⌫
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("CLEAR")}>
                  C
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
                  <Button key={k} type="button" variant="outline" size="sm" onClick={() => keypadAppend(k)}>
                    {k}
                  </Button>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("BACK")}>
                  ⌫
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => keypadAppend("CLEAR")}>
                  C
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
