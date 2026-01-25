import { apiRequest } from "./http";
import type {
  DailyReportResponse,
  DashboardSnapshotResponse,
  Guid,
  ShiftDetailResponse,
} from "./types";

export function getDashboardSnapshot() {
  return apiRequest<DashboardSnapshotResponse>("/api/management/reports/dashboard", {
    method: "GET",
  });
}

export function getDailyReport(date: string) {
  return apiRequest<DailyReportResponse>("/api/management/reports/daily", {
    method: "GET",
    query: { date },
  });
}

export function closeDay(date: string) {
  return apiRequest<unknown>("/api/management/reports/close-day", {
    method: "POST",
    query: { date },
  });
}

export function getShiftDetail(shiftId: Guid) {
  return apiRequest<ShiftDetailResponse>(`/api/management/reports/shift/${shiftId}`, {
    method: "GET",
  });
}
