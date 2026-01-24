import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pos/login" element={<POSLogin />} />
          
          {/* Student Homepage (standalone) */}
          <Route path="/home" element={<StudentHome />} />
          
          {/* Student Routes */}
          <Route element={<StudentLayout />}>
            <Route path="/" element={<StudentMenu />} />
            <Route path="/category/:category" element={<StudentMenu />} />
            <Route path="/wallet" element={<StudentWallet />} />
            <Route path="/orders" element={<StudentMenu />} />
            <Route path="/profile" element={<StudentMenu />} />
          </Route>
          
          {/* Cart (standalone) */}
          <Route path="/cart" element={<StudentCart />} />
          
          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/shift/:id" element={<ShiftDetail />} />
            <Route path="/admin/staff" element={<UserManagement />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
          </Route>
          
          {/* Kitchen Routes */}
          <Route element={<KitchenLayout />}>
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/kitchen/menu" element={<KitchenDashboard />} />
            <Route path="/kitchen/inventory" element={<KitchenDashboard />} />
            <Route path="/kitchen/staff" element={<KitchenDashboard />} />
          </Route>
          
          {/* Kitchen KDS (standalone - dark theme) */}
          <Route path="/kitchen/kds" element={<KitchenKDS />} />
          
          {/* POS Routes */}
          <Route element={<POSLayout />}>
            <Route path="/pos" element={<POSTerminal />} />
          </Route>
          
          {/* Shift Management (standalone) */}
          <Route path="/shift" element={<ShiftManagement />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
