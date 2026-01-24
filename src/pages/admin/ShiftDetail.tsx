import { Download, FileText, Calendar, Building, Clock, Timer, TrendingUp, AlertTriangle, Receipt, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const transactionLog = [
  { time: "12:01 PM", receiptId: "#9982", items: "Cheeseburger, Coke Zero", payment: "Student Card", total: 8.50 },
  { time: "12:05 PM", receiptId: "#9983", items: "Chicken Wrap, Mineral...", payment: "Cash", total: 6.00 },
  { time: "12:08 PM", receiptId: "#9984", items: "Pizza Slice, Apple Juice", payment: "Student Card", total: 4.00 },
  { time: "12:12 PM", receiptId: "#9985", items: "Garden Salad", payment: "Cash", total: 2.50 },
];

const categoryBreakdown = [
  { name: "Hot Meals", amount: 800.00, percentage: 65 },
  { name: "Drinks", amount: 300.00, percentage: 24 },
  { name: "Snacks", amount: 140.50, percentage: 11 },
];

export default function ShiftDetail() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="text-primary hover:underline cursor-pointer">Reports</span>
        <span>›</span>
        <span className="text-primary hover:underline cursor-pointer">Shifts</span>
        <span>›</span>
        <span>Shift #1234</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shift #1234 Performance</h1>
          <p className="text-muted-foreground mt-1">
            Detailed analysis and transaction log
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Staff Profile */}
        <Card className="col-span-3 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground">✓</span>
              </div>
            </div>
            
            <h3 className="font-semibold text-lg">Alice Miller</h3>
            <p className="text-sm text-muted-foreground mb-2">Cashier ID: 8821</p>
            <Badge className="bg-primary/10 text-primary">Senior Staff</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">Oct 24, 2023</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Terminal</p>
                <p className="text-sm font-medium">Station #04</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-primary">Start Time</p>
                <p className="text-sm font-medium">11:00 AM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">End Time</p>
                <p className="text-sm font-medium">03:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">4h 00m</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats & Details */}
        <div className="col-span-9 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Total Sales</p>
              </div>
              <h3 className="text-3xl font-bold">$1,240.50</h3>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-primary">+12% vs avg</span>
              </div>
            </Card>
            
            <Card className="p-5 border-l-4 border-l-destructive">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-xs font-medium text-destructive uppercase tracking-wider">Cash Variance</p>
              </div>
              <h3 className="text-3xl font-bold text-destructive">-$4.00</h3>
              <p className="text-sm text-destructive mt-1">Expected: $450.00</p>
            </Card>
            
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-info" />
                <p className="text-xs font-medium text-info uppercase tracking-wider">Transactions</p>
              </div>
              <h3 className="text-3xl font-bold">142</h3>
              <p className="text-sm text-muted-foreground mt-1">~35 per hour</p>
            </Card>
          </div>

          {/* Category Breakdown & Notes */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Sales by Category</h3>
              <div className="space-y-4">
                {categoryBreakdown.map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Closing Notes</h3>
                <Badge className="bg-destructive/10 text-destructive">ATTENTION</Badge>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-2xl text-muted-foreground">"</span>
                  <div>
                    <p className="text-sm italic text-muted-foreground">
                      Register was short $4. I accidentally gave change for a $20 instead of a $10 during the lunch rush. Sorry about that!
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">- Alice Miller, 3:05 PM</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Transaction Log */}
          <Card>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg">Transaction Log</h3>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="cash">Cash Only</SelectItem>
                  <SelectItem value="card">Card Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Time</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Receipt ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Items</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Payment</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactionLog.map((tx, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm">{tx.time}</td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-medium">{tx.receiptId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{tx.items}</td>
                    <td className="px-6 py-4">
                      <Badge className={tx.payment === "Cash" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}>
                        {tx.payment === "Cash" ? "💵" : "💳"} {tx.payment}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">${tx.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
