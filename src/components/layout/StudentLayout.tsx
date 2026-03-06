import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";
import { CartProvider } from "@/lib/cart/CartContext";
import { StudentMobileNav } from "./StudentMobileNav.tsx";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function StudentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("studentSidebarCollapsed");
      if (raw === "1") setSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("studentSidebarCollapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <CartProvider>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="min-h-screen flex flex-col md:flex-row w-full bg-background">
          <div className="hidden md:block">
            <StudentSidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <StudentHeader
              mobileNavOpen={mobileNavOpen}
              onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
            />

            <SheetContent side="left" className="p-0 w-4/5 max-w-xs">
              <StudentMobileNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>

            <main className="flex-1 p-4 md:p-6 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </Sheet>
    </CartProvider>
  );
}
