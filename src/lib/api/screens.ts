import { apiRequest } from "./http";
import type { Guid } from "./types";

export type ScreenItem = {
  id: Guid;
  key: string;
  name: string;
  isActive: boolean;
  categoryIds: Guid[];
};

export type ListScreensResponse = {
  items: ScreenItem[];
};

export type UpsertScreenRequest = {
  key: string;
  name: string;
  isActive: boolean;
  categoryIds: Guid[];
};

export function listManagerScreens() {
  return apiRequest<ListScreensResponse>("/api/manager/screens", { method: "GET" });
}

export function createManagerScreen(body: UpsertScreenRequest) {
  return apiRequest<{ id: Guid }>("/api/manager/screens", { method: "POST", body });
}

export function updateManagerScreen(id: Guid, body: UpsertScreenRequest) {
  return apiRequest<void>(`/api/manager/screens/${id}`, { method: "PUT", body });
}

export function deleteManagerScreen(id: Guid) {
  return apiRequest<void>(`/api/manager/screens/${id}`, { method: "DELETE" });
}
