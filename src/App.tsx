import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { RequireAuth, RequireRoles, RootRedirect } from "@/routes/auth-guards";

// Layouts
import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { KitchenLayout } from "@/components/layout/KitchenLayout";
import { POSLayout } from "@/components/layout/POSLayout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import POSLogin from "@/pages/auth/POSLogin";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ForceChangePasswordPage from "@/pages/auth/ForceChangePasswordPage";

// Student Pages
import StudentHome from "@/pages/student/StudentHome";
import StudentMenu from "@/pages/student/StudentMenu";
import StudentWallet from "@/pages/student/StudentWallet";
import StudentCart from "@/pages/student/StudentCart";
import StudentMyOrders from "@/pages/student/StudentMyOrders";
import StudentProfile from "@/pages/student/StudentProfile";

// Staff Pages
import POSTerminal from "@/pages/staff/POSTerminal";
import ShiftClose from "@/pages/staff/ShiftClose";
import ShiftCountCash from "@/pages/staff/ShiftCountCash";
import KitchenDashboard from "@/pages/staff/KitchenDashboard";
import KitchenKDS from "@/pages/staff/KitchenKDS";
import DrinkBoard from "@/pages/staff/DrinkBoard";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MenuManagement from "@/pages/admin/MenuManagement";
import MenuManagementReadOnly from "@/pages/admin/MenuManagementReadOnly";
import ReportsPage from "@/pages/admin/ReportsPage";
import ShiftManagement from "@/pages/admin/ShiftManagement";
import UserManagement from "@/pages/admin/UserManagement";
import ShiftDetail from "@/pages/admin/ShiftDetail";
import PromotionsManagement from "@/pages/admin/PromotionsManagement";

// Manager Pages
import CategoryManagement from "@/pages/manager/CategoryManagement";
import ManagerReportsPage from "@/pages/manager/ReportsPage";
import ManagerDashboardPage from "@/pages/manager/DashboardPage";
import ScreenSettingsPage from "@/pages/manager/ScreenSettingsPage";

// PayOS return/cancel
import PayosReturn from "@/pages/payos/PayosReturn";
import PayosCancel from "@/pages/payos/PayosCancel";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LegacyStudentCategoryRedirect() {
  const { category } = useParams();
  return <Navigate to={`/student/menu/category/${category ?? ""}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/pos/login" element={<Navigate to="/auth/pos" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/pos" element={<POSLogin />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* PayOS redirects */}
            <Route path="/payos/return" element={<PayosReturn />} />
            <Route path="/payos/cancel" element={<PayosCancel />} />

            {/* Legacy student redirects */}
            <Route path="/home" element={<Navigate to="/student/home" replace />} />
            <Route path="/wallet" element={<Navigate to="/student/wallet" replace />} />
            <Route path="/orders" element={<Navigate to="/student/orders" replace />} />
            <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
            <Route path="/cart" element={<Navigate to="/student/cart" replace />} />
            <Route path="/category/:category" element={<LegacyStudentCategoryRedirect />} />

            {/* Protected app */}
            <Route element={<RequireAuth />}>
              <Route path="/auth/force-change-password" element={<ForceChangePasswordPage />} />

              {/* Student */}
              <Route element={<RequireRoles anyOf={["Student", "Parent"]} />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student" element={<Navigate to="/student/home" replace />} />
                  <Route path="/student/home" element={<StudentHome />} />
                  <Route path="/student/menu" element={<StudentMenu />} />
                  <Route path="/student/menu/category/:category" element={<StudentMenu />} />
                  <Route path="/student/wallet" element={<StudentWallet />} />
                  <Route path="/student/orders" element={<StudentMyOrders />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                  <Route path="/student/cart" element={<StudentCart />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route element={<RequireRoles anyOf={["AdminSystem"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/menu" element={<MenuManagementReadOnly />} />
                  <Route path="/admin/promotions" element={<PromotionsManagement />} />
                  <Route path="/admin/reports" element={<ReportsPage />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/shift/:id" element={<ShiftDetail />} />
                  <Route path="/admin/staff" element={<UserManagement />} />
                  <Route path="/admin/settings" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Manager */}
              <Route element={<RequireRoles anyOf={["Manager"]} />}>
                <Route element={<ManagerLayout />}>
                  <Route path="/manager" element={<ManagerDashboardPage />} />
                  <Route path="/manager/menu" element={<MenuManagement />} />
                  <Route path="/manager/categories" element={<CategoryManagement />} />
                  <Route path="/manager/reports" element={<ManagerReportsPage />} />
                  <Route path="/manager/settings" element={<ScreenSettingsPage />} />
                </Route>
              </Route>

              {/* Kitchen - Coordination (Order board only) */}
              <Route element={<RequireRoles anyOf={["StaffCoordination", "Manager", "AdminSystem"]} />}>
                <Route element={<KitchenLayout />}>
                  <Route path="/kitchen" element={<Navigate to="/kitchen/board" replace />} />
                  <Route path="/kitchen/board" element={<KitchenDashboard />} />
                </Route>
              </Route>

              {/* Kitchen - Kitchen staff (KDS only) */}
              <Route element={<RequireRoles anyOf={["StaffKitchen", "Manager", "AdminSystem"]} />}>
                <Route path="/kitchen/kds" element={<KitchenKDS />} />
              </Route>

              {/* Drink station */}
              <Route element={<RequireRoles anyOf={["StaffDrink", "Manager", "AdminSystem"]} />}>
                <Route element={<KitchenLayout />}>
                  <Route path="/drink" element={<Navigate to="/drink/board" replace />} />
                  <Route path="/drink/board" element={<DrinkBoard />} />
                </Route>
              </Route>

              {/* POS */}
              <Route element={<RequireRoles anyOf={["StaffPOS", "Staff", "Manager", "AdminSystem"]} />}>
                <Route element={<POSLayout />}>
                  <Route path="/pos" element={<POSTerminal />} />
                  <Route path="/pos/shift-close" element={<ShiftClose />} />
                  <Route path="/pos/shift-close/cash" element={<ShiftCountCash />} />
                </Route>
              </Route>

              {/* Shifts (staff actions) */}
              <Route element={<RequireRoles anyOf={["Staff", "Manager", "AdminSystem"]} />}>
                <Route path="/shift" element={<ShiftManagement />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
