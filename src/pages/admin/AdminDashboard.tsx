import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, CreditCard, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const revenueData = [
  { time: "8AM", value: 120 },
  { time: "10AM", value: 280 },
  { time: "12PM", value: 480 },
  { time: "2PM", value: 420 },
  { time: "4PM", value: 350 },
  { time: "6PM", value: 380 },
  { time: "8PM", value: 420 },
];

const topItems = [
  { name: "Spicy Chicken Wrap", sold: 45, revenue: 225.00, rank: 1, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=100&h=100&fit=crop" },
  { name: "Classic Veggie Burger", sold: 32, revenue: 192.00, image: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=100&h=100&fit=crop" },
  { name: "Iced Hazelnut Coffee", sold: 28, revenue: 126.00, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=100&h=100&fit=crop" },
  { name: "Pepperoni Pizza Slice", sold: 25, revenue: 75.00, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop" },
  { name: "Fresh Fruit Cup", sold: 18, revenue: 63.00, image: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=100&h=100&fit=crop" },
];

const stats = [
  { 
    title: "Total Revenue Today", 
    value: "$1,240.50", 
    change: "+12%", 
    trend: "up",
    icon: DollarSign,
    iconBg: "bg-primary/10",
    iconColor: "text-primary"
  },
  { 
    title: "Total Orders", 
    value: "142", 
    change: "+5%", 
    trend: "up",
    icon: ShoppingCart,
    iconBg: "bg-info/10",
    iconColor: "text-info"
  },
  { 
    title: "Cash Payments", 
    value: "$400", 
    subtext: "(32%)",
    change: "-2%", 
    trend: "down",
    icon: DollarSign,
    iconBg: "bg-warning/10",
    iconColor: "text-warning"
  },
  { 
    title: "Online Payments", 
    value: "$840", 
    subtext: "(68%)",
    change: "+8%", 
    trend: "up",
    icon: CreditCard,
    iconBg: "bg-chart-2/10",
    iconColor: "text-chart-2"
  },
];

export default function AdminDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time analytics for today, Nov 14
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Today, Nov 14
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <span className="text-muted-foreground">vs yesterday</span>
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
              <h3 className="font-semibold text-lg">Revenue Trends</h3>
              <p className="text-sm text-muted-foreground">Hourly breakdown for today</p>
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
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
            <h3 className="font-semibold text-lg">Top Selling Items</h3>
            <button className="text-sm text-primary hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.sold} sold today</p>
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
            Manage Inventory
          </Button>
        </Card>
      </div>
    </div>
  );
}
