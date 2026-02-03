import { Outlet } from "react-router-dom";
import { ManagerSidebar } from "./ManagerSidebar";

export function ManagerLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <ManagerSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
