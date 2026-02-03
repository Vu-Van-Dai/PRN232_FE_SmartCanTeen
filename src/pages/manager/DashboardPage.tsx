import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, Download, DollarSign, ShoppingCart, QrCode, CreditCard, RefreshCcw } from "lucide-react";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
}

export default function ManagerDashboardPage() {
  const [today] = useState(() => toYmd(new Date()));

  const statusQuery = useQuery({
    queryKey: ["reports", "day-status", today],
    queryFn: () => reportsApi.getDayStatus(today),
  });

  const operationalDate = useMemo(() => {
    const raw = statusQuery.data?.currentOperationalDate;
    if (!raw) return today;
    const ms = Date.parse(raw);
    if (Number.isNaN(ms)) return today;
    return toYmd(new Date(ms));
  }, [statusQuery.data, today]);

  const isLockedNow = statusQuery.data?.isLockedNow ?? false;

  const snapshotQuery = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => reportsApi.getDashboardSnapshot(),
  });

  const dailyQuery = useQuery({
    queryKey: ["reports", "daily", operationalDate],
    queryFn: () => reportsApi.getDailyReport(operationalDate),
  });

  const hourlyQuery = useQuery({
    queryKey: ["reports", "dashboard-hourly", operationalDate],
    queryFn: () => reportsApi.getDashboardHourly(operationalDate),
  });

  const topItemsQuery = useQuery({
    queryKey: ["reports", "daily-sales", operationalDate],
    queryFn: () => reportsApi.getDailySalesReport(operationalDate),
  });

  const totals = useMemo(() => {
    const cash = snapshotQuery.data?.totalCash ?? dailyQuery.data?.summary?.totalCash ?? 0;
    const qr = snapshotQuery.data?.totalQr ?? dailyQuery.data?.summary?.totalQr ?? 0;
    const online = snapshotQuery.data?.totalOnline ?? dailyQuery.data?.summary?.totalOnline ?? 0;
    const revenue = cash + qr + online;
    const totalOrders = dailyQuery.data?.stats?.totalOrders ?? 0;
    return { cash, qr, online, revenue, totalOrders };
  }, [snapshotQuery.data, dailyQuery.data]);

  const hourlyData = useMemo(() => {
    return (hourlyQuery.data?.points ?? []).map((p) => ({ time: p.hour, value: p.value }));
  }, [hourlyQuery.data]);

  const topItems = useMemo(() => {
    const items = topItemsQuery.data?.items ?? [];
    return items.slice(0, 5);
  }, [topItemsQuery.data]);

  const isLoading = snapshotQuery.isLoading || dailyQuery.isLoading;
  const hasError = snapshotQuery.isError || dailyQuery.isError;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Tổng quan Dashboard</h1>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-1">
            Dữ liệu theo <b>ngày vận hành</b> (05:00→05:00): {operationalDate}
            {isLockedNow ? " (đang khóa 00:00–05:00)" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => {
            statusQuery.refetch();
            snapshotQuery.refetch();
            dailyQuery.refetch();
            hourlyQuery.refetch();
            topItemsQuery.refetch();
          }}>
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Calendar className="w-4 h-4" />
            {operationalDate}
          </Button>
          <Button className="gap-2" onClick={() => (window.location.href = "/manager/reports") }>
            <Download className="w-4 h-4" />
            Xem báo cáo
          </Button>
        </div>
      </div>

      {hasError && (
        <Card className="p-4 mb-6 border-destructive">
          <p className="text-destructive">Không thể tải dữ liệu dashboard.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{isLoading ? "..." : formatVnd(totals.revenue)}</h3>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">Tổng đơn</p>
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-info" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{isLoading ? "..." : totals.totalOrders}</h3>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">Tiền mặt (POS)</p>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{isLoading ? "..." : formatVnd(totals.cash)}</h3>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">QR (POS) / Online</p>
            <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-chart-2" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><QrCode className="w-4 h-4" /> QR (POS)</span>
              <span className="font-semibold">{isLoading ? "..." : formatVnd(totals.qr)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" /> Online</span>
              <span className="font-semibold">{isLoading ? "..." : formatVnd(totals.online)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Xu hướng doanh thu</h3>
              <p className="text-sm text-muted-foreground">Theo giờ (ngày vận hành)</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatVnd(value), "Doanh thu"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Top món bán chạy</h3>
          </div>

          <div className="space-y-3">
            {topItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            )}
            {topItems.map((x, idx) => (
              <div key={String(x.itemId)} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 rounded-md">
                    {x.imageUrl ? <AvatarImage src={x.imageUrl} alt={x.name} /> : null}
                    <AvatarFallback className="rounded-md text-xs">
                      {(x.name?.trim()?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">#{idx + 1} {x.name}</p>
                    <p className="text-xs text-muted-foreground">SL: {x.quantity}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{formatVnd(x.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
