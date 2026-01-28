import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { walletApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatVnDateTime } from "@/lib/datetime";

const topUpAmounts = [20000, 50000, 100000];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function maskGuid(guid: string) {
  if (!guid) return "";
  const s = guid.replace(/-/g, "");
  if (s.length <= 8) return guid;
  return `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 12)} ${s.slice(12, 16)}`.trim();
}

function shortId(id: string) {
  if (!id) return "";
  return id.split("-")[0] ?? id;
}

function statusLabel(status: number) {
  // BE: Pending=0, Success=1, Failed=2
  if (status === 1) return { text: "Success", className: "bg-primary/10 text-primary" };
  if (status === 2) return { text: "Failed", className: "bg-destructive/10 text-destructive" };
  return { text: "Pending", className: "bg-warning/10 text-warning" };
}

function typeSignedAmount(type: number, amount: number) {
  // BE: Credit=0, Debit=1
  if (type === 1) return -Math.abs(amount);
  return Math.abs(amount);
}

export default function StudentWallet() {
  const { data: walletMe, isLoading, isError } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: walletApi.getMyWallet,
    staleTime: 15_000,
    retry: false,
  });

  const balance = walletMe?.balance ?? 0;

  const [selectedAmount, setSelectedAmount] = useState(topUpAmounts[1]);
  const [customAmount, setCustomAmount] = useState(String(topUpAmounts[1]));

  const parsedAmount = useMemo(() => {
    const n = Number(String(customAmount).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  }, [customAmount]);

  const topupMutation = useMutation({
    mutationFn: (amount: number) => walletApi.topupMyWallet(amount),
    onSuccess: (res) => {
      if (res?.paymentUrl) window.open(res.paymentUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Top-up created", description: "Opened payment page in a new tab." });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Top-up failed";
      toast({ title: "Top-up failed", description: msg, variant: "destructive" });
    },
  });

  const { data: txRes, isLoading: txLoading } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => walletApi.getMyWalletTransactions({ skip: 0, take: 20 }),
    staleTime: 10_000,
    retry: false,
  });
  
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/student/home" className="text-primary hover:underline">
          Home
        </Link>
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
          <h2 className="text-4xl font-bold mb-2">
            {isLoading ? "…" : isError ? "—" : formatVND(Number(balance))}
          </h2>
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary text-sm font-medium">ACTIVE STATUS</span>
          </div>
          
          <div className="flex justify-between mt-auto">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Wallet ID</p>
              <p className="text-white font-mono text-sm">{walletMe?.walletId ? maskGuid(walletMe.walletId) : "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
              <p className="text-white font-mono text-sm">Active</p>
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
                  setCustomAmount(String(amount));
                }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors",
                  selectedAmount === amount 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:bg-muted"
                )}
              >
                {formatVND(amount)}
              </button>
            ))}
          </div>
          
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">VND</span>
            <Input 
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-12"
            />
          </div>
          
          <div className="flex gap-4">
            <Button
              className="flex-1 gap-2"
              disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0 || topupMutation.isPending}
              onClick={() => {
                if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                  toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
                  return;
                }
                topupMutation.mutate(parsedAmount);
              }}
            >
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
            Scan with banking app • Redirects to VNPay
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-lg mb-1">Recent Transactions</h3>
        {txLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !txRes?.items?.length ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-3 mt-4">
            {txRes.items.map((tx) => {
              const signed = typeSignedAmount(tx.type, tx.amount);
              const meta = statusLabel(tx.status);
              const isDebit = signed < 0;

              const desc = tx.orderId ? "Order payment" : tx.type === 0 ? "Wallet top-up" : "Wallet transaction";
              const ref = tx.orderId ? `#ORD-${shortId(tx.orderId)}` : `#TX-${shortId(tx.id)}`;

              return (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{desc}</p>
                      <Badge className={meta.className}>{meta.text}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatVnDateTime(tx.createdAt)} • {ref}
                    </p>
                  </div>

                  <p className={cn("text-sm font-semibold", isDebit ? "text-destructive" : "text-primary")}>
                    {signed > 0 ? "+" : "-"}
                    {formatVND(Math.abs(signed))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
