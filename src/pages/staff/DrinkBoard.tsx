import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Check, CheckCheck, MoreHorizontal, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import * as kitchenApi from "@/lib/api/kitchen";
import type { Guid, KitchenOrderDto, KitchenOrdersResponse } from "@/lib/api/types";
import { formatVnTime } from "@/lib/datetime";

type StationTaskStatus = 1 | 2 | 3 | 4;

type BoardOrderStatus = "preparing" | "ready";

type BoardOrder = {
  id: Guid;
  displayId: string;
  customerName: string;
  items: string[];
  time: string;
  status: BoardOrderStatus;
  stationTaskStatus?: StationTaskStatus | null;
};

function shortId(id: string) {
  return id.length <= 6 ? id : id.slice(0, 6);
}

function minutesAgo(iso: string) {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${m}m`;
}

function minutesUntil(iso: string) {
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 60000);
}

function formatDueTimeLocal(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return formatVnTime(ms);
}

function getForecastStyle(mins: number) {
  if (mins <= 15) {
    return {
      text: "text-amber-700",
      border: "border-amber-200",
      bg: "bg-amber-50",
      dot: "bg-amber-500",
      label: "DUE SOON",
    };
  }

  if (mins <= 30) {
    return {
      text: "text-emerald-700",
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      dot: "bg-emerald-500",
      label: "NEXT UP",
    };
  }

  return {
    text: "text-blue-700",
    border: "border-blue-200",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    label: "UPCOMING",
  };
}

function toBoardStatus(taskStatus?: number | null): BoardOrderStatus {
  switch (taskStatus) {
    case 3:
      return "ready";
    case 2:
    case 1:
    default:
      return "preparing";
  }
}

function taskStatusLabel(taskStatus?: number | null) {
  switch (taskStatus) {
    case 4:
      return "Completed";
    case 3:
      return "Ready";
    case 2:
      return "Preparing";
    case 1:
    default:
      return "Pending";
  }
}

function taskStatusBadgeClass(taskStatus?: number | null) {
  switch (taskStatus) {
    case 4:
      return "bg-emerald-600 text-white";
    case 3:
      return "bg-primary text-primary-foreground";
    case 2:
      return "bg-warning text-warning-foreground";
    case 1:
    default:
      return "bg-slate-700 text-white";
  }
}

function mapOrder(x: KitchenOrderDto): BoardOrder {
  const status = toBoardStatus(x.stationTaskStatus ?? null);
  const created = minutesAgo(x.createdAt);

  let time = created || "Now";
  if (status === "ready") time = "Ready";

  return {
    id: x.id,
    displayId: shortId(x.id),
    customerName: x.orderedBy,
    items: x.items.map((i) => `${i.quantity}x ${i.name}`),
    time,
    status,
    stationTaskStatus: (x.stationTaskStatus ?? null) as StationTaskStatus | null,
  };
}

function OrderCard({
  order,
  onMarkReady,
  onComplete,
  isMarkingReady,
  isCompleting,
}: {
  order: BoardOrder;
  onMarkReady: (id: Guid) => void;
  onComplete: (id: Guid) => void;
  isMarkingReady: boolean;
  isCompleting: boolean;
}) {
  const isPreparing = order.status === "preparing";

  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-4",
        isPreparing && "border-l-4 border-l-warning border-t-border border-r-border border-b-border",
        order.status === "ready" && "border-border",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{order.displayId}</span>
            <Badge className={cn("uppercase text-[10px] px-2 py-0.5", taskStatusBadgeClass(order.stationTaskStatus))}>
              {taskStatusLabel(order.stationTaskStatus)}
            </Badge>
          </div>
          <h3 className="font-semibold mt-1">{order.customerName}</h3>
        </div>
        {order.status === "ready" && <span className="text-primary">🥤</span>}
      </div>

      <div className="space-y-1 mb-4">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {item}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className={cn("w-4 h-4", "text-muted-foreground")} />
          <span className="text-muted-foreground">{order.time}</span>
        </div>

        {isPreparing ? (
          <Button size="sm" variant="secondary" className="gap-1" onClick={() => onMarkReady(order.id)} disabled={isMarkingReady}>
            {isMarkingReady ? "Đang xong..." : "Mark Ready"}
            <Check className="w-3 h-3" />
          </Button>
        ) : (
          <Button size="sm" className="gap-1" onClick={() => onComplete(order.id)} disabled={isCompleting}>
            {isCompleting ? "Completing..." : "Complete"}
            <CheckCheck className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isPreparing && (
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${Math.min(100, parseInt(order.time) * 10)}%` }} />
        </div>
      )}
    </div>
  );
}

