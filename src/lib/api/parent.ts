import { apiRequest } from "./http";
import type { Guid, StudentOrderDto, WalletMeResponse, WalletTransactionsResponse } from "./types";

export type ParentLinkedChild = {
  id: Guid;
  name: string | null;
  email: string;
  studentCode: string | null;
  relationType: string;
  createdAt: string;
};

export function listMyLinkedChildren() {
  return apiRequest<ParentLinkedChild[]>("/api/parent/account-linking/children");
}

export function linkChild(query: string, relationType?: "Father" | "Mother" | "Guardian") {
  return apiRequest<{ message: string }>("/api/parent/account-linking/link", {
    method: "POST",
    body: {
      query,
      relationType,
    },
  });
}

export function unlinkChild(studentId: Guid) {
  return apiRequest<{ message: string }>(`/api/parent/account-linking/children/${studentId}`, {
    method: "DELETE",
  });
}

export function getChildOrders(studentId: Guid) {
  return apiRequest<StudentOrderDto[]>(`/api/parent/children/${studentId}/orders`);
}

export function getChildWallet(studentId: Guid) {
  return apiRequest<WalletMeResponse>(`/api/parent/children/${studentId}/wallet`);
}

export function getChildWalletTransactions(studentId: Guid, args: { skip?: number; take?: number } = {}) {
  const skip = args.skip ?? 0;
  const take = args.take ?? 20;
  return apiRequest<WalletTransactionsResponse>(
    `/api/parent/children/${studentId}/wallet/transactions?skip=${encodeURIComponent(skip)}&take=${encodeURIComponent(take)}`
  );
}
