// Types mirrored from BE DTOs / responses (best-effort).

export type Guid = string;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  expiredAt: string;
};

export type CategoryResponse = {
  id: Guid;
  name: string;
  isActive: boolean;
};

export type CreateCategoryRequest = {
  name: string;
};

export type UpdateCategoryRequest = {
  name: string;
  isActive: boolean;
};

export type MenuItemResponse = {
  id: Guid;
  categoryId: Guid;
  categoryName: string;
  name: string;
  price: number;
  inventoryQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
  xmin: number;
};

export type CreateMenuItemRequest = {
  categoryId: Guid;
  name: string;
  price: number;
  inventoryQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
};

export type UpdateMenuItemRequest = {
  name: string;
  price: number;
  inventoryQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
  xmin: number;
};

export type StaffConfirmRequest = {
  cash: number;
  qr: number;
};

export type CurrentShiftResponse = {
  id: Guid;
  status: string;
  openedAt: string;
  systemCashTotal: number;
  systemQrTotal: number;
  systemOnlineTotal: number;
  staffCashInput?: number | null;
  staffQrInput?: number | null;
};

export type CreateOnlineOrderItem = {
  itemId: Guid;
  quantity: number;
};

export type CreateOnlineOrderRequest = {
  pickupTime?: string | null;
  items: CreateOnlineOrderItem[];
};

export type CreateOnlineOrderResponse = {
  orderId: Guid;
  total: number;
};

export type CreateOfflineOrderItem = {
  itemId: Guid;
  quantity: number;
};

export type CreateOfflineOrderRequest = {
  totalPrice: number;
  items: CreateOfflineOrderItem[];
};

export type CreateOfflineOrderResponse = {
  orderId: Guid;
  qrUrl: string;
};

export type KitchenOrdersResponse = {
  urgent: unknown[];
  upcoming: unknown[];
};

export type DailyReportResponse = {
  date: string;
  shifts: Array<{
    id: Guid;
    userId: Guid;
    openedAt: string;
    closedAt: string | null;
    systemCashTotal: number;
    systemQrTotal: number;
    systemOnlineTotal: number;
    staffCashInput: number | null;
    staffQrInput: number | null;
  }>;
  summary: {
    totalCash: number;
    totalQr: number;
    totalOnline: number;
    totalRevenue: number;
  };
};

export type DashboardSnapshotResponse = {
  shifts: Array<{
    id: Guid;
    userId: Guid;
    status: string;
    systemCashTotal: number;
    systemQrTotal: number;
    systemOnlineTotal: number;
  }>;
  totalCash: number;
  totalQr: number;
  totalOnline: number;
};

export type ShiftDetailResponse = {
  id: Guid;
  userId: Guid;
  openedAt: string;
  closedAt: string | null;
  systemCashTotal: number;
  systemQrTotal: number;
  systemOnlineTotal: number;
  staffCashInput: number | null;
  staffQrInput: number | null;
};

export type CreateUserRequest = {
  email: string;
  fullName: string;
  password: string;
  role: string;
};

export type AdminUserListItem = {
  id: Guid;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
};

export type CreateUserResponse = {
  id: Guid;
  email: string;
  role: string;
};

export type WalletMeResponse = {
  walletId: Guid;
  balance: number;
};

export type WalletTransactionItem = {
  id: Guid;
  createdAt: string;
  amount: number;
  type: number;
  status: number;
  paymentMethod: number;
  orderId?: Guid | null;
};

export type WalletTransactionsResponse = {
  total: number;
  items: WalletTransactionItem[];
};

export type ToggleUserResponse = {
  id: Guid;
  isActive: boolean;
};

export const hubs = {
  order: "/hubs/order",
  management: "/hubs/management",
  kitchen: "/hubs/kitchen",
} as const;

export const hubMethods = {
  joinCampus: "JoinCampus",
  joinShift: "JoinShift",
  leaveShift: "LeaveShift",
  leaveCampus: "LeaveCampus",
} as const;

export const hubEvents = {
  // ManagementHub broadcasts
  menuItemCreated: "MenuItemCreated",
  menuItemUpdated: "MenuItemUpdated",
  menuItemDeleted: "MenuItemDeleted",
  orderCreated: "OrderCreated",
  orderPaid: "OrderPaid",
  walletTopup: "WalletTopup",
  shiftOpened: "ShiftOpened",
  shiftClosed: "ShiftClosed",

  // OrderHub (per-user) broadcast
  orderReady: "OrderReady",
} as const;