export default function DrinkBoard() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const screenKey = searchParams.get("screenKey") ?? "drink";

  const [markingReadyId, setMarkingReadyId] = useState<Guid | null>(null);
  const [completingId, setCompletingId] = useState<Guid | null>(null);
  const [startingId, setStartingId] = useState<Guid | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kitchen-orders", screenKey],
    queryFn: () => kitchenApi.getKitchenOrders(screenKey),
    refetchInterval: 2_000,
    staleTime: 0,
  });

  const startPreparingMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.startCooking(orderId, screenKey),
    onMutate: async (orderId) => {
      setStartingId(orderId);
      await qc.cancelQueries({ queryKey: ["kitchen-orders", screenKey] });
    },
    onError: (err) => {
      toast({ title: "Bắt đầu chuẩn bị thất bại", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders", screenKey] });
    },
    onSettled: () => setStartingId(null),
  });

  const markReadyMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.markOrderReady(orderId, screenKey),
    onMutate: async (orderId) => {
      setMarkingReadyId(orderId);
      await qc.cancelQueries({ queryKey: ["kitchen-orders", screenKey] });
      const prev = qc.getQueryData<KitchenOrdersResponse>(["kitchen-orders", screenKey]);
      if (prev) {
        qc.setQueryData<KitchenOrdersResponse>(["kitchen-orders", screenKey], {
          ...prev,
          preparing: prev.preparing.filter((x) => x.id !== orderId),
        });
      }
      return { prev };
    },
    onError: (err, _orderId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["kitchen-orders", screenKey], ctx.prev);
      toast({ title: "Chuyển sang sẵn sàng thất bại", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders", screenKey] });
    },
    onSettled: () => setMarkingReadyId(null),
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: Guid) => kitchenApi.completeOrder(orderId, screenKey),
    onMutate: async (orderId) => {
      setCompletingId(orderId);
      await qc.cancelQueries({ queryKey: ["kitchen-orders", screenKey] });
      const prev = qc.getQueryData<KitchenOrdersResponse>(["kitchen-orders", screenKey]);
      if (prev) {
        qc.setQueryData<KitchenOrdersResponse>(["kitchen-orders", screenKey], {
          ...prev,
          ready: prev.ready.filter((x) => x.id !== orderId),
        });
      }
      return { prev };
    },
    onError: (err, _orderId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["kitchen-orders", screenKey], ctx.prev);
      toast({ title: "Hoàn tất thất bại", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["kitchen-orders", screenKey] });
    },
    onSettled: () => setCompletingId(null),
  });

  const preparingOrders = (data?.preparing ?? []).map(mapOrder);
  const readyOrders = (data?.ready ?? []).map(mapOrder);

  const forecast = useMemo(() => {
    const upcoming = (data?.upcoming ?? []).filter((x) => !!x.pickupTime);
    return upcoming
      .map((x) => {
        const mins = x.pickupTime ? minutesUntil(x.pickupTime) : null;
        return { x, mins: mins ?? 999 };
      })
      .filter((p) => p.mins > 0 && p.mins <= 60)
      .sort((a, b) => a.mins - b.mins);
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Drink Station</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">Màn hình: {screenKey}</span>
          </div>
        </div>
      </div>

      {isError && (
        <Card className="p-4 mb-6 border-destructive">
          <p className="text-destructive text-sm">Không tải được đơn: {error instanceof Error ? error.message : "Lỗi không xác định"}</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-warning rounded-full" />
              <h2 className="font-semibold">Đang chuẩn bị</h2>
              <Badge variant="secondary" className="rounded-full">{preparingOrders.length}</Badge>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải đơn...
              </div>
            )}
            {!isLoading && !isError && preparingOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">Không có đơn đang chuẩn bị.</div>
            )}

            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onMarkReady={(id) => markReadyMutation.mutate(id)}
                onComplete={(id) => completeMutation.mutate(id)}
                isMarkingReady={markingReadyId === order.id}
                isCompleting={completingId === order.id}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <h2 className="font-semibold">Sẵn sàng</h2>
              <Badge variant="secondary" className="rounded-full">{readyOrders.length}</Badge>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {!isLoading && !isError && readyOrders.length === 0 && (
              <div className="text-sm text-muted-foreground">Chưa có đơn sẵn sàng.</div>
            )}

            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onMarkReady={(id) => markReadyMutation.mutate(id)}
                onComplete={(id) => completeMutation.mutate(id)}
                isMarkingReady={markingReadyId === order.id}
                isCompleting={completingId === order.id}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />
              <h2 className="font-semibold">Sắp tới</h2>
              <Badge variant="secondary" className="rounded-full">{forecast.length}</Badge>
            </div>
            <button className="p-1 hover:bg-muted rounded" aria-label="Upcoming options">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {!isLoading && !isError && forecast.length === 0 && (
              <div className="text-sm text-muted-foreground">Không có lịch nhận trong 60 phút tới.</div>
            )}

            {forecast.map(({ x, mins }) => {
              const style = getForecastStyle(mins);
              const dueAt = x.pickupTime ? formatDueTimeLocal(x.pickupTime) : "";
              const isStarting = startingId === x.id;
              return (
                <div
                  key={x.id}
                  className={cn("rounded-lg border p-4", style.border, style.bg)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", style.dot)} />
                        <div className="text-sm font-medium truncate">#{shortId(x.id)}</div>
                        <span className={cn("text-[10px] font-semibold", style.text)}>{style.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{x.orderedBy}</div>
                    </div>

                    <div className="text-right">
                      <div className={cn("text-sm font-mono font-semibold", style.text)}>còn {mins}p</div>
                      <div className="text-[10px] text-muted-foreground">dự kiến {dueAt}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {x.items.slice(0, 3).map((i, idx) => (
                      <div key={idx} className="truncate">
                        {i.quantity}x {i.name}
                      </div>
                    ))}
                    {x.items.length > 3 && <div className="opacity-70">+{x.items.length - 3} món nữa</div>}
                  </div>

                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => startPreparingMutation.mutate(x.id)}
                      disabled={isStarting}
                    >
                      {isStarting ? "Đang bắt đầu..." : "Bắt đầu chuẩn bị"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
