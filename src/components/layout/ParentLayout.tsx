import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ParentSidebar } from "./ParentSidebar";
import { ParentHeader } from "./ParentHeader";

export function ParentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("parentSidebarCollapsed");
      if (raw === "1") setSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("parentSidebarCollapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <ParentSidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <ParentHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
