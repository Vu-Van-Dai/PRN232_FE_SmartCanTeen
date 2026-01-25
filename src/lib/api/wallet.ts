import { apiRequest } from "./http";
import type { Guid, WalletMeResponse, WalletTransactionsResponse } from "./types";

export function getMyWallet() {
  return apiRequest<WalletMeResponse>("/api/wallet/me", { method: "GET" });
}

// Student/Parent tự nạp ví của mình
export function topupMyWallet(amount: number) {
  return apiRequest<{ paymentUrl: string }>("/api/wallet/topup", {
    method: "POST",
    query: { amount },
  });
}

export function getMyWalletTransactions(params?: { skip?: number; take?: number }) {
  return apiRequest<WalletTransactionsResponse>("/api/wallet/transactions", {
    method: "GET",
    query: {
      skip: params?.skip ?? 0,
      take: params?.take ?? 20,
    },
  });
}

// Parent nạp ví con
export function topupChildWallet(walletId: Guid, amount: number) {
  return apiRequest<{ qrUrl: string }>(`/api/wallets/${walletId}/topup`, {
    method: "POST",
    query: { amount },
  });
}
