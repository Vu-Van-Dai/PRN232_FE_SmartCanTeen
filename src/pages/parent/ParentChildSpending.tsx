import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import QRCode from "react-qr-code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parentApi, walletApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatVnDateTime } from "@/lib/datetime";
import { toast } from "@/hooks/use-toast";

const SELECTED_CHILD_KEY = "parentSelectedStudentId";

const topUpAmounts = [20000, 50000, 100000];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function shortId(id: string) {
  if (!id) return "";
  return id.split("-")[0] ?? id;
}

function statusLabel(status: number) {
  // BE: Pending=0, Success=1, Failed=2
  if (status === 1) return { text: "Thành công", className: "bg-primary/10 text-primary" };
  if (status === 2) return { text: "Thất bại", className: "bg-destructive/10 text-destructive" };
  return { text: "Đang xử lý", className: "bg-warning/10 text-warning" };
}

function typeSignedAmount(type: number, amount: number) {
  // BE: Credit=0, Debit=1
  if (type === 1) return -Math.abs(amount);
  return Math.abs(amount);
}

export default function ParentChildSpending() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [selectedAmount, setSelectedAmount] = useState(topUpAmounts[1]);
  const [customAmount, setCustomAmount] = useState(String(topUpAmounts[1]));
  const [payosQrUrl, setPayosQrUrl] = useState<string | null>(null);
  const [pendingTopup, setPendingTopup] = useState<{ baseBalance: number; amount: number } | null>(null);

  const { data: children = [] } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: parentApi.listMyLinkedChildren,
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_CHILD_KEY);
      if (raw) setSelectedChildId(raw);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!children.length) return;
    const stillExists = selectedChildId && children.some((c) => c.id === selectedChildId);
    if (!stillExists) {
      setSelectedChildId(children[0]!.id);
      try {
        localStorage.setItem(SELECTED_CHILD_KEY, children[0]!.id);
      } catch {
        // ignore
      }
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    // Switching child should clear any pending QR/topup state.
    setPayosQrUrl(null);
    setPendingTopup(null);
  }, [selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["parent", "child-wallet", selectedChildId],
    queryFn: () => parentApi.getChildWallet(selectedChildId as string),
    enabled: !!selectedChildId,
    staleTime: 10_000,
    refetchInterval: payosQrUrl ? 2_500 : false,
    retry: false,
  });

  const { data: txRes, isLoading: txLoading } = useQuery({
    queryKey: ["parent", "child-wallet-transactions", selectedChildId],
    queryFn: () => parentApi.getChildWalletTransactions(selectedChildId as string, { skip: 0, take: 20 }),
    enabled: !!selectedChildId,
    staleTime: 10_000,
    refetchInterval: payosQrUrl ? 2_500 : false,
    retry: false,
  });

  if (!children.length) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Chi tiêu của con</h1>
        <p className="text-muted-foreground">Bạn chưa liên kết học sinh. Vào mục “Liên kết & hồ sơ” để liên kết.</p>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  useEffect(() => {
    if (!payosQrUrl) return;
    if (!pendingTopup) return;
    if (walletLoading) return;

    const target = pendingTopup.baseBalance + pendingTopup.amount;
    if (Number(balance) >= target) {
      setPayosQrUrl(null);
      setPendingTopup(null);
      toast({ title: "Nạp tiền thành công", description: "Số dư đã được cập nhật." });
      queryClient.invalidateQueries({ queryKey: ["parent", "child-wallet", selectedChildId] });
      queryClient.invalidateQueries({ queryKey: ["parent", "child-wallet-transactions", selectedChildId] });
    }
  }, [balance, payosQrUrl, pendingTopup, queryClient, selectedChildId, walletLoading]);

  const parsedAmount = useMemo(() => {
    const n = Number(String(customAmount).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  }, [customAmount]);

  const topupMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet?.walletId) throw new Error("Không tìm thấy ví của học sinh.");
      return walletApi.topupChildWallet(wallet.walletId, amount);
    },
    onSuccess: async (res) => {
      const url = res?.qrUrl;
      if (!url) {
        toast({ title: "Tạo yêu cầu nạp tiền thất bại", description: "Thiếu thông tin QR từ hệ thống.", variant: "destructive" });
        return;
      }

      setPendingTopup({ baseBalance: Number(balance ?? 0), amount: Number(parsedAmount) });
      setPayosQrUrl(url);
      toast({ title: "Tạo yêu cầu nạp tiền", description: "Vui lòng quét QR để thanh toán." });
      await queryClient.invalidateQueries({ queryKey: ["parent", "child-wallet-transactions", selectedChildId] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Nạp tiền thất bại";
      toast({ title: "Nạp tiền thất bại", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiêu của con</h1>
          <p className="text-sm text-muted-foreground">{selectedChild ? `Học sinh: ${selectedChild.name ?? selectedChild.email}` : ""}</p>
        </div>
        <Select
          value={selectedChildId ?? undefined}
          onValueChange={(v) => {
            setSelectedChildId(v);
            try {
              localStorage.setItem(SELECTED_CHILD_KEY, v);
            } catch {
              // ignore
            }
          }}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Chọn học sinh" />
          </SelectTrigger>
          <SelectContent>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {(c.name ?? c.email) + (c.studentCode ? ` (${c.studentCode})` : "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại</p>
        <h2 className="text-4xl font-bold mb-2">{walletLoading ? "…" : formatVND(Number(balance))}</h2>
        <p className="text-xs text-muted-foreground">Ví: {wallet?.walletId ? shortId(wallet.walletId) : "—"}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-lg mb-1">Nạp tiền vào ví của con</h3>
        <p className="text-sm text-muted-foreground mb-4">Nhập số tiền để tạo yêu cầu thanh toán.</p>

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

        <div className="flex gap-2">
          <Input value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
          <Button
            disabled={
              !wallet?.walletId ||
              !Number.isFinite(parsedAmount) ||
              parsedAmount <= 0 ||
              parsedAmount !== Math.floor(parsedAmount) ||
              topupMutation.isPending
            }
            onClick={() => {
              if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                toast({ title: "Số tiền không hợp lệ", description: "Vui lòng nhập số tiền hợp lệ.", variant: "destructive" });
                return;
              }
              if (parsedAmount !== Math.floor(parsedAmount)) {
                toast({ title: "Số tiền không hợp lệ", description: "Số tiền phải là số nguyên (VND).", variant: "destructive" });
                return;
              }
              topupMutation.mutate(parsedAmount);
            }}
          >
            Nạp tiền
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">Thanh toán qua PayOS • Quét QR để hoàn tất</p>
      </div>

      <Dialog
        open={!!payosQrUrl}
        onOpenChange={(open) => {
          if (open) return;
          setPayosQrUrl(null);
          setPendingTopup(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quét QR để nạp tiền</DialogTitle>
            <DialogDescription>
              Số tiền: <span className="font-medium">{Number.isFinite(parsedAmount) ? formatVND(parsedAmount) : "—"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              {payosQrUrl ? <QRCode value={payosQrUrl} size={220} /> : <div>Không có QR</div>}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">Đang chờ thanh toán…</div>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setPayosQrUrl(null);
                setPendingTopup(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-lg mb-1">Giao dịch gần đây</h3>
        {txLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : !txRes?.items?.length ? (
          <p className="text-sm text-muted-foreground">Chưa có giao dịch.</p>
        ) : (
          <div className="space-y-3 mt-4">
            {txRes.items.map((tx) => {
              const signed = typeSignedAmount(tx.type, tx.amount);
              const meta = statusLabel(tx.status);
              const isDebit = signed < 0;

              const desc = tx.orderId ? "Thanh toán đơn hàng" : tx.type === 0 ? "Nạp ví" : "Giao dịch ví";
              const ref = tx.orderId ? `#ORD-${shortId(tx.orderId)}` : `#TX-${shortId(tx.id)}`;

              return (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{desc}</p>
                      <Badge className={meta.className}>{meta.text}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatVnDateTime(tx.createdAt)} • {ref}</p>
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
