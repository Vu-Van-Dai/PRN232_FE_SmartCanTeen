import { apiRequest } from "./http";
import type { MeProfileResponse, UpdateMeProfileRequest } from "./types";

export async function getMe(): Promise<MeProfileResponse> {
  return apiRequest<MeProfileResponse>("/api/users/me");
}

export async function patchMe(request: UpdateMeProfileRequest): Promise<void> {
  await apiRequest<void>("/api/users/me", {
    method: "PATCH",
    body: request,
  });
}
