export type JwtPayload = Record<string, unknown>;

function base64UrlToBase64(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return padded + "=".repeat(padLen);
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadBase64 = base64UrlToBase64(parts[1]);
    const json = atob(payloadBase64);
    const parsed = safeJsonParse(json);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === "string");
  return [];
}

export function getJwtRoles(payload: JwtPayload | null): string[] {
  if (!payload) return [];

  const roles: string[] = [];

  // Common JWT conventions
  roles.push(...toStringArray(payload.role));
  roles.push(...toStringArray(payload.roles));

  // ASP.NET role claim URI(s)
  for (const [key, value] of Object.entries(payload)) {
    if (key.toLowerCase().includes("/claims/role")) {
      roles.push(...toStringArray(value));
    }
  }

  return Array.from(new Set(roles.map((r) => r.trim()).filter(Boolean)));
}

export function getJwtEmail(payload: JwtPayload | null): string | null {
  if (!payload) return null;

  const direct = payload.email;
  if (typeof direct === "string" && direct) return direct;

  const emailKey = Object.keys(payload).find((k) => k.toLowerCase().includes("emailaddress"));
  const emailValue = emailKey ? payload[emailKey] : null;
  if (typeof emailValue === "string" && emailValue) return emailValue;

  const uniqueName = payload.unique_name;
  if (typeof uniqueName === "string" && uniqueName.includes("@")) return uniqueName;

  return null;
}

export function getJwtName(payload: JwtPayload | null): string | null {
  if (!payload) return null;

  const candidates = [payload.name, payload.fullName, payload.given_name, payload.preferred_username];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  return null;
}

export function getJwtUserId(payload: JwtPayload | null): string | null {
  if (!payload) return null;

  const direct = payload.sub;
  if (typeof direct === "string" && direct) return direct;

  const nameIdKey = Object.keys(payload).find((k) => k.toLowerCase().includes("nameidentifier"));
  const nameIdVal = nameIdKey ? payload[nameIdKey] : null;
  if (typeof nameIdVal === "string" && nameIdVal) return nameIdVal;

  return null;
}

export function getJwtExpiryEpochSeconds(payload: JwtPayload | null): number | null {
  if (!payload) return null;
  const exp = payload.exp;
  if (typeof exp === "number" && Number.isFinite(exp)) return exp;
  if (typeof exp === "string") {
    const n = Number(exp);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
