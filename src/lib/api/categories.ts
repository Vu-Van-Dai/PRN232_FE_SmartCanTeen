import { apiRequest } from "./http";
import type {
  CategoryResponse,
  CreateCategoryRequest,
  Guid,
  UpdateCategoryRequest,
} from "./types";

export function getCategories() {
  return apiRequest<CategoryResponse[]>("/api/categories", { method: "GET" });
}

export function getCategory(id: Guid) {
  return apiRequest<CategoryResponse>(`/api/categories/${id}`, { method: "GET" });
}

export function createCategory(body: CreateCategoryRequest) {
  return apiRequest<Guid>("/api/categories", { method: "POST", body });
}

export function updateCategory(id: Guid, body: UpdateCategoryRequest) {
  return apiRequest<void>(`/api/categories/${id}`, { method: "PUT", body });
}

export function deleteCategory(id: Guid) {
  return apiRequest<void>(`/api/categories/${id}`, { method: "DELETE" });
}
