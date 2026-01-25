import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import * as shiftsApi from "@/lib/api/shifts";

const STORAGE_CASH_KEY = "smartcanteen:shift:cash";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function readCashInput(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_CASH_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function ShiftClose() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [cashInput, setCashInput] = React.useState<number | null>(() => readCashInput());

  const currentShiftQuery = useQuery({
    queryKey: ["shift", "current"],
    queryFn: () => shiftsApi.getCurrentShift(),
    refetchInterval: 3000,
  });

  const startDeclareMutation = useMutation({
    mutationFn: () => shiftsApi.startDeclare(),
    onError: (err: unknown) => {
      toast({
        title: "Không thể khai báo",
        description: getErrorMessage(err, "Vui lòng kiểm tra ca hiện tại"),
        variant: "destructive",
      });
    },
  });

  const startCountingMutation = useMutation({
    mutationFn: () => shiftsApi.startCounting(),
    onError: (err: unknown) => {
      toast({
        title: "Không thể bắt đầu đếm",
        description: getErrorMessage(err, "Vui lòng kiểm tra ca hiện tại"),
        variant: "destructive",
      });
    },
  });

  const declareMutation = useMutation({
    mutationFn: async () => {
      const shift = await currentShiftQuery.refetch().then((r) => r.data);
      if (!shift) throw new Error("No active shift");

      const cash = cashInput ?? readCashInput();
      if (cash === null) throw new Error("Vui lòng đếm và nhập Tiền mặt trước");

      // QR offline & online come from system. Confirm API requires cash + qr.
      await shiftsApi.confirmShift({ cash, qr: shift.systemQrTotal });
      await shiftsApi.closeShift();
    },
    onSuccess: () => {
      try {
        localStorage.removeItem(STORAGE_CASH_KEY);
      } catch {
        // ignore
      }
      toast({ title: "Khai báo & đóng ca thành công" });
      auth.logout();
      navigate("/auth/pos", { replace: true });
    },
    onError: (err: unknown) => {
      toast({
        title: "Khai báo thất bại",
        description: getErrorMessage(err, "Không thể khai báo"),
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    startDeclareMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const stored = readCashInput();
    setCashInput(stored);
  }, []);

  const shift = currentShiftQuery.data;
  const isBusy =
    currentShiftQuery.isFetching ||
    startDeclareMutation.isPending ||
    startCountingMutation.isPending ||
    declareMutation.isPending;

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Chốt ca</CardTitle>
          <CardDescription>
            3 hàng: Tiền mặt / QR offline / Online. Chỉ Tiền mặt cần nhập.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Row 1: Cash */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-card">
              <div>
                <div className="font-medium">Tiền mặt</div>
                <div className="text-sm text-muted-foreground">
                  {cashInput === null ? "Chưa nhập" : formatVND(cashInput)}
                </div>
              </div>
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={async () => {
                  await startCountingMutation.mutateAsync();
                  navigate("/pos/shift-close/cash");
                }}
              >
                Đếm
              </Button>
            </div>

            {/* Row 2: QR offline */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-card">
              <div>
                <div className="font-medium">QR offline</div>
                <div className="text-sm text-muted-foreground">
                  {shift ? formatVND(Number(shift.systemQrTotal)) : "…"}
                </div>
              </div>
              <Button variant="secondary" disabled>
                Tự động
              </Button>
            </div>

            {/* Row 3: Online */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-card">
              <div>
                <div className="font-medium">Online</div>
                <div className="text-sm text-muted-foreground">
                  {shift ? formatVND(Number(shift.systemOnlineTotal)) : "…"}
                </div>
              </div>
              <Button variant="secondary" disabled>
                Tự động
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={() => declareMutation.mutate()} disabled={isBusy || !shift}>
              Khai báo
            </Button>
          </div>

          {currentShiftQuery.isError ? (
            <div className="text-sm text-destructive">
              Không lấy được dữ liệu ca hiện tại. Vui lòng đảm bảo đã mở ca.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
