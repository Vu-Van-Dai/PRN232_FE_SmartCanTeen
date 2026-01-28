import { apiRequest } from "./http";
import type { Guid, KitchenOrdersResponse } from "./types";

export function getKitchenOrders() {
  return apiRequest<KitchenOrdersResponse>("/api/kitchen/orders", { method: "GET" });
}

export function startCooking(orderId: Guid) {
  return apiRequest<void>(`/api/kitchen/${orderId}/prepare`, { method: "POST" });
}

export function markOrderReady(orderId: Guid) {
  return apiRequest<void>(`/api/kitchen/${orderId}/ready`, { method: "POST" });
}

export function completeOrder(orderId: Guid) {
  return apiRequest<void>(`/api/kitchen/${orderId}/complete`, { method: "POST" });
}
