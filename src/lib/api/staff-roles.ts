import { apiRequest } from "./http";
import type { Guid } from "./types";

export function assignStaffRole(userId: Guid, roleName: "Kitchen" | "StaffPos") {
  return apiRequest<string>(`/api/manager/staff/${userId}/assign`, {
    method: "POST",
    query: { roleName },
  });
}

export function removeStaffRole(userId: Guid, roleName: "Kitchen" | "StaffPos") {
  return apiRequest<string>(`/api/manager/staff/${userId}/remove`, {
    method: "DELETE",
    query: { roleName },
  });
}
