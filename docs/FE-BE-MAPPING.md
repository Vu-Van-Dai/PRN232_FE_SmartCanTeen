# FE ↔ BE Function Mapping

This document maps current FE screens/features in `PRN232_FE_SmartCanTeen` to BE endpoints available in `PRN232_SmartCanTeen`.

## BE Base

- REST base: `VITE_API_BASE_URL` (configure in FE)
- SignalR hubs:
  - `/hubs/order`
  - `/hubs/management`
  - `/hubs/kitchen`

## FE Screens → BE Endpoints

### Auth

- Login screen: `src/pages/auth/LoginPage.tsx`
  - ✅ `POST /api/auth/login`
  - Note: FE is currently mock-routing by email text; real routing should be based on roles in JWT.

- POS login screen: `src/pages/auth/POSLogin.tsx`
  - ✅ `POST /api/auth/login` (requires role `StaffPOS`/`Staff`/`Manager` depending on your setup)

### Admin / Manager

- User management: `src/pages/admin/UserManagement.tsx`
  - ✅ `GET /api/admin/users?role=`
  - ✅ `POST /api/admin/users` (create)
  - ✅ `POST /api/admin/users/{id}/toggle` (lock/unlock)
  - Role gate (BE): `AdminCampus` or `AdminSystem`/`AdminCampus` for toggle.

- Menu management: `src/pages/admin/MenuManagement.tsx`
  - ✅ `GET /api/menu-items`
  - ✅ `POST /api/menu-items`
  - ✅ `PUT /api/menu-items/{id}` (requires `xmin` optimistic-lock value)
  - ✅ `DELETE /api/menu-items/{id}`
  - ✅ Categories (used for menu item creation):
    - `GET /api/categories`
    - `POST /api/categories`
    - `PUT /api/categories/{id}`
    - `DELETE /api/categories/{id}`
  - Role gate (BE): `Manager`.

- Dashboard overview: `src/pages/admin/AdminDashboard.tsx`
  - ✅ `GET /api/management/reports/dashboard`

- Reports page: `src/pages/admin/ReportsPage.tsx`
  - ✅ `GET /api/management/reports/daily?date=...`
  - ✅ `POST /api/management/reports/close-day?date=...`

- Shift detail: `src/pages/admin/ShiftDetail.tsx`
  - ✅ `GET /api/management/reports/shift/{shiftId}`

- Staff role assignment (no FE screen currently wired)
  - ✅ `POST /api/manager/staff/{userId}/assign?roleName=Kitchen|StaffPos`
  - ✅ `DELETE /api/manager/staff/{userId}/remove?roleName=Kitchen|StaffPos`

### Staff / POS

- POS terminal: `src/pages/staff/POSTerminal.tsx`
  - ✅ `POST /api/pos/orders` (creates offline order + returns VNPay QR URL)
  - ⚠️ FE needs a menu listing for POS. BE currently only exposes `GET /api/menu-items` but it is `Manager`-only.

- Shift actions (partially represented in UI): `src/pages/admin/ShiftManagement.tsx`
  - ✅ `POST /api/shifts/open`
  - ✅ `POST /api/shifts/start-declare`
  - ✅ `POST /api/shifts/start-counting`
  - ✅ `POST /api/shifts/confirm` (body: `{ cash, qr }`)
  - ✅ `POST /api/shifts/close`

- Kitchen KDS / dashboard: `src/pages/staff/KitchenKDS.tsx`, `src/pages/staff/KitchenDashboard.tsx`
  - ✅ `GET /api/kitchen/orders` (urgent + upcoming)
  - ✅ `POST /api/kitchen/{orderId}/prepare`
  - ✅ `POST /api/kitchen/{orderId}/ready` (also pushes `OrderReady` to student via SignalR OrderHub)

### Student

- Student menu: `src/pages/student/StudentMenu.tsx`
  - ✅ `GET /api/categories` (read-only for authenticated users)
  - ✅ `GET /api/menu-items` (read-only for authenticated users)

- Student cart / checkout: `src/pages/student/StudentCart.tsx`
  - ✅ `POST /api/online/orders` (create online order)
  - ✅ `POST /api/wallet/pay/{orderId}` (wallet payment)
  - ❌ FE offers VNPay payment for online order; BE does not provide a VNPay online-order payment flow.

- Student wallet: `src/pages/student/StudentWallet.tsx`
  - ✅ Current wallet balance: `GET /api/wallet/me`
  - ✅ Parent top-up (for child wallet): `POST /api/wallets/{walletId}/topup?amount=...` (returns `qrUrl`)
  - ❌ No BE endpoint currently exposed for:
    - listing transactions
    - student self-topup (only Parent can topup in BE controller)

## BE Endpoints not currently implemented in FE UI

Even where an FE screen exists, most are still mock-data only and do not call BE yet. These BE endpoints have no real FE integration today:

- `POST /api/auth/login`
- Admin users:
  - `GET /api/admin/users?role=`
  - `POST /api/admin/users`
  - `POST /api/admin/users/{id}/toggle`
- Staff role management:
  - `POST /api/manager/staff/{userId}/assign?roleName=Kitchen|StaffPos`
  - `DELETE /api/manager/staff/{userId}/remove?roleName=Kitchen|StaffPos`
- Categories CRUD:
  - `GET /api/categories`, `GET /api/categories/{id}`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`
- Menu items CRUD:
  - `GET /api/menu-items`, `POST /api/menu-items`, `PUT /api/menu-items/{id}`, `DELETE /api/menu-items/{id}`
- Shifts workflow:
  - `POST /api/shifts/open`, `POST /api/shifts/start-declare`, `POST /api/shifts/start-counting`, `POST /api/shifts/confirm`, `POST /api/shifts/close`
- Orders:
  - `POST /api/online/orders`
  - `POST /api/pos/orders`
  - `POST /api/wallet/pay/{orderId}`
- Kitchen:
  - `GET /api/kitchen/orders`
  - `POST /api/kitchen/{orderId}/prepare`
  - `POST /api/kitchen/{orderId}/ready`
- Reports:
  - `GET /api/management/reports/dashboard`
  - `GET /api/management/reports/daily?date=`
  - `POST /api/management/reports/close-day?date=`
  - `GET /api/management/reports/shift/{shiftId}`
- VNPAY IPN callback (server-to-server): `GET /api/vnpay/ipn`

## FE API Interface (added)

A typed FE API interface mirroring these endpoints is available under:

- `src/lib/api/*`

Set `VITE_API_BASE_URL` (e.g. in a `.env.local`) so requests can run.
