import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Calendar, Download, Eye, FileText, LockKeyhole, ReceiptText, RefreshCcw } from "lucide-react";
import type { Guid, ShiftOrderListItem, ShiftRefundReceipt } from "@/lib/api/types";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ManagerReportsPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(() => toYmd(new Date()));

  const [shiftOpen, setShiftOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<Guid | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ShiftOrderListItem | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  const [selectedRefund, setSelectedRefund] = useState<ShiftRefundReceipt | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  const [salesOpen, setSalesOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const dailyQuery = useQuery({
    queryKey: ["reports", "daily", date],
    queryFn: () => reportsApi.getDailyReport(date),
  });

  const statusQuery = useQuery({
    queryKey: ["reports", "day-status", date],
    queryFn: () => reportsApi.getDayStatus(date),
  });

  const closeMutation = useMutation({
    mutationFn: () => reportsApi.closeDay(date),
    onSuccess: () => {
      toast({ title: "Đã chốt ngày", description: `Ngày ${date} đã được chốt.` });
      qc.invalidateQueries({ queryKey: ["reports", "daily"] });
      qc.invalidateQueries({ queryKey: ["reports", "day-status"] });
      qc.invalidateQueries({ queryKey: ["reports", "daily-sales"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể chốt ngày";
      toast({ title: "Chốt ngày thất bại", description: message, variant: "destructive" });
    },
  });

  const summary = dailyQuery.data?.summary;
  const shifts = dailyQuery.data?.shifts ?? [];
  const isClosed = statusQuery.data?.isClosed ?? false;
  const isLockedNow = statusQuery.data?.isLockedNow ?? false;

  const hasActiveShift = useMemo(() => {
    return shifts.some((s) => String(s.status).toLowerCase() !== "closed");
  }, [shifts]);

  const canCloseDay = !isClosed && !hasActiveShift;

  const totals = useMemo(() => {
    const totalCash = summary?.totalCash ?? 0;
    const totalQr = summary?.totalQr ?? 0;
    const totalOnline = summary?.totalOnline ?? 0;
    const totalRevenue = summary?.totalRevenue ?? totalCash + totalQr + totalOnline;
    return { totalCash, totalQr, totalOnline, totalRevenue };
  }, [summary]);

  const shiftReportQuery = useQuery({
    queryKey: ["reports", "shift-report", selectedShiftId],
    queryFn: () => {
      if (!selectedShiftId) throw new Error("Chưa chọn ca");
      return reportsApi.getShiftReport(selectedShiftId);
    },
    enabled: !!selectedShiftId && shiftOpen,
  });

  const shiftReport = shiftReportQuery.data;

  const salesQuery = useQuery({
    queryKey: ["reports", "daily-sales", date],
    queryFn: () => reportsApi.getDailySalesReport(date),
    enabled: salesOpen,
  });

  async function handleDownloadSalesCsv() {
    try {
      const blob = await reportsApi.downloadDailySalesCsv(date);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-sales-${date.replace(/-/g, "")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải file";
      toast({ title: "Tải file thất bại", description: message, variant: "destructive" });
    }
  }

  async function handleDownloadSalesPdf() {
    try {
      const blob = await reportsApi.downloadDailySalesPdf(date);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-sales-${date.replace(/-/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải file";
      toast({ title: "Tải file thất bại", description: message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo doanh thu</h1>
          <p className="text-muted-foreground mt-1">
            Doanh thu theo ca (tiền mặt POS, QR offline POS, online hệ thống).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["reports", "daily", date] });
              qc.invalidateQueries({ queryKey: ["reports", "day-status", date] });
            }}
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setSalesOpen(true)}>
            <FileText className="w-4 h-4" />
            Biểu mẫu bán ra
          </Button>
          <Button
            className="gap-2"
            disabled={closeMutation.isPending || !canCloseDay}
            onClick={() => setCloseConfirmOpen(true)}
          >
            <LockKeyhole className="w-4 h-4" />
            Chốt ngày
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ngày</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-md px-3 py-2 bg-background"
              />
              {isClosed && <Badge variant="secondary">Đã chốt</Badge>}
              {!isClosed && isLockedNow && <Badge variant="destructive">Đang khóa (00:00–05:00)</Badge>}
              {!isClosed && hasActiveShift && <Badge variant="outline">Có ca đang mở</Badge>}
            </div>
            {!isClosed && hasActiveShift && (
              <div className="text-sm text-muted-foreground">
                Chỉ được chốt ngày khi tất cả ca đã đóng.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Tiền mặt thu tại POS</div>
          <div className="text-2xl font-bold mt-1">{formatVnd(totals.totalCash)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">QR offline tại POS</div>
          <div className="text-2xl font-bold mt-1">{formatVnd(totals.totalQr)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Thu qua hệ thống online</div>
          <div className="text-2xl font-bold mt-1">{formatVnd(totals.totalOnline)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Tổng doanh thu</div>
          <div className="text-2xl font-bold mt-1">{formatVnd(totals.totalRevenue)}</div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="font-semibold">Danh sách ca</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Nhân viên mở ca</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Opened</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Closed</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Cash POS</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">QR POS</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Online</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{s.openedByName}</td>
                  <td className="px-4 py-3">
                    {String(s.status).toLowerCase() === "closed" ? (
                      <Badge variant="secondary">Closed</Badge>
                    ) : (
                      <Badge>Open</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(s.openedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.closedAt ? new Date(s.closedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">{formatVnd(s.systemCashTotal)}</td>
                  <td className="px-4 py-3 text-right">{formatVnd(s.systemQrTotal)}</td>
                  <td className="px-4 py-3 text-right">{formatVnd(s.systemOnlineTotal)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSelectedShiftId(s.id);
                        setShiftOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}

              {!dailyQuery.isLoading && shifts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Không có ca trong ngày này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={shiftOpen}
        onOpenChange={(open) => {
          setShiftOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setOrderOpen(false);
            setSelectedRefund(null);
            setRefundOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chi tiết ca</DialogTitle>
            <DialogDescription>
              Thông tin ca, doanh thu theo nguồn, thống kê và danh sách giao dịch (read-only).
            </DialogDescription>
          </DialogHeader>

          {shiftReportQuery.isLoading && <div className="text-sm text-muted-foreground">Đang tải chi tiết ca...</div>}
          {shiftReportQuery.isError && (
            <div className="text-sm text-destructive">Không tải được chi tiết ca.</div>
          )}

          {shiftReport && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 space-y-3">
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Thông tin ca</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Shift ID</span>
                      <span className="font-medium">{String(shiftReport.shiftId).slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Ngày</span>
                      <span className="font-medium">{new Date(shiftReport.operationalDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Opened at</span>
                      <span className="font-medium">{new Date(shiftReport.openedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Closed at</span>
                      <span className="font-medium">{shiftReport.closedAt ? new Date(shiftReport.closedAt).toLocaleString() : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Trạng thái</span>
                      {String(shiftReport.status).toLowerCase() === "closed" ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : (
                        <Badge>Open</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Nhân viên mở ca</span>
                      <span className="font-medium">{shiftReport.openedBy.name}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Doanh thu theo nguồn</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>💵 Cash POS</span>
                      <span className="font-semibold">{formatVnd(shiftReport.revenue.cashPos)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>📱 QR tại POS (offline)</span>
                      <span className="font-semibold">{formatVnd(shiftReport.revenue.qrPos)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🌐 Online (wallet / app)</span>
                      <span className="font-semibold">{formatVnd(shiftReport.revenue.online)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tổng doanh thu ca</span>
                      <span className="font-bold">{formatVnd(shiftReport.revenue.total)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Thống kê nhanh</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Tổng số order</div>
                      <div className="text-xl font-bold">{shiftReport.stats.totalOrders}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Tổng số món bán</div>
                      <div className="text-xl font-bold">{shiftReport.stats.totalItemsSold}</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <div className="p-4 border-b">
                    <div className="font-semibold">Danh sách giao dịch trong ca (read-only)</div>
                    <div className="text-sm text-muted-foreground">Không cho sửa / không cho đổi trạng thái.</div>
                  </div>
                  <ScrollArea className="h-[520px]">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Txn ID</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Thời gian</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Loại</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Phương thức</th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Số tiền</th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftReport.transactions.map((t) => {
                            const isRefund = String(t.purpose).toLowerCase().includes("refund");
                            const label = isRefund ? "Refund" : "Order";
                            return (
                              <tr key={t.transactionId} className="border-b border-border last:border-0">
                                <td className="px-4 py-3 font-medium">{String(t.transactionId).slice(0, 8)}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={isRefund ? "destructive" : "outline"}>{label}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary">{t.paymentMethod}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right font-medium">{formatVnd(t.amount)}</td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => {
                                      if (isRefund) {
                                        if (!t.refundReceipt) {
                                          toast({
                                            title: "Không tải được biên lai hủy",
                                            description: "Thiếu dữ liệu refundReceipt trong shift report.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        setSelectedRefund(t.refundReceipt);
                                        setRefundOpen(true);
                                        return;
                                      }

                                      const orderId = t.orderId;
                                      if (!orderId) {
                                        toast({
                                          title: "Không xem được đơn",
                                          description: "Thiếu orderId trong giao dịch.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      const found = shiftReport.orders.find((o) => String(o.orderId) === String(orderId));
                                      if (!found) {
                                        toast({
                                          title: "Không tìm thấy đơn",
                                          description: "Đơn không nằm trong danh sách orders của ca.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      setSelectedOrder(found);
                                      setOrderOpen(true);
                                    }}
                                  >
                                    <ReceiptText className="w-4 h-4" />
                                    Xem
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}

                          {shiftReport.transactions.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                Chưa có giao dịch trong ca này.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Biên lai hủy</DialogTitle>
          </DialogHeader>

          {selectedRefund && (
            <div className="rounded-lg border bg-white text-black">
              <div className="p-4 font-mono text-sm">
                <div className="text-center">
                  <div className="font-bold">SMART CANTEEN</div>
                  <div className="text-xs">BIÊN LAI HỦY</div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span>Đơn gốc</span>
                    <span className="font-bold">#{String(selectedRefund.originalOrderId).slice(0, 6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Thời gian hủy</span>
                    <span>{new Date(selectedRefund.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Nhân viên</span>
                    <span>{selectedRefund.performedBy?.name ?? "-"}</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3">
                  <div className="flex justify-between text-xs">
                    <span>Món</span>
                    <span>Tiền</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {selectedRefund.items.map((it) => (
                      <div key={it.orderItemId}>
                        <div className="flex justify-between gap-2">
                          <span className="truncate">{it.name}</span>
                          <span>{formatVnd(-it.lineTotal)}</span>
                        </div>
                        <div className="text-xs opacity-80">SL {it.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">TỔNG HOÀN</span>
                    <span className="font-bold">{formatVnd(-selectedRefund.refundAmount)}</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Phương thức</span>
                    <span>{selectedRefund.refundMethod}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Lý do</span>
                    <span className="text-right break-words">{selectedRefund.reason || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="rounded-lg border bg-white text-black">
              <div className="p-4 font-mono text-sm">
                {(() => {
                  const vatRate = selectedOrder.vatRate ?? 0.08;
                  const total = selectedOrder.totalPrice ?? 0;
                  const vatFromApi = selectedOrder.vatAmount;
                  const fallbackBase = vatRate > 0 ? Math.max(0, Math.round(total / (1 + vatRate))) : Math.max(0, total);
                  const fallbackVat = Math.max(0, total - fallbackBase);
                  const vat = Math.max(0, vatFromApi ?? fallbackVat);
                  const base = Math.max(0, total - vat);
                  const discount = Math.max(0, selectedOrder.discountAmount ?? 0);

                  return (
                    <>
                <div className="text-center">
                  <div className="font-bold">SMART CANTEEN</div>
                  <div className="text-xs">PHIẾU TÍNH TIỀN</div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span>Order</span>
                    <span className="font-bold">{String(selectedOrder.orderId).slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Time</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Source</span>
                    <span>{selectedOrder.source}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>By</span>
                    <span>{selectedOrder.createdBy.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Status</span>
                    <span>{selectedOrder.status}</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3">
                  <div className="flex justify-between text-xs">
                    <span>Description</span>
                    <span>Total</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((it) => (
                      <div key={it.itemId}>
                        <div className="flex justify-between gap-2">
                          <span className="truncate">{it.name}</span>
                          <span>{formatVnd(it.lineTotal)}</span>
                        </div>
                        <div className="text-xs opacity-80">
                          {it.quantity} x {formatVnd(it.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>G.trị chưa thuế</span>
                    <span>{formatVnd(base)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({(vatRate * 100).toFixed(2)}% của {formatVnd(base)})</span>
                    <span>{formatVnd(vat)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>{formatVnd(discount)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">TỔNG CỘNG</span>
                    <span className="font-bold">{formatVnd(selectedOrder.totalPrice)}</span>
                  </div>
                  <div className="text-xs opacity-80">Số lượng món: {selectedOrder.items.reduce((a, b) => a + b.quantity, 0)}</div>
                </div>

                {String(selectedOrder.source).toLowerCase() === "cash" && (
                  <>
                    <div className="mt-3 border-t border-dashed border-black/40" />
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <span>CASH</span>
                        <span>{formatVnd(selectedOrder.amountReceived ?? selectedOrder.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thừa</span>
                        <span>{formatVnd(selectedOrder.changeAmount ?? 0)}</span>
                      </div>
                    </div>
                  </>
                )}

                {String(selectedOrder.source).toLowerCase() === "qr" && (
                  <>
                    <div className="mt-3 border-t border-dashed border-black/40" />
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <span>VietQR</span>
                        <span>{formatVnd(selectedOrder.amountReceived ?? selectedOrder.totalPrice)}</span>
                      </div>
                    </div>
                  </>
                )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Biểu mẫu số lượng bán ra</DialogTitle>
            <DialogDescription>
              Tổng hợp số lượng bán theo món cho ngày {date} (ngày vận hành 05:00 → 05:00). Có thể xem trước hoặc sau khi chốt ngày.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="gap-2" onClick={handleDownloadSalesPdf} disabled={salesQuery.isLoading}>
              <Download className="w-4 h-4" />
              Tải PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadSalesCsv} disabled={salesQuery.isLoading}>
              <Download className="w-4 h-4" />
              Tải CSV
            </Button>
          </div>

          {salesQuery.isLoading && <div className="text-sm text-muted-foreground">Đang tải biểu mẫu...</div>}
          {salesQuery.isError && (
            <div className="text-sm text-destructive">Không tải được biểu mẫu. Vui lòng kiểm tra API / quyền truy cập.</div>
          )}

          {salesQuery.data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng số món bán</div>
                <div className="font-semibold">{salesQuery.data.totals.totalItems}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng tiền gốc</div>
                <div className="font-semibold">{formatVnd(salesQuery.data.totals.totalGrossAmount)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng discount</div>
                <div className="font-semibold">{formatVnd(salesQuery.data.totals.totalDiscountAmount)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng VAT</div>
                <div className="font-semibold">{formatVnd(salesQuery.data.totals.totalVatAmount)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Tổng cộng</div>
                <div className="font-semibold">{formatVnd(salesQuery.data.totals.totalAmount)}</div>
              </div>

              <div className="rounded-lg border">
                <div className="w-full overflow-x-hidden">
                  <ScrollArea className="h-[60vh] min-h-[260px] overflow-x-hidden">
                    <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[90px]">Mã</TableHead>
                        <TableHead className="w-[220px]">Tên món</TableHead>
                        <TableHead className="text-right w-[80px]">SL</TableHead>
                        <TableHead className="text-right w-[110px]">Giá gốc</TableHead>
                        <TableHead className="text-right w-[90px]">Discount</TableHead>
                        <TableHead className="text-right w-[90px]">VAT</TableHead>
                        <TableHead className="text-right w-[110px]">Toàn bộ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesQuery.data.items.map((it) => (
                        <TableRow key={it.itemId}>
                          <TableCell className="font-mono text-xs truncate">{String(it.itemId).slice(0, 8)}</TableCell>
                          <TableCell className="font-medium truncate">{it.name}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right">{formatVnd(it.grossAmount)}</TableCell>
                          <TableCell className="text-right">{formatVnd(it.discountAmount)}</TableCell>
                          <TableCell className="text-right">{formatVnd(it.vatAmount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatVnd(it.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      {salesQuery.data.items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            Không có dữ liệu bán ra trong ngày này.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chốt ngày</AlertDialogTitle>
            <AlertDialogDescription>
              Chốt ngày {date} sẽ khóa dữ liệu ngày vận hành này. Bạn có thể xem “Biểu mẫu bán ra” trước hoặc sau khi chốt ngày và xem lại bất cứ lúc nào.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setCloseConfirmOpen(false);
                setSalesOpen(true);
              }}
            >
              Xem biểu mẫu
            </Button>
            <AlertDialogAction
              disabled={closeMutation.isPending || !canCloseDay}
              onClick={() => closeMutation.mutate()}
            >
              Chốt ngày
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {dailyQuery.isError && (
        <div className="text-sm text-destructive">Không tải được báo cáo. Vui lòng kiểm tra API / quyền truy cập.</div>
      )}
    </div>
  );
}
