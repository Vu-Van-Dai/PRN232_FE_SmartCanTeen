import { useState } from "react";
import { Download, CreditCard, Search, Building, ChevronLeft, ChevronRight, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  type: "topup" | "purchase";
  referenceId: string;
  status: "completed" | "pending";
  amount: number;
}

const transactions: Transaction[] = [
  { id: "1", date: "Oct 24, 2023", time: "10:42 AM", description: "Wallet Top-up", type: "topup", referenceId: "#TRX-882910", status: "completed", amount: 50.00 },
  { id: "2", date: "Oct 23, 2023", time: "12:15 PM", description: "Burger Station - Set A", type: "purchase", referenceId: "#ORD-112399", status: "completed", amount: -8.50 },
  { id: "3", date: "Oct 23, 2023", time: "08:30 AM", description: "Morning Brew Cafe", type: "purchase", referenceId: "#ORD-112355", status: "completed", amount: -4.20 },
  { id: "4", date: "Oct 21, 2023", time: "04:15 PM", description: "Wallet Top-up", type: "topup", referenceId: "#TRX-881002", status: "pending", amount: 20.00 },
];

const topUpAmounts = [10, 20, 50];

export default function StudentWallet() {
  const [balance] = useState(124.50);
  const [selectedAmount, setSelectedAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState("20.00");
  
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="text-primary hover:underline cursor-pointer">Home</span>
        <span>›</span>
        <span>My Wallet</span>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your funds, top up instantly, and track your daily spending.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download Statement
        </Button>
      </div>
      
      {/* Wallet Card & Top Up Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Wallet Card */}
        <div className="wallet-card relative overflow-hidden">
          <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white/60">📶</span>
          </div>
          
          <p className="text-white/60 text-sm mb-1">Current Balance</p>
          <h2 className="text-4xl font-bold mb-2">${balance.toFixed(2)}</h2>
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary text-sm font-medium">ACTIVE STATUS</span>
          </div>
          
          <div className="flex justify-between mt-auto">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Student ID</p>
              <p className="text-white font-mono text-lg">8824 5592 1033</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Valid Thru</p>
              <p className="text-white font-mono text-lg">12/25</p>
            </div>
          </div>
        </div>
        
        {/* Top Up Section */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Top Up Balance</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enter amount to generate a payment QR code.
          </p>
          
          <div className="flex gap-2 mb-4">
            {topUpAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount(amount.toFixed(2));
                }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors",
                  selectedAmount === amount 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:bg-muted"
                )}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input 
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-4">
            <Button className="flex-1 gap-2">
              Generate QR Code
              <QrCode className="w-4 h-4" />
            </Button>
            
            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center text-xs text-muted-foreground">
                <QrCode className="w-8 h-8 mx-auto mb-1 opacity-30" />
                <p>QR Code</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            Scan with banking app • Expires in 04:59
          </p>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">Recent Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..."
                className="pl-10 w-48 h-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <span className="sr-only">Filter</span>
              ≡
            </Button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Description</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Reference ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{tx.date}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        tx.type === "topup" ? "bg-primary/10" : "bg-warning/10"
                      )}>
                        {tx.type === "topup" ? (
                          <Building className="w-4 h-4 text-primary" />
                        ) : (
                          <span>🍔</span>
                        )}
                      </div>
                      <span className="text-sm">{tx.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tx.referenceId}</td>
                  <td className="px-6 py-4">
                    <Badge className={tx.status === "completed" ? "badge-success" : "badge-warning"}>
                      {tx.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-semibold text-right",
                    tx.amount > 0 ? "text-primary" : "text-destructive"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 1 to 4 of 24 entries</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="default" size="sm" className="w-9">1</Button>
            <Button variant="outline" size="sm" className="w-9">2</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
