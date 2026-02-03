import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDefaultPathForRoles, hasAnyRole } from "@/lib/auth/role-routing";

export function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <Navigate to={getDefaultPathForRoles(user?.roles ?? [])} replace />;
}

export function RequireAuth() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  const mustChange = user?.mustChangePassword;
  const path = location.pathname;
  if (mustChange && path !== "/auth/force-change-password") {
    return <Navigate to="/auth/force-change-password" replace />;
  }

  return <Outlet />;
}

export function RequireRoles({ anyOf }: { anyOf: string[] }) {
  const { user } = useAuth();
  if (!hasAnyRole(user?.roles ?? [], anyOf)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
