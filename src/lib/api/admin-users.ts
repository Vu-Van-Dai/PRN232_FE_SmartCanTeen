import { apiRequest } from "./http";
import type {
  AdminUserListItem,
  CreateUserRequest,
  CreateUserResponse,
  Guid,
  ToggleUserResponse,
} from "./types";

export function createAdminUser(body: CreateUserRequest) {
  return apiRequest<CreateUserResponse>("/api/admin/users", { method: "POST", body });
}

export function getAdminUsers(role?: string) {
  return apiRequest<AdminUserListItem[]>("/api/admin/users", {
    method: "GET",
    query: { role },
  });
}

export function toggleUserActive(id: Guid) {
  return apiRequest<ToggleUserResponse>(`/api/admin/users/${id}/toggle`, {
    method: "POST",
  });
}

export function resetUserPassword(id: Guid) {
  return apiRequest<{ message: string }>(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}

export function deleteUser(id: Guid) {
  return apiRequest<void>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}
