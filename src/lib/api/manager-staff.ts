import { apiRequest } from "./http";
import type { Guid, ManagerStaffListItem, ToggleUserResponse } from "./types";

export function getStaffUsers() {
  return apiRequest<ManagerStaffListItem[]>("/api/manager/staff/users", { method: "GET" });
}

export function toggleStaffUserActive(id: Guid) {
  return apiRequest<ToggleUserResponse>(`/api/manager/staff/${id}/toggle`, { method: "POST" });
}

export function deleteStaffUser(id: Guid) {
  return apiRequest<void>(`/api/manager/staff/${id}`, { method: "DELETE" });
}
