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

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

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
    const msg =
      typeof parsedBody === "string" && parsedBody
        ? parsedBody
        : `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, parsedBody);
  }

  return parsedBody as T;
}
