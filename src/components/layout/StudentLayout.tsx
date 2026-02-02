import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { StudentHeader } from "./StudentHeader";
import { CartProvider } from "@/lib/cart/CartContext";

export function StudentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return (
    <CartProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <StudentHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
