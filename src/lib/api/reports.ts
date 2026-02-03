import { ApiError, apiRequest, defaultApiConfig } from "./http";
import type {
  DailyReportResponse,
  DashboardSnapshotResponse,
  DashboardHourlyResponse,
  DayStatusResponse,
  DailySalesReportResponse,
  Guid,
  ShiftReportResponse,
  ShiftDetailResponse,
} from "./types";

export function getDashboardSnapshot() {
  return apiRequest<DashboardSnapshotResponse>("/api/management/reports/dashboard", {
    method: "GET",
  });
}

export function getDashboardHourly(date: string) {
  return apiRequest<DashboardHourlyResponse>("/api/management/reports/dashboard/hourly", {
    method: "GET",
    query: { date },
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

export function getDayStatus(date: string) {
  return apiRequest<DayStatusResponse>("/api/management/reports/day-status", {
    method: "GET",
    query: { date },
  });
}

export function getShiftDetail(shiftId: Guid) {
  return apiRequest<ShiftDetailResponse>(`/api/management/reports/shift/${shiftId}`, {
    method: "GET",
  });
}

export function getShiftReport(shiftId: Guid) {
  return apiRequest<ShiftReportResponse>(`/api/management/reports/shift/${shiftId}/report`, {
    method: "GET",
  });
}

export function getDailySalesReport(date: string) {
  return apiRequest<DailySalesReportResponse>("/api/management/reports/daily-sales", {
    method: "GET",
    query: { date },
  });
}

export async function downloadDailySalesCsv(date: string) {
  if (!defaultApiConfig.baseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Configure it to your BE base URL (e.g. https://localhost:5001).",
    );
  }

  const base = defaultApiConfig.baseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/api/management/reports/daily-sales/export`);
  url.searchParams.set("date", date);

  const headers: Record<string, string> = {};
  const token = defaultApiConfig.getAccessToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), { method: "GET", headers });
  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const parsedBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    throw new ApiError(`HTTP ${res.status} ${res.statusText}`, res.status, parsedBody);
  }

  return res.blob();
}

export async function downloadDailySalesPdf(date: string) {
  if (!defaultApiConfig.baseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Configure it to your BE base URL (e.g. https://localhost:5001).",
    );
  }

  const base = defaultApiConfig.baseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/api/management/reports/daily-sales/export-pdf`);
  url.searchParams.set("date", date);

  const headers: Record<string, string> = {};
  const token = defaultApiConfig.getAccessToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), { method: "GET", headers });
  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const parsedBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    throw new ApiError(`HTTP ${res.status} ${res.statusText}`, res.status, parsedBody);
  }

  return res.blob();
}
