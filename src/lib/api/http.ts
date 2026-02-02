export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(parsedBody: unknown, fallback: string): string {
  if (typeof parsedBody === "string" && parsedBody.trim()) return parsedBody;

  if (parsedBody && typeof parsedBody === "object") {
    const obj = parsedBody as Record<string, unknown>;
    const detail = typeof obj.detail === "string" ? obj.detail.trim() : "";
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    const message = typeof obj.message === "string" ? obj.message.trim() : "";

    if (detail) return detail;
    if (message) return message;
    if (title) return title;

    // FluentValidation-style or ASP.NET model state errors
    const errors = obj.errors as unknown;
    if (errors && typeof errors === "object") {
      const firstKey = Object.keys(errors as Record<string, unknown>)[0];
      const firstVal = firstKey ? (errors as Record<string, unknown>)[firstKey] : undefined;
      if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return String(firstVal[0]);
      if (typeof firstVal === "string") return firstVal;
    }
  }

  return fallback;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiConfig = {
  baseUrl: string;
  getAccessToken?: () => string | null;
};

const defaultGetAccessToken = () => {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

export const defaultApiConfig: ApiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  getAccessToken: defaultGetAccessToken,
};

function normalizeUrl(baseUrl: string, path: string) {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

export async function apiRequest<T>(
  path: string,
  init: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    query?: Record<string, string | number | boolean | undefined | null>;
  } = {},
  config: ApiConfig = defaultApiConfig
): Promise<T> {
  if (!config.baseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Configure it to your BE base URL (e.g. https://localhost:5001)."
    );
  }

  const method = init.method ?? "GET";

  const url = new URL(normalizeUrl(config.baseUrl, path));
  if (init.query) {
    for (const [key, value] of Object.entries(init.query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    ...(init.headers ?? {}),
  };

  const token = config.getAccessToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body,
    signal: init.signal,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const parsedBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const fallback = `HTTP ${res.status} ${res.statusText}`;
    const msg = extractErrorMessage(parsedBody, fallback);
    throw new ApiError(msg, res.status, parsedBody);
  }

  return parsedBody as T;
}
