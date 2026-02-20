import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, UtensilsCrossed, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parentApi } from "@/lib/api";
import type { StudentOrderDto } from "@/lib/api/types";
import { formatVnTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const SELECTED_CHILD_KEY = "parentSelectedStudentId";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function formatTime(dateString: string | null) {
  if (!dateString) return "Lấy ngay";
  return formatVnTime(dateString);
}

function getStatusLabel(status: number) {
  switch (status) {
    case 1:
      return "Chờ xử lý";
    case 3:
      return "Đặt trước";
    case 4:
      return "Đang nấu";
    case 5:
      return "Đã xong";
    case 6:
      return "Đã huỷ";
    case 7:
      return "Hoàn thành";
    default:
      return "Không xác định";
  }
}

function getStatusColor(status: number) {
  switch (status) {
    case 1:
      return "bg-yellow-100 text-yellow-800";
    case 3:
      return "bg-purple-100 text-purple-800";
    case 4:
      return "bg-blue-100 text-blue-800";
    case 5:
      return "bg-green-100 text-green-800";
    case 7:
      return "bg-gray-100 text-gray-800";
    case 6:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function isActiveOrder(status: number) {
  return status === 1 || status === 3 || status === 4 || status === 5;
}

interface OrderItemDisplay {
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function ParentChildOrders() {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["parent", "child-orders", selectedChildId],
    queryFn: () => parentApi.getChildOrders(selectedChildId as string),
    enabled: !!selectedChildId,
    staleTime: 10_000,
    refetchInterval: 5_000,
    retry: false,
  });

  const { activeOrders, historicalOrders } = useMemo(() => {
    const active = orders.filter((order) => isActiveOrder(order.status));
    const historical = orders.filter((order) => !isActiveOrder(order.status));
    return { activeOrders: active, historicalOrders: historical };
  }, [orders]);

  if (!children.length && !isLoading) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Đơn hàng của con</h1>
        <p className="text-muted-foreground">Bạn chưa liên kết học sinh. Vào mục “Liên kết & hồ sơ” để liên kết.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Đang tải đơn hàng…</p>
        </div>
      </div>
    );
  }

  if (activeOrders.length === 0 && historicalOrders.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Đơn hàng của con</h1>
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

        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">Chưa có đơn hàng</h2>
            <p className="text-muted-foreground">Hiện tại không có đơn nào cho học sinh đã chọn.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng của con</h1>
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

      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Đơn hiện tại</h2>
            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
              {activeOrders.length} đơn
            </span>
          </div>

          <div className="grid gap-4">
            {activeOrders.map((order) => {
              const items = order.items as unknown as OrderItemDisplay[];
              return (
                <div
                  key={order.id}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            Đơn #{order.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={cn(
                              "inline-block px-2.5 py-1 rounded-full text-xs font-semibold",
                              getStatusColor(order.status)
                            )}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Dự kiến: {formatTime(order.pickupTime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatVND(order.totalPrice)}</p>
                          <p className="text-xs text-muted-foreground">{items.length} món</p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform",
                            expandedOrderId === order.id && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                      <h3 className="font-semibold text-sm">Danh sách món</h3>
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}× {item.name}
                            </span>
                            <span>{formatVND(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(null)}>
                          Đóng
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historicalOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Lịch sử</h2>
          <div className="grid gap-3">
            {historicalOrders.map((order) => {
              const items = order.items as unknown as OrderItemDisplay[];
              return (
                <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          Đơn #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={cn(
                            "inline-block px-2.5 py-1 rounded-full text-xs font-semibold",
                            getStatusColor(order.status)
                          )}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {items.length} món • {formatVND(order.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
