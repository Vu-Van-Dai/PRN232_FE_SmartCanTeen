import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, UtensilsCrossed, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ordersApi } from "@/lib/api";
import type { StudentOrderDto } from "@/lib/api/types";
import { formatVnTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

function formatTime(dateString: string | null) {
  if (!dateString) return "Lấy ngay";
  return formatVnTime(dateString);
}

function getStatusLabel(status: number) {
  switch (status) {
    case 1: // Pending
      return "Chờ xử lý";
    case 3: // SystemHolding (pre-order)
      return "Đặt trước";
    case 4: // Preparing
      return "Đang nấu";
    case 5: // Ready
      return "Đã xong";
    case 6: // Cancelled
      return "Đã huỷ";
    case 7: // Completed
      return "Hoàn thành";
    default:
      return "Không xác định";
  }
}

function stationTaskLabel(status: number) {
  switch (status) {
    case 4:
      return "Hoàn tất";
    case 3:
      return "Đã xong";
    case 2:
      return "Đang làm";
    case 1:
    default:
      return "Chờ";
  }
}

function stationTaskColor(status: number) {
  switch (status) {
    case 4:
      return "bg-emerald-100 text-emerald-800";
    case 3:
      return "bg-green-100 text-green-800";
    case 2:
      return "bg-blue-100 text-blue-800";
    case 1:
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function getOverallProgressLabel(order: StudentOrderDto) {
  const tasks = order.stationTasks ?? [];
  if (tasks.length === 0) return getStatusLabel(order.status);

  const allDone = tasks.every((t) => t.status === 3 || t.status === 4);
  if (allDone) return "Đã xong";

  const anyPreparing = tasks.some((t) => t.status === 2);
  if (anyPreparing) return "Đang chuẩn bị";

  return "Chờ chế biến";
}

function getStatusColor(status: number) {
  switch (status) {
    case 1: // Pending
      return "bg-yellow-100 text-yellow-800";
    case 3: // Scheduled
      return "bg-purple-100 text-purple-800";
    case 4: // Preparing
      return "bg-blue-100 text-blue-800";
    case 5: // Ready
      return "bg-green-100 text-green-800";
    case 7: // Completed
      return "bg-gray-100 text-gray-800";
    case 6: // Cancelled
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

export default function StudentMyOrders() {
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: ordersApi.getMyOrders,
    staleTime: 10_000,
    refetchInterval: 3_000,
    retry: false,
  });

  const { activeOrders, historicalOrders } = useMemo(() => {
    const active = orders.filter((order) => isActiveOrder(order.status));
    const historical = orders.filter((order) => !isActiveOrder(order.status));
    return { activeOrders: active, historicalOrders: historical };
  }, [orders]);

  const handleReorder = (order: StudentOrderDto) => {
    // In a real implementation, this would add the items back to the cart
    toast({
      title: "Đặt lại",
      description: `Đang thêm các món từ đơn #${order.id.substring(0, 8)} vào giỏ hàng...`,
    });
    // TODO: Implement reorder logic
  };

  const handleCancel = async (orderId: string) => {
    if (confirm("Bạn có chắc chắn muốn huỷ đơn này không?")) {
      try {
        // TODO: Call cancel API when available
        toast({
          title: "Đã huỷ đơn",
          description: `Đơn #${orderId.substring(0, 8)} đã được huỷ.`,
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Huỷ đơn thất bại",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (activeOrders.length === 0 && historicalOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">Không có đơn đang hoạt động</h2>
          <p className="text-muted-foreground mb-6">Hiện tại bạn chưa có đơn nào.</p>
          <Button onClick={() => navigate("/student/menu")} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Đi đến Menu
          </Button>
        </div>
      </div>
    );
  }

  if (activeOrders.length === 0 && historicalOrders.length > 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-10 border border-border rounded-lg bg-card">
          <UtensilsCrossed className="h-14 w-14 text-muted-foreground mb-3 opacity-60" />
          <h2 className="text-xl font-semibold">Không có đơn đang hoạt động</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Xem lịch sử bên dưới hoặc đặt món mới.</p>
          <Button onClick={() => navigate("/student/menu")} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Đi đến Menu
          </Button>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Lịch Sử Đơn Hàng</h2>

          <div className="grid gap-3">
            {historicalOrders.map((order) => {
              const items = order.items as unknown as OrderItemDisplay[];
              const stationTasks = order.stationTasks ?? [];
              const overallLabel = getOverallProgressLabel(order);
              return (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
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
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleReorder(order)}>
                      Đặt lại
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Đơn Hàng Hiện Tại</h2>
            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
              {activeOrders.length} đơn
            </span>
          </div>

          <div className="grid gap-4">
            {activeOrders.map((order) => {
              const items = order.items as unknown as OrderItemDisplay[];
              const stationTasks = order.stationTasks ?? [];
              const overallLabel = getOverallProgressLabel(order);
              return (
                <div
                  key={order.id}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                    }
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
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
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Dự kiến: {formatTime(order.pickupTime)}</span>
                          </div>
                          {order.pickedAtCounter && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              Quầy: {order.pickedAtCounter}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div className="text-left sm:text-right">
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

                  {/* Expanded Content */}
                  {expandedOrderId === order.id && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                      {/* Items List */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Danh sách món</h3>
                        <div className="space-y-1">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{item.name}</span>
                                <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {formatVND(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notifications Info */}
                      <div className="bg-background rounded p-3 border border-border/50">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                          🔔 Thông báo
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {order.status === 4 && (
                            <>
                              <li>✓ Đơn hàng đang được nấu</li>
                              <li>• Bạn sẽ nhận thông báo khi sẵn sàng lấy</li>
                            </>
                          )}
                          {order.status === 5 && (
                            <>
                              <li>✓ Đơn hàng đã xong, sẵn sàng lấy!</li>
                              <li>• Vui lòng tới quầy nhận ngay</li>
                            </>
                          )}
                          {order.status === 3 && (
                            <>
                              <li>✓ Đơn hàng đặt trước</li>
                              <li>• Bạn sẽ được thông báo khi bắt đầu nấu</li>
                            </>
                          )}
                          {order.status === 1 && (
                            <>
                              <li>• Đơn hàng của bạn đang chờ xử lý</li>
                              <li>• Bạn sẽ nhận thông báo khi bắt đầu nấu</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="flex-1"
                        >
                          Đặt lại
                        </Button>
                        {order.status === 3 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(order.id)}
                            className="flex-1"
                          >
                            Hủy Đơn
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Orders Section */}
      {historicalOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Lịch Sử Đơn Hàng</h2>

          <div className="grid gap-3">
            {historicalOrders.map((order) => {
              const items = order.items as unknown as OrderItemDisplay[];
              const stationTasks = order.stationTasks ?? [];
              const overallLabel = getOverallProgressLabel(order);
              return (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          Đơn #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={cn(
                            "inline-block px-2.5 py-1 rounded-full text-xs font-semibold",
                            getStatusColor(order.status)
                          )}
                        >
                          {overallLabel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {items.length} món • {formatVND(order.totalPrice)}
                      </p>

                      {stationTasks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {stationTasks.map((t) => (
                            <span
                              key={t.screenKey}
                              className={cn(
                                "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold",
                                stationTaskColor(t.status)
                              )}
                            >
                              <span className="truncate max-w-[140px]">{t.screenName}</span>
                              <span className="opacity-80">•</span>
                              <span>{stationTaskLabel(t.status)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(order)}
                      className="w-full sm:w-auto"
                    >
                      Đặt lại
                    </Button>
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
