import { useState } from "react";
import { Download, Plus, TrendingUp, DollarSign, CreditCard, AlertTriangle, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const revenueByShift = [
  { name: "Morning", value: 3500 },
  { name: "Lunch", value: 8500, isPeak: true },
  { name: "Afternoon", value: 1800 },
];

const paymentDistribution = [
  { name: "Online / QR", value: 67, amount: 8250, color: "hsl(var(--primary))" },
  { name: "Cash Payment", value: 33, amount: 4200, color: "hsl(var(--chart-2))" },
];

const shiftRecords = [
  { id: "#1024", staff: { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop" }, date: "Oct 24, 2023", time: "08:00 AM - 02:00 PM", systemTotal: 450.00, actualCounted: 450.00, variance: 0 },
  { id: "#1023", staff: { name: "Mike Ross", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop" }, date: "Oct 24, 2023", time: "08:00 AM - 02:00 PM", systemTotal: 320.00, actualCounted: 315.00, variance: -5.00 },
  { id: "#1022", staff: { name: "Jessica Pearson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" }, date: "Oct 23, 2023", time: "12:00 PM - 06:00 PM", systemTotal: 550.00, actualCounted: 550.00, variance: 0 },
  { id: "#1021", staff: { name: "Louis Litt", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop" }, date: "Oct 23, 2023", time: "07:00 AM - 01:00 PM", systemTotal: 210.50, actualCounted: 200.50, variance: -10.00 },
  { id: "#1020", staff: { name: "Donna Paulsen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop" }, date: "Oct 22, 2023", time: "09:00 AM - 03:00 PM", systemTotal: 600.00, actualCounted: 600.00, variance: 0 },
];

const stats = [
  { title: "Total Revenue", value: "$12,450.00", change: "+12%", trend: "up", icon: DollarSign, iconBg: "bg-primary/10", iconColor: "text-primary" },
  { title: "Total Cash", value: "$4,200.00", subtext: "33% of total", icon: DollarSign, iconBg: "bg-info/10", iconColor: "text-info" },
  { title: "Total Online", value: "$8,250.00", subtext: "67% of total", icon: CreditCard, iconBg: "bg-chart-2/10", iconColor: "text-chart-2" },
  { title: "Total Discrepancy", value: "-$15.00", subtext: "Needs Review", icon: AlertTriangle, iconBg: "bg-destructive/10", iconColor: "text-destructive", isNegative: true },
];

export default function ReportsPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="text-primary hover:underline cursor-pointer">Dashboard</span>
        <span>›</span>
        <span className="text-primary hover:underline cursor-pointer">Reports</span>
        <span>›</span>
        <span>Shift Revenue</span>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shift Revenue Report</h1>
          <p className="text-muted-foreground mt-1">
            Detailed breakdown of shift financials and discrepancies across campuses.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Adjustment
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Calendar className="w-4 h-4" />
              This Week
            </Button>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Campus</p>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                <SelectItem value="main">Main Campus</SelectItem>
                <SelectItem value="east">East Wing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Staff Member</p>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="sarah">Sarah Jenkins</SelectItem>
                <SelectItem value="mike">Mike Ross</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">Apply Filters</Button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className={`p-5 ${stat.isNegative ? 'border-l-4 border-l-destructive' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <p className={`text-sm ${stat.isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
                {stat.title}
              </p>
              <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <h3 className={`text-2xl font-bold ${stat.isNegative ? 'text-destructive' : ''}`}>
              {stat.value}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {stat.change && (
                <>
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-primary">{stat.change}</span>
                </>
              )}
              {stat.subtext && (
                <span className={stat.isNegative ? "text-destructive" : "text-muted-foreground"}>
                  {stat.subtext}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Revenue by Shift */}
        <Card className="col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Revenue by Shift Period</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Peak Period</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByShift} barSize={60}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Payment Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Payment Distribution</h3>
          
          <div className="relative h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs text-primary font-medium">TOTAL</p>
              <p className="text-2xl font-bold">1,245</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            {paymentDistribution.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.name === "Online / QR" ? "Student Cards & Apps" : "Physical Currency"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{item.value}%</p>
                  <p className="text-xs text-muted-foreground">${item.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Shift Records Table */}
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Shift ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Staff Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Date & Time</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">System Total</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actual Counted</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Variance</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shiftRecords.map((record) => (
              <tr key={record.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">{record.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={record.staff.avatar} />
                      <AvatarFallback>{record.staff.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{record.staff.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{record.date}</p>
                  <p className="text-xs text-muted-foreground">{record.time}</p>
                </td>
                <td className="px-6 py-4 font-medium">${record.systemTotal.toFixed(2)}</td>
                <td className="px-6 py-4">${record.actualCounted.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <Badge className={record.variance === 0 ? "badge-success" : "badge-danger"}>
                    {record.variance === 0 ? "$0.00" : `-$${Math.abs(record.variance).toFixed(2)}`}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 bg-primary rounded-full hover:bg-primary/90">
                    <Eye className="w-4 h-4 text-primary-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-primary">1</span> to <span className="text-primary">5</span> of 24 results
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
