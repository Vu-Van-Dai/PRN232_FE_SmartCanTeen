import { ApiError, apiRequest } from "./http";
import type {
  CreateOfflineOrderRequest,
  CreateOfflineOrderResponse,
  CreateOnlineOrderRequest,
  CreateOnlineOrderResponse,
  Guid,
  PayPosOrderByCashRequest,
  PosRefundInfoResponse,
  PosPaymentStatusResponse,
  RefundPosOrderRequest,
  RefundReceiptResponse,
  StudentOrderDto,
} from "./types";

// Student/Parent
export function createOnlineOrder(body: CreateOnlineOrderRequest) {
  return apiRequest<CreateOnlineOrderResponse>("/api/online/orders", {
    method: "POST",
    body,
  });
}

// Student/Parent
export function payOnlineOrderWithWallet(orderId: Guid) {
  return apiRequest<string>(`/api/wallet/pay/${orderId}`, { method: "POST" });
}

// Staff/POS/Manager
export function createPosOfflineOrder(body: CreateOfflineOrderRequest) {
  return apiRequest<CreateOfflineOrderResponse>("/api/pos/orders", {
    method: "POST",
    body,
  });
}

// Staff/POS/Manager
export function createPosOfflineOrderCash(body: CreateOfflineOrderRequest) {
  return apiRequest<{ orderId: Guid }>("/api/pos/orders/cash", {
    method: "POST",
    body,
  });
}

// Staff/POS/Manager
export function payExistingPosOrderByCash(orderId: Guid, body?: PayPosOrderByCashRequest) {
  return apiRequest<void>(`/api/pos/orders/${orderId}/cash`, {
    method: "POST",
    body,
  });
}

// Staff/POS/Manager
export function cancelExistingPosOrder(orderId: Guid) {
  return apiRequest<void>(`/api/pos/orders/${orderId}/cancel`, {
    method: "POST",
  });
}

// Staff/POS/Manager
export function getPosOrderPaymentStatus(orderId: Guid) {
  return apiRequest<PosPaymentStatusResponse>(`/api/pos/orders/${orderId}/payment-status`);
}

// Staff/POS/Manager
export function getPosOrderRefundInfo(orderId: Guid) {
  return apiRequest<PosRefundInfoResponse>(`/api/pos/orders/${orderId}/refund-info`);
}

// Staff/POS/Manager
// Lookup by short key (e.g. first 8 chars shown on receipts) or GUID.
export function getPosOrderRefundInfoByKey(orderKey: string) {
  return apiRequest<PosRefundInfoResponse>(`/api/pos/orders/refund-info/${encodeURIComponent(orderKey)}`);
}

// Staff/POS/Manager
export function refundPosOrder(orderId: Guid, body: RefundPosOrderRequest) {
  return apiRequest<RefundReceiptResponse>(`/api/pos/orders/${orderId}/refund`, {
    method: "POST",
    body,
  });
}

export type RefundPosOrderItemsRequest = {
  items: Array<{ orderItemId: Guid; quantity: number }>;
  amountReturned?: number | null;
  reason?: string | null;
};

export function refundPosOrderByItems(orderId: Guid, body: RefundPosOrderItemsRequest) {
  return apiRequest<RefundReceiptResponse>(`/api/pos/orders/${orderId}/refund-items`, {
    method: "POST",
    body,
  });
}

// Student/Parent
// Note: BE endpoint may not exist yet; return [] on 404/501 so UI still works.
export async function getMyOrders() {
  try {
    return await apiRequest<StudentOrderDto[]>("/api/orders/me");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return [];
    }
    throw err;
  }
}
