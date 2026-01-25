import { apiRequest } from "./http";
import type { Guid } from "./types";

export type RestockInventoryRequest = {
  itemId: Guid;
  quantity: number;
  note?: string | null;
};

export type RestockInventoryResponse = {
  itemId: Guid;
  inventoryQuantity: number;
};

export function restock(body: RestockInventoryRequest) {
  return apiRequest<RestockInventoryResponse>("/api/inventory/restock", {
    method: "POST",
    body,
  });
}
