import { apiRequest } from "./http";
import type {
  CreateMenuItemRequest,
  Guid,
  MenuItemResponse,
  TopSellingMenuItemResponse,
  UpdateMenuItemRequest,
} from "./types";

export function getMenuItems() {
  return apiRequest<MenuItemResponse[]>("/api/menu-items", { method: "GET" });
}

export function getTopSellingMenuItems(params?: { date?: string; take?: number }) {
  return apiRequest<TopSellingMenuItemResponse[]>("/api/menu-items/top-selling", {
    method: "GET",
    query: {
      date: params?.date,
      take: params?.take,
    },
  });
}

export function createMenuItem(body: CreateMenuItemRequest) {
  return apiRequest<Guid>("/api/menu-items", { method: "POST", body });
}

export function updateMenuItem(id: Guid, body: UpdateMenuItemRequest) {
  return apiRequest<void>(`/api/menu-items/${id}`, { method: "PUT", body });
}

export function deleteMenuItem(id: Guid) {
  return apiRequest<void>(`/api/menu-items/${id}`, { method: "DELETE" });
}
