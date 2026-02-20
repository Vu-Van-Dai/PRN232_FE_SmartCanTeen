import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminReportsApi, reportsApi } from "@/lib/api";
import type { DailyReportResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, ChevronLeft, ChevronRight, Download, RefreshCcw } from "lucide-react";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(ymd: string, delta: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + delta);
  return toYmd(dt);
}

function addMonths(ymd: string, delta: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setMonth(dt.getMonth() + delta);
  return toYmd(dt);
}

function formatCompactTick(value: unknown) {
  const v = Number(value ?? 0);
  const abs = Math.abs(v);
  if (!Number.isFinite(v)) return "";
  if (abs === 0) return "0";
  if (abs < 1_000_000) return `${Math.round(v / 1_000)}k`;
  if (abs < 1_000_000_000) {
    const m = v / 1_000_000;
    const digits = Math.abs(m) < 10 ? 1 : 0;
    return `${m.toFixed(digits)}M`;
  }
  const b = v / 1_000_000_000;
  return `${b.toFixed(1)}B`;
}

type DailyShift = DailyReportResponse["shifts"][number];

function ShiftReportInline({ shift, enabled }: { shift: DailyShift; enabled: boolean }) {
  const reportQuery = useQuery({
    queryKey: ["admin-reports", "shift-report-inline", String(shift.id)],
    queryFn: () => reportsApi.getShiftReport(shift.id),
    enabled,
  });

  const declaredCash = shift.staffCashInput;

  if (!enabled) return null;

  if (reportQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải báo cáo ca...</div>;
  }

  if (reportQuery.isError) {
    return (
      <div className="text-sm text-destructive">
        {String((reportQuery.error as Error)?.message ?? "Không thể tải báo cáo ca")}
      </div>
    );
  }

  const data = reportQuery.data;
  if (!data) return null;

  const sysCash = data.revenue.cashPos;
  const sysQr = data.revenue.qrPos;
  const variance = declaredCash == null
    ? null
    : (declaredCash ?? 0) - sysCash;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Doanh thu (hệ thống)</div>
          <div className="font-semibold mt-1">{formatVnd(data.revenue.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            TM {formatVnd(sysCash)} • QR {formatVnd(sysQr)} • Online {formatVnd(data.revenue.online)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Khai báo</div>
          <div className="text-xs text-muted-foreground mt-1">TM: {declaredCash == null ? "—" : formatVnd(declaredCash)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Chênh lệch (TM)</div>
          <div className="font-semibold mt-1">{variance == null ? "—" : formatVnd(variance)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">Số đơn</div>
          <div className="font-semibold mt-1">{data.stats.totalOrders}</div>
          <div className="text-xs text-muted-foreground mt-1">Tổng món: {data.stats.totalItemsSold}</div>
        </Card>
      </div>

      <div className="max-h-[45vh] overflow-auto pr-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Món</TableHead>
              <TableHead className="text-right">Tạm tính</TableHead>
              <TableHead className="text-right">Giảm</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
              <TableHead className="text-right">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.map((o) => {
              const itemsText = (o.items ?? []).slice(0, 2).map((it) => `${it.name} x${it.quantity}`).join(", ");
              const more = (o.items?.length ?? 0) - 2;
              return (
                <TableRow key={String(o.orderId)}>
                  <TableCell className="font-mono text-xs">{String(o.orderId).slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{new Date(o.createdAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-sm">{o.source}</TableCell>
                  <TableCell className="text-sm">
                    {itemsText}
                    {more > 0 ? ` +${more}` : ""}
                  </TableCell>
                  <TableCell className="text-right">{formatVnd(o.subTotal)}</TableCell>
                  <TableCell className="text-right">{formatVnd(o.discountAmount)}</TableCell>
                  <TableCell className="text-right">{formatVnd(o.vatAmount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatVnd(o.totalPrice)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={o.status === "Cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();

  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(() => toYmd(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const defaultPreparedBy = user?.name ?? user?.email ?? "Admin System";
  const [preparedBy, setPreparedBy] = useState(defaultPreparedBy);
  const [canteenRep, setCanteenRep] = useState("");
  const [schoolRep, setSchoolRep] = useState("");
  const [confirmedDate, setConfirmedDate] = useState(() => toYmd(new Date()));

  useEffect(() => {
    if (!exportOpen) return;
    setPreparedBy((prev) => (prev?.trim() ? prev : defaultPreparedBy));
  }, [exportOpen, defaultPreparedBy]);

  const [openShiftIds, setOpenShiftIds] = useState<string[]>([]);

  const seriesQuery = useQuery({
    queryKey: ["admin-reports", "series", mode, anchorDate],
    queryFn: () => adminReportsApi.getRevenueSeries(mode, anchorDate),
  });

  const points = useMemo(() => seriesQuery.data?.points ?? [], [seriesQuery.data?.points]);

  useEffect(() => {
    if (!points || points.length === 0) return;
    const last = points[points.length - 1];
    if (!last?.date) return;
    setSelectedDate(toYmd(new Date(last.date)));
  }, [points]);

  const ordersQuery = useQuery({
    queryKey: ["admin-reports", "orders", selectedDate],
    queryFn: () => adminReportsApi.getOrdersByDay(selectedDate),
    enabled: !!selectedDate && detailsOpen,
  });

  const dailyQuery = useQuery({
    queryKey: ["admin-reports", "daily", selectedDate],
    queryFn: () => reportsApi.getDailyReport(selectedDate),
    enabled: !!selectedDate && detailsOpen,
  });

  const salesQuery = useQuery({
    queryKey: ["admin-reports", "daily-sales", selectedDate],
    queryFn: () => reportsApi.getDailySalesReport(selectedDate),
    enabled: !!selectedDate && detailsOpen && salesOpen,
  });

  const periodTotals = useMemo(() => {
    const totalRevenue = points.reduce((acc, p) => acc + (p.totalRevenue ?? 0), 0);
    const totalDiscountAmount = points.reduce((acc, p) => acc + (p.totalDiscountAmount ?? 0), 0);
    const totalOrders = points.reduce((acc, p) => acc + (p.totalOrders ?? 0), 0);
    const closedDays = points.filter((p) => p.isClosed).length;
    return { totalRevenue, totalDiscountAmount, totalOrders, closedDays };
  }, [points]);

  async function handleExportPdf() {
    try {
      const blob = await adminReportsApi.downloadRevenueReportPdf({
        mode,
        date: anchorDate,
        preparedBy,
        canteenRep,
        schoolRep,
        confirmedDate,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-revenue-report-${mode}-${anchorDate.replace(/-/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể xuất PDF";
      toast({ title: "Xuất PDF thất bại", description: message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo doanh thu</h1>
          <p className="text-muted-foreground mt-1">Xem theo ngày/tuần/tháng và danh sách đơn theo ngày.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              seriesQuery.refetch();
              ordersQuery.refetch();
            }}
          >
            <RefreshCcw className="w-4 h-4" />
            Tải lại
          </Button>

          <Button className="gap-2" onClick={() => setExportOpen(true)} disabled={seriesQuery.isLoading}>
            <Download className="w-4 h-4" />
            Xuất PDF
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Khoảng thời gian</span>
            <Select value={mode} onValueChange={(v) => setMode(v as "week" | "month")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchorDate(mode === "week" ? addDays(anchorDate, -7) : addMonths(anchorDate, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">{anchorDate}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchorDate(mode === "week" ? addDays(anchorDate, 7) : addMonths(anchorDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 md:col-span-2">
          <div className="text-sm text-muted-foreground">Tổng doanh thu ({mode === "week" ? "tuần" : "tháng"})</div>
          <div className="text-2xl font-bold mt-1">{formatVnd(periodTotals.totalRevenue)}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Khuyến mãi</div>
              <div className="font-semibold">{formatVnd(-periodTotals.totalDiscountAmount)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Số đơn</div>
              <div className="font-semibold">{periodTotals.totalOrders}</div>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant="secondary">Đã chốt: {periodTotals.closedDays}/{points.length} ngày</Badge>
          </div>
        </Card>

        <Card className="p-4 md:col-span-3">
          <div className="font-semibold mb-2">Doanh thu theo ngày</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactTick} />
                <Tooltip formatter={(value: number) => [formatVnd(value), "Doanh thu"]} />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {seriesQuery.isError && (
            <div className="text-sm text-destructive mt-2">{String((seriesQuery.error as Error)?.message ?? "Không thể tải dữ liệu")}</div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="font-semibold">Danh sách ngày</div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Khuyến mãi</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
              <TableHead className="text-right">Trạng thái</TableHead>
              <TableHead className="text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((p) => {
              const ymd = toYmd(new Date(p.date));
              const isSelected = ymd === selectedDate;
              return (
                <TableRow key={p.date} className={isSelected ? "bg-muted/50" : undefined}>
                  <TableCell className="font-medium">{ymd}</TableCell>
                  <TableCell className="text-right">{formatVnd(-(p.totalDiscountAmount ?? 0))}</TableCell>
                  <TableCell className="text-right font-semibold">{formatVnd(p.totalRevenue)}</TableCell>
                  <TableCell className="text-right">
                    {p.isClosed ? <Badge>Đã chốt</Badge> : <Badge variant="secondary">Chưa chốt</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(ymd);
                        setDetailsOpen(true);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Tất cả đơn trong ngày: {selectedDate}</DialogTitle>
            <DialogDescription>
              {ordersQuery.data?.isClosed ? "Ngày này đã được chốt." : "Ngày này chưa chốt."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Tổng: {formatVnd(ordersQuery.data?.totals.totalRevenue ?? 0)} • Khuyến mãi: {formatVnd(-(ordersQuery.data?.totals.totalDiscountAmount ?? 0))} • Đơn: {ordersQuery.data?.totals.totalOrders ?? 0}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSalesOpen(true)}>
                Xem biểu mẫu bán ra
              </Button>
              {ordersQuery.data?.isClosed ? <Badge>Đã chốt</Badge> : <Badge variant="secondary">Chưa chốt</Badge>}
            </div>
          </div>

          {ordersQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : ordersQuery.isError ? (
            <div className="text-sm text-destructive">{String((ordersQuery.error as Error)?.message ?? "Không thể tải đơn")}</div>
          ) : (
            <div className="max-h-[70vh] overflow-auto pr-1 space-y-6">
              <div>
                <div className="font-semibold mb-2">Biểu mẫu cuối ca (Manager)</div>
                {dailyQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">Đang tải ca...</div>
                ) : dailyQuery.isError ? (
                  <div className="text-sm text-destructive">{String((dailyQuery.error as Error)?.message ?? "Không thể tải ca")}</div>
                ) : (
                  <Accordion type="multiple" value={openShiftIds} onValueChange={setOpenShiftIds}>
                    {(dailyQuery.data?.shifts ?? []).map((s) => {
                      const value = String(s.id);
                      const enabled = openShiftIds.includes(value);

                      const declaredCash = s.staffCashInput ?? 0;
                      const diff = s.staffCashInput == null
                        ? null
                        : declaredCash - s.systemCashTotal;

                      return (
                        <AccordionItem key={value} value={value}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex w-full flex-wrap items-center justify-between gap-3 pr-2">
                              <div className="min-w-[180px]">
                                <div className="text-sm font-medium">{s.openedByName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Mở {new Date(s.openedAt).toLocaleString("vi-VN")} • {s.closedAt ? `Đóng ${new Date(s.closedAt).toLocaleString("vi-VN")}` : "Chưa đóng"}
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground text-right">
                                <div>Tổng (HT): <span className="font-semibold text-foreground">{formatVnd(s.systemCashTotal + s.systemQrTotal + s.systemOnlineTotal)}</span></div>
                                <div>TM {formatVnd(s.systemCashTotal)} • QR {formatVnd(s.systemQrTotal)} • Online {formatVnd(s.systemOnlineTotal)}</div>
                              </div>

                              <div className="text-xs text-muted-foreground text-right">
                                <div>Khai báo TM: {s.staffCashInput == null ? "—" : formatVnd(s.staffCashInput)}</div>
                              </div>

                              <div className="text-right">
                                {diff == null ? (
                                  <Badge variant="secondary">Chưa khai báo</Badge>
                                ) : diff === 0 ? (
                                  <Badge>Khớp</Badge>
                                ) : (
                                  <Badge variant="destructive">{formatVnd(diff)}</Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ShiftReportInline shift={s} enabled={enabled} />
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>

              <div>
                <div className="font-semibold mb-2">Đơn hàng trong ngày</div>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Món</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead className="text-right">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ordersQuery.data?.orders ?? []).map((o) => {
                    const itemsText = (o.items ?? [])
                      .slice(0, 2)
                      .map((it) => `${it.name} x${it.quantity}`)
                      .join(", ");
                    const more = (o.items?.length ?? 0) - 2;
                    return (
                      <TableRow key={String(o.orderId)}>
                        <TableCell className="font-mono text-xs">{String(o.orderId).slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{new Date(o.createdAt).toLocaleString("vi-VN")}</TableCell>
                        <TableCell className="text-sm">
                          {o.pickupTime ? new Date(o.pickupTime).toLocaleString("vi-VN") : "ASAP"}
                        </TableCell>
                        <TableCell className="text-sm">{o.source}</TableCell>
                        <TableCell className="text-sm">{o.paymentMethod}</TableCell>
                        <TableCell className="text-sm">
                          {itemsText}
                          {more > 0 ? ` +${more}` : ""}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatVnd(o.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={o.status === "Cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Biểu mẫu bán ra: {selectedDate}</DialogTitle>
            <DialogDescription>Tổng hợp số lượng bán theo món (ngày vận hành 05:00 → 05:00).</DialogDescription>
          </DialogHeader>

          {salesQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải biểu mẫu...</div>
          ) : salesQuery.isError ? (
            <div className="text-sm text-destructive">
              {String((salesQuery.error as Error)?.message ?? "Không thể tải biểu mẫu")}
            </div>
          ) : salesQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Card className="p-3 md:col-span-1">
                  <div className="text-sm text-muted-foreground">Tổng món bán</div>
                  <div className="font-semibold mt-1">{salesQuery.data.totals.totalItems}</div>
                </Card>
                <Card className="p-3 md:col-span-1">
                  <div className="text-sm text-muted-foreground">Giá gốc</div>
                  <div className="font-semibold mt-1">{formatVnd(salesQuery.data.totals.totalGrossAmount)}</div>
                </Card>
                <Card className="p-3 md:col-span-1">
                  <div className="text-sm text-muted-foreground">Discount</div>
                  <div className="font-semibold mt-1">{formatVnd(salesQuery.data.totals.totalDiscountAmount)}</div>
                </Card>
                <Card className="p-3 md:col-span-1">
                  <div className="text-sm text-muted-foreground">VAT</div>
                  <div className="font-semibold mt-1">{formatVnd(salesQuery.data.totals.totalVatAmount)}</div>
                </Card>
                <Card className="p-3 md:col-span-1">
                  <div className="text-sm text-muted-foreground">Tổng cộng</div>
                  <div className="font-semibold mt-1">{formatVnd(salesQuery.data.totals.totalAmount)}</div>
                </Card>
              </div>

              <div className="max-h-[65vh] overflow-auto pr-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Mã món</TableHead>
                      <TableHead>Tên món</TableHead>
                      <TableHead className="text-right w-[120px]">Số lượng</TableHead>
                      <TableHead className="text-right w-[160px]">Giá gốc</TableHead>
                      <TableHead className="text-right w-[140px]">Discount</TableHead>
                      <TableHead className="text-right w-[140px]">VAT</TableHead>
                      <TableHead className="text-right w-[160px]">Toàn bộ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesQuery.data.items.map((it) => (
                      <TableRow key={String(it.itemId)}>
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
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          Không có dữ liệu bán ra trong ngày này.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Không có dữ liệu.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Xuất báo cáo doanh thu (PDF)</DialogTitle>
            <DialogDescription>
              Kỳ báo cáo: {mode === "week" ? "Tuần" : "Tháng"} • Mốc: {anchorDate}. Nhập phần xác nhận để in kèm trong PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preparedBy">Người lập báo cáo</Label>
              <Input id="preparedBy" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canteenRep">Đại diện căn-tin</Label>
              <Input id="canteenRep" value={canteenRep} onChange={(e) => setCanteenRep(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolRep">Đại diện nhà trường</Label>
              <Input id="schoolRep" value={schoolRep} onChange={(e) => setSchoolRep(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmedDate">Ngày xác nhận</Label>
              <Input
                id="confirmedDate"
                type="date"
                value={confirmedDate}
                onChange={(e) => setConfirmedDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleExportPdf}>Xác nhận & Xuất PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
