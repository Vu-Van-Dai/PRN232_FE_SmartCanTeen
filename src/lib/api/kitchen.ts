import { apiRequest } from "./http";
import type { Guid, KitchenOrdersResponse } from "./types";

export function getKitchenOrders(screenKey?: string) {
  return apiRequest<KitchenOrdersResponse>("/api/kitchen/orders", {
    method: "GET",
    query: screenKey ? { screenKey } : undefined,
  });
}

export function startCooking(orderId: Guid, stationKey?: string) {
  return apiRequest<void>(`/api/kitchen/${orderId}/prepare`, {
    method: "POST",
    query: stationKey ? { stationKey } : undefined,
  });
}

export function markOrderReady(orderId: Guid, stationKey?: string) {
  return apiRequest<void>(`/api/kitchen/${orderId}/ready`, {
    method: "POST",
    query: stationKey ? { stationKey } : undefined,
  });
}

export function completeOrder(orderId: Guid, stationKey?: string) {
  return apiRequest<void>(`/api/kitchen/${orderId}/complete`, {
    method: "POST",
    query: stationKey ? { stationKey } : undefined,
  });
}
