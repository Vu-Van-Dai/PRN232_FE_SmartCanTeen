import { apiRequest } from "./http";
import type {
  CreateOfflineOrderRequest,
  CreateOfflineOrderResponse,
  CreateOnlineOrderRequest,
  CreateOnlineOrderResponse,
  Guid,
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
