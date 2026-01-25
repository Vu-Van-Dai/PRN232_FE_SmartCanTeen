import { apiRequest } from "./http";
import type { CurrentShiftResponse, Guid, StaffConfirmRequest } from "./types";

export function openShift() {
  return apiRequest<Guid>("/api/shifts/open", { method: "POST" });
}

export function getCurrentShift() {
  return apiRequest<CurrentShiftResponse>("/api/shifts/current", { method: "GET" });
}

export function startDeclare() {
  return apiRequest<void>("/api/shifts/start-declare", { method: "POST" });
}

export function startCounting() {
  return apiRequest<void>("/api/shifts/start-counting", { method: "POST" });
}

export function confirmShift(body: StaffConfirmRequest) {
  return apiRequest<void>("/api/shifts/confirm", { method: "POST", body });
}

export function closeShift() {
  return apiRequest<void>("/api/shifts/close", { method: "POST" });
}
