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
import { KitchenLayout } from "@/components/layout/KitchenLayout";
import { POSLayout } from "@/components/layout/POSLayout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import POSLogin from "@/pages/auth/POSLogin";

// Student Pages
import StudentHome from "@/pages/student/StudentHome";
import StudentMenu from "@/pages/student/StudentMenu";
import StudentWallet from "@/pages/student/StudentWallet";
import StudentCart from "@/pages/student/StudentCart";

// Staff Pages
import POSTerminal from "@/pages/staff/POSTerminal";
import ShiftClose from "@/pages/staff/ShiftClose";
import ShiftCountCash from "@/pages/staff/ShiftCountCash";
import KitchenDashboard from "@/pages/staff/KitchenDashboard";
import KitchenKDS from "@/pages/staff/KitchenKDS";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MenuManagement from "@/pages/admin/MenuManagement";
import ReportsPage from "@/pages/admin/ReportsPage";
import ShiftManagement from "@/pages/admin/ShiftManagement";
import UserManagement from "@/pages/admin/UserManagement";
import ShiftDetail from "@/pages/admin/ShiftDetail";

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

            {/* Legacy student redirects */}
            <Route path="/home" element={<Navigate to="/student/home" replace />} />
            <Route path="/wallet" element={<Navigate to="/student/wallet" replace />} />
            <Route path="/orders" element={<Navigate to="/student/orders" replace />} />
            <Route path="/profile" element={<Navigate to="/student/profile" replace />} />
            <Route path="/cart" element={<Navigate to="/student/cart" replace />} />
            <Route path="/category/:category" element={<LegacyStudentCategoryRedirect />} />

            {/* Protected app */}
            <Route element={<RequireAuth />}>
              {/* Student */}
              <Route element={<RequireRoles anyOf={["Student", "Parent"]} />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student" element={<Navigate to="/student/home" replace />} />
                  <Route path="/student/home" element={<StudentHome />} />
                  <Route path="/student/menu" element={<StudentMenu />} />
                  <Route path="/student/menu/category/:category" element={<StudentMenu />} />
                  <Route path="/student/wallet" element={<StudentWallet />} />
                  <Route path="/student/orders" element={<StudentMenu />} />
                  <Route path="/student/profile" element={<StudentMenu />} />
                  <Route path="/student/cart" element={<StudentCart />} />
                </Route>
              </Route>

              {/* Admin / Manager */}
              <Route element={<RequireRoles anyOf={["AdminSystem", "Manager"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/menu" element={<MenuManagement />} />
                  <Route path="/admin/reports" element={<ReportsPage />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/shift/:id" element={<ShiftDetail />} />
                  <Route path="/admin/staff" element={<UserManagement />} />
                  <Route path="/admin/settings" element={<AdminDashboard />} />
                </Route>
              </Route>

              {/* Kitchen */}
              <Route element={<RequireRoles anyOf={["StaffKitchen", "Staff", "Manager", "AdminSystem"]} />}>
                <Route element={<KitchenLayout />}>
                  <Route path="/kitchen" element={<KitchenDashboard />} />
                  <Route path="/kitchen/menu" element={<KitchenDashboard />} />
                  <Route path="/kitchen/inventory" element={<KitchenDashboard />} />
                  <Route path="/kitchen/staff" element={<KitchenDashboard />} />
                </Route>
                <Route path="/kitchen/kds" element={<KitchenKDS />} />
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
