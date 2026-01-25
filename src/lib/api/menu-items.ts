import { apiRequest } from "./http";
import type {
  CreateMenuItemRequest,
  Guid,
  MenuItemResponse,
  UpdateMenuItemRequest,
} from "./types";

export function getMenuItems() {
  return apiRequest<MenuItemResponse[]>("/api/menu-items", { method: "GET" });
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
