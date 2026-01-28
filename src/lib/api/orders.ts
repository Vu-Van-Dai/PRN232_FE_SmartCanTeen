import { ApiError, apiRequest } from "./http";
import type {
  CreateOfflineOrderRequest,
  CreateOfflineOrderResponse,
  CreateOnlineOrderRequest,
  CreateOnlineOrderResponse,
  Guid,
  PosPaymentStatusResponse,
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
export function payExistingPosOrderByCash(orderId: Guid) {
  return apiRequest<void>(`/api/pos/orders/${orderId}/cash`, {
    method: "POST",
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
