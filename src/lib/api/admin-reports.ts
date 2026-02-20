import { ApiError, apiRequest, defaultApiConfig } from "./http";
import type { AdminOrdersByDayResponse, AdminRevenueSeriesResponse } from "./types";

export function getRevenueSeries(mode: "week" | "month", date: string) {
  return apiRequest<AdminRevenueSeriesResponse>("/api/admin/reports/series", {
    method: "GET",
    query: { mode, date },
  });
}

export function getOrdersByDay(date: string) {
  return apiRequest<AdminOrdersByDayResponse>("/api/admin/reports/orders", {
    method: "GET",
    query: { date },
  });
}

export type AdminRevenueReportPdfRequest = {
  mode: "week" | "month";
  date: string;
  preparedBy?: string;
  canteenRep?: string;
  schoolRep?: string;
  confirmedDate?: string;
};

export async function downloadRevenueReportPdf(input: AdminRevenueReportPdfRequest) {
  if (!defaultApiConfig.baseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Configure it to your BE base URL (e.g. https://localhost:5001).",
    );
  }

  const base = defaultApiConfig.baseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/api/admin/reports/export-pdf`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = defaultApiConfig.getAccessToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: input.mode,
      date: input.date,
      preparedBy: input.preparedBy,
      canteenRep: input.canteenRep,
      schoolRep: input.schoolRep,
      confirmedDate: input.confirmedDate,
    }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const parsedBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    throw new ApiError(`HTTP ${res.status} ${res.statusText}`, res.status, parsedBody);
  }

  return res.blob();
}
