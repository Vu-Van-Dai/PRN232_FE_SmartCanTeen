import { apiRequest } from "./http";
import type { Guid } from "./types";

export function assignStaffRole(userId: Guid, roleName: "StaffKitchen" | "StaffPOS" | "StaffCoordination" | "StaffDrink") {
  return apiRequest<string>(`/api/manager/staff/${userId}/assign`, {
    method: "POST",
    query: { roleName },
  });
}

export function removeStaffRole(userId: Guid, roleName: "StaffKitchen" | "StaffPOS" | "StaffCoordination" | "StaffDrink") {
  return apiRequest<string>(`/api/manager/staff/${userId}/remove`, {
    method: "DELETE",
    query: { roleName },
  });
}
