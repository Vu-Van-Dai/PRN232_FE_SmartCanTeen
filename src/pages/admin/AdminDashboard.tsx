import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, CreditCard, Download, Calendar } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { reportsApi } from "@/lib/api";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function formatPercentChange(today: number, yesterday: number) {
  if (!Number.isFinite(today) || !Number.isFinite(yesterday)) return { text: "0%", trend: "up" as const };
  if (yesterday === 0) {
    if (today === 0) return { text: "0%", trend: "up" as const };
    return { text: "+100%", trend: "up" as const };
  }
  const diff = ((today - yesterday) / Math.abs(yesterday)) * 100;
  const rounded = Math.round(diff);
  const sign = rounded > 0 ? "+" : "";
  return {
    text: `${sign}${rounded}%`,
    trend: rounded >= 0 ? ("up" as const) : ("down" as const),
  };
}

function addDaysIso(iso: string, days: number) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms + days * 24 * 60 * 60_000).toISOString();
}

export default function AdminDashboard() {
  const nowIso = useMemo(() => new Date().toISOString(), []);

  // Use server-derived operational date to keep dashboard aligned with 05:00→05:00 business day.
  const dayStatusQuery = useQuery({
    queryKey: ["reports", "day-status", "now"],
    queryFn: () => reportsApi.getDayStatus(nowIso),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const operationalDateIso = dayStatusQuery.data?.currentOperationalDate ?? nowIso;
  const yesterdayIso = useMemo(() => addDaysIso(operationalDateIso, -1), [operationalDateIso]);

  const dailyQuery = useQuery({
    queryKey: ["reports", "daily", operationalDateIso],
    queryFn: () => reportsApi.getDailyReport(operationalDateIso),
    enabled: Boolean(operationalDateIso),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const dailyYesterdayQuery = useQuery({
    queryKey: ["reports", "daily", yesterdayIso],
    queryFn: () => reportsApi.getDailyReport(yesterdayIso),
    enabled: Boolean(yesterdayIso),
    staleTime: 60_000,
  });

  const hourlyQuery = useQuery({
    queryKey: ["reports", "dashboard-hourly", operationalDateIso],
    queryFn: () => reportsApi.getDashboardHourly(operationalDateIso),
    enabled: Boolean(operationalDateIso),
    staleTime: 10_000,
    refetchInterval: 60_000,
  });

  const topItemsQuery = useQuery({
    queryKey: ["reports", "daily-sales", operationalDateIso],
    queryFn: () => reportsApi.getDailySalesReport(operationalDateIso),
    enabled: Boolean(operationalDateIso),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const revenueToday = dailyQuery.data?.summary.totalRevenue ?? 0;
  const revenueYesterday = dailyYesterdayQuery.data?.summary.totalRevenue ?? 0;
  const ordersToday = dailyQuery.data?.stats.totalOrders ?? 0;
  const ordersYesterday = dailyYesterdayQuery.data?.stats.totalOrders ?? 0;
  const cashToday = dailyQuery.data?.summary.totalCash ?? 0;
  const cashYesterday = dailyYesterdayQuery.data?.summary.totalCash ?? 0;
  const onlineToday = dailyQuery.data?.summary.totalOnline ?? 0;
  const onlineYesterday = dailyYesterdayQuery.data?.summary.totalOnline ?? 0;

  const revenueChange = formatPercentChange(revenueToday, revenueYesterday);
  const ordersChange = formatPercentChange(ordersToday, ordersYesterday);
  const cashChange = formatPercentChange(cashToday, cashYesterday);
  const onlineChange = formatPercentChange(onlineToday, onlineYesterday);

  const cashPercent = revenueToday > 0 ? Math.round((cashToday / revenueToday) * 100) : 0;
  const onlinePercent = revenueToday > 0 ? Math.round((onlineToday / revenueToday) * 100) : 0;

  const stats = [
    {
      title: "Tổng doanh thu hôm nay",
      value: formatVnd(revenueToday),
      change: revenueChange.text,
      trend: revenueChange.trend,
      icon: DollarSign,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Tổng đơn hàng hôm nay",
      value: String(ordersToday),
      change: ordersChange.text,
      trend: ordersChange.trend,
      icon: ShoppingCart,
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
    {
      title: "Thanh toán bằng tiền mặt",
      value: formatVnd(cashToday),
      subtext: `(${cashPercent}%)`,
      change: cashChange.text,
      trend: cashChange.trend,
      icon: DollarSign,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      title: "Thanh toán trực tuyến",
      value: formatVnd(onlineToday),
      subtext: `(${onlinePercent}%)`,
      change: onlineChange.text,
      trend: onlineChange.trend,
      icon: CreditCard,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
  ];

  const revenueData = (hourlyQuery.data?.points ?? []).map((p) => ({
    time: p.hour,
    value: p.value,
  }));

  const topItems = (topItemsQuery.data?.items ?? [])
    .slice()
    .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
    .slice(0, 5)
    .map((x, idx) => ({
      name: x.name,
      sold: x.quantity,
      revenue: x.totalAmount,
      rank: idx + 1,
      image: x.imageUrl ?? "",
    }));

  const headerDateText = useMemo(() => {
    const ms = Date.parse(operationalDateIso);
    const d = Number.isNaN(ms) ? new Date() : new Date(ms);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  }, [operationalDateIso]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Tổng quan hệ thống</h1>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-1">
            Thống kê theo thời gian thực hôm nay, {headerDateText}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Hôm nay, {headerDateText}
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(dayStatusQuery.isError || dailyQuery.isError) && (
          <Card className="p-5 md:col-span-2 lg:col-span-4 text-sm text-destructive">
            Không thể tải dữ liệu bảng điều khiển. Vui lòng kiểm tra quyền/vai trò và URL cơ sở API của bạn.
          </Card>
        )}
        {stats.map((stat, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              {stat.subtext && (
                <span className="text-sm text-muted-foreground">{stat.subtext}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-2 text-sm">
              {stat.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className={stat.trend === "up" ? "text-primary" : "text-destructive"}>
                {stat.change}
              </span>
              <span className="text-muted-foreground">so với hôm qua</span>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Xu hướng doanh thu</h3>
              <p className="text-sm text-muted-foreground">Phân tích theo giờ trong ngày hôm nay</p>
            </div>
            <button className="p-1 hover:bg-muted rounded">⋮</button>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatVnd(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Top Selling Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Mặt hàng bán chạy nhất</h3>
            <button className="text-sm text-primary hover:underline">Xem tất cả</button>
          </div>
          
          <div className="space-y-4">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.sold} đã bán hôm nay</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-sm">${item.revenue.toFixed(2)}</p>
                  {item.rank === 1 && (
                    <span className="text-xs text-primary font-medium">Top 1</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            Quản lý kho
          </Button>
        </Card>
      </div>
    </div>
  );
}
