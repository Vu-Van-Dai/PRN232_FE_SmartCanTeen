import { apiRequest } from "./http";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  });

  try {
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("accessTokenExpiredAt", res.expiredAt);
  } catch {
    // ignore storage failures
  }

  return res;
}

export function logout() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accessTokenExpiredAt");
  } catch {
    // ignore
  }
}
