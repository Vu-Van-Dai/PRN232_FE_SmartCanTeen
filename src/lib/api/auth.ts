import { apiRequest } from "./http";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordWithOtpRequest,
} from "./types";

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

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  const res = await apiRequest<LoginResponse>("/api/auth/change-password", {
    method: "POST",
    body: request,
  });

  try {
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("accessTokenExpiredAt", res.expiredAt);
  } catch {
    // ignore
  }
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: request,
  });
}

export async function resetPasswordWithOtp(request: ResetPasswordWithOtpRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: request,
  });
}
