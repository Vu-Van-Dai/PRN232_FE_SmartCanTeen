import { apiRequest } from "./http";
import type {
  CreatePromotionRequest,
  Guid,
  PromotionResponse,
  UpdatePromotionRequest,
} from "./types";

export function getPromotions() {
  return apiRequest<PromotionResponse[]>("/api/admin/promotions", { method: "GET" });
}

export function getPromotion(id: Guid) {
  return apiRequest<PromotionResponse>(`/api/admin/promotions/${id}`, { method: "GET" });
}

export function createPromotion(body: CreatePromotionRequest) {
  return apiRequest<Guid>("/api/admin/promotions", { method: "POST", body });
}

export function updatePromotion(id: Guid, body: UpdatePromotionRequest) {
  return apiRequest<void>(`/api/admin/promotions/${id}`, { method: "PUT", body });
}

export function deletePromotion(id: Guid) {
  return apiRequest<void>(`/api/admin/promotions/${id}`, { method: "DELETE" });
}
