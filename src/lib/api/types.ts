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

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type MeProfileResponse = {
  id: Guid;
  email: string;
  fullName: string | null;
  studentCode: string | null;
  avatarUrl: string | null;
  orderReadyNotificationsEnabled: boolean;
  roles: string[];
};

export type UpdateMeProfileRequest = {
  avatarUrl?: string | null;
  orderReadyNotificationsEnabled?: boolean;
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
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  isActive: boolean;
  xmin?: number;
};

export type CreateMenuItemRequest = {
  categoryId: Guid;
  name: string;
  price: number;
  inventoryQuantity: number;
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  isActive: boolean;
};

export type UpdateMenuItemRequest = {
  name: string;
  price: number;
  inventoryQuantity: number;
  imageUrls?: string[] | null;
  imageUrl?: string | null;
  isActive: boolean;
  xmin?: number;
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
  // Backward-compat (older flow redirected to PayOS checkoutUrl)
  qrUrl?: string;

  // In-app POS QR modal
  checkoutUrl?: string;
  qrCode?: string | null;
  orderCode?: number;
};

export type PosPaymentStatusResponse = {
  orderId: Guid;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
};

export type KitchenOrderItemDto = {
  itemId: Guid;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type KitchenOrderDto = {
  id: Guid;
  createdAt: string;
  pickupTime: string | null;
  status: string;
  // Present when calling station screens (screenKey provided)
  stationTaskStatus?: number | null;
  stationTaskStartedAt?: string | null;
  stationTaskReadyAt?: string | null;
  stationTaskCompletedAt?: string | null;
  isUrgent: boolean;
  totalPrice: number;
  orderedBy: string;
  items: KitchenOrderItemDto[];
};

export type KitchenOrdersResponse = {
  pending: KitchenOrderDto[];
  preparing: KitchenOrderDto[];
  ready: KitchenOrderDto[];
  completed: KitchenOrderDto[];
  urgent: KitchenOrderDto[];
  upcoming: KitchenOrderDto[];
};

export type DailyReportResponse = {
  date: string;
  shifts: Array<{
    id: Guid;
    userId: Guid;
    status: string;
    openedByName: string;
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
  stats: {
    totalOrders: number;
    totalItemsSold: number;
  };
};

export type ShiftOrderItem = {
  itemId: Guid;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DailySalesReportItem = {
  itemId: Guid;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  grossAmount: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
};

export type DailySalesReportResponse = {
  date: string;
  items: DailySalesReportItem[];
  totals: {
    totalItems: number;
    totalGrossAmount: number;
    totalDiscountAmount: number;
    totalVatAmount: number;
    totalAmount: number;
  };
};

export type ShiftOrderListItem = {
  orderId: Guid;
  createdAt: string;
  source: "Cash" | "QR" | "Online" | string;
  subTotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalPrice: number;
  status: string;
  createdBy: {
    type: "POS" | "User" | string;
    name: string;
  };
  items: ShiftOrderItem[];
};

export type ShiftReportResponse = {
  shiftId: Guid;
  operationalDate: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openedBy: {
    id: Guid;
    name: string;
  };
  revenue: {
    cashPos: number;
    qrPos: number;
    online: number;
    total: number;
  };
  stats: {
    totalOrders: number;
    totalItemsSold: number;
  };
  orders: ShiftOrderListItem[];
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

export type DashboardHourlyResponse = {
  date: string;
  points: Array<{
    hour: string;
    value: number;
  }>;
};

export type DayStatusResponse = {
  date: string;
  isClosed: boolean;
  isLockedNow: boolean;
  currentOperationalDate: string;
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
  password?: string;
  role: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordWithOtpRequest = {
  email: string;
  otp: string;
  newPassword: string;
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

export type PromotionType =
  | "BuyXGetY"
  | "CategoryDiscount"
  | "Bundle"
  | "Clearance"
  | "BuyMoreSaveMore";

export type PromotionResponse = {
  id: Guid;
  name: string;
  code: string;
  type: PromotionType | string;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  configJson: string;
  createdAt: string;
};

export type CreatePromotionRequest = {
  name: string;
  code: string;
  type: PromotionType;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  config: Record<string, unknown>;
};

export type UpdatePromotionRequest = {
  name: string;
  code: string;
  type: PromotionType;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  config: Record<string, unknown>;
};

export type StudentOrderItemDto = {
  itemId: Guid;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type StudentOrderDto = {
  id: Guid;
  createdAt: string;
  pickupTime: string | null;
  status: number;
  totalPrice: number;
  items: StudentOrderItemDto[];
  stationTasks?: Array<{
    screenKey: string;
    screenName: string;
    status: number;
    startedAt?: string | null;
    readyAt?: string | null;
    completedAt?: string | null;
  }>;
  pickedAtCounter?: string | null;
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
