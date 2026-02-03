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
import type { Guid, ShiftOrderListItem } from "@/lib/api/types";

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
      if (!selectedShiftId) throw new Error("No shift selected");
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
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chi tiết ca</DialogTitle>
            <DialogDescription>
              Thông tin ca, doanh thu theo nguồn, thống kê và danh sách đơn (read-only).
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
                    <div className="font-semibold">Danh sách đơn trong ca (read-only)</div>
                    <div className="text-sm text-muted-foreground">Không cho sửa / không cho đổi trạng thái.</div>
                  </div>
                  <ScrollArea className="h-[520px]">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Order ID</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Thời gian</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Nguồn</th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Tổng tiền</th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Trạng thái</th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftReport.orders.map((o) => (
                            <tr key={o.orderId} className="border-b border-border last:border-0">
                              <td className="px-4 py-3 font-medium">{String(o.orderId).slice(0, 8)}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{o.source}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">{formatVnd(o.totalPrice)}</td>
                              <td className="px-4 py-3">
                                {String(o.status).toLowerCase() === "cancelled" ? (
                                  <Badge variant="destructive">Cancelled</Badge>
                                ) : String(o.status).toLowerCase() === "completed" ? (
                                  <Badge variant="secondary">Completed</Badge>
                                ) : (
                                  <Badge>{o.status}</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setOrderOpen(true);
                                  }}
                                >
                                  <ReceiptText className="w-4 h-4" />
                                  Xem đơn
                                </Button>
                              </td>
                            </tr>
                          ))}

                          {shiftReport.orders.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                Chưa có đơn trong ca này.
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

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn</DialogTitle>
            <DialogDescription>Hiển thị kiểu hóa đơn (read-only).</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="rounded-lg border bg-white text-black">
              <div className="p-4 font-mono text-sm">
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
                    <span>Giá trị chưa thuế</span>
                    <span>{formatVnd(selectedOrder.subTotal - (selectedOrder.discountAmount ?? 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>{formatVnd(selectedOrder.discountAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({Math.round((selectedOrder.vatRate ?? 0.08) * 100)}%)</span>
                    <span>{formatVnd(selectedOrder.vatAmount ?? 0)}</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-black/40" />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">TỔNG CỘNG</span>
                    <span className="font-bold">{formatVnd(selectedOrder.totalPrice)}</span>
                  </div>
                  <div className="text-xs opacity-80">Số lượng món: {selectedOrder.items.reduce((a, b) => a + b.quantity, 0)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent className="max-w-4xl">
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
                <ScrollArea className="h-[520px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Mã món</TableHead>
                        <TableHead>Tên món</TableHead>
                        <TableHead className="text-right w-[140px]">Số lượng</TableHead>
                        <TableHead className="text-right w-[180px]">Giá gốc</TableHead>
                        <TableHead className="text-right w-[160px]">Discount</TableHead>
                        <TableHead className="text-right w-[160px]">VAT</TableHead>
                        <TableHead className="text-right w-[180px]">Toàn bộ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesQuery.data.items.map((it) => (
                        <TableRow key={it.itemId}>
                          <TableCell className="font-mono text-xs">{String(it.itemId).slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">{it.name}</TableCell>
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
