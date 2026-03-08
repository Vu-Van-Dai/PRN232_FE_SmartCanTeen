import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";
import { ensureOrderReadyWebPushRegistered, startFcmForegroundNotifications } from "@/lib/fcm";
import {
  decodeJwtPayload,
  getJwtEmail,
  getJwtExpiryEpochSeconds,
  getJwtMustChangePassword,
  getJwtName,
  getJwtRoles,
  getJwtUserId,
} from "./jwt";

export type AuthUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  roles: string[];
  mustChangePassword: boolean;
};

export type AuthState = {
  accessToken: string | null;
  expiredAt: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthState>;
  logout: () => void;
  reloadFromStorage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): { accessToken: string | null; expiredAt: string | null } {
  try {
    return {
      accessToken: localStorage.getItem("accessToken"),
      expiredAt: localStorage.getItem("accessTokenExpiredAt"),
    };
  } catch {
    return { accessToken: null, expiredAt: null };
  }
}

function clearStorage() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("accessTokenExpiredAt");
  } catch {
    // ignore
  }
}

function isExpired(token: string | null, expiredAt: string | null): boolean {
  if (!token) return true;

  if (expiredAt) {
    const ms = Date.parse(expiredAt);
    if (!Number.isNaN(ms)) return ms <= Date.now();
  }

  const payload = decodeJwtPayload(token);
  const exp = getJwtExpiryEpochSeconds(payload);
  if (exp) {
    return exp * 1000 <= Date.now();
  }

  return false;
}

function buildUser(token: string | null): AuthUser | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const roles = getJwtRoles(payload);
  return {
    id: getJwtUserId(payload),
    email: getJwtEmail(payload),
    name: getJwtName(payload),
    roles,
    mustChangePassword: getJwtMustChangePassword(payload),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readStorage();
  const [state, setState] = useState<AuthState>(() => {
    if (!stored.accessToken || isExpired(stored.accessToken, stored.expiredAt)) {
      clearStorage();
      return { accessToken: null, expiredAt: null, user: null };
    }

    return {
      accessToken: stored.accessToken,
      expiredAt: stored.expiredAt,
      user: buildUser(stored.accessToken),
    };
  });

  const tryRegisterWebPush = () => {
    void (async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission === "denied") return;

        // Defer a tick to ensure token/storage is ready.
        await new Promise((r) => setTimeout(r, 50));

        await ensureOrderReadyWebPushRegistered();
      } catch (e) {
        console.warn("Web Push registration skipped", e);
      }
    })();
  };

  // After reload: if already authenticated and permission granted, enable foreground listener
  // and refresh token registration (no permission prompt).
  useEffect(() => {
    if (!state.accessToken) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    void startFcmForegroundNotifications();

    // Keep token fresh in the background.
    tryRegisterWebPush();
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!state.accessToken && !isExpired(state.accessToken, state.expiredAt);

    return {
      ...state,
      isAuthenticated,
      login: async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        const next: AuthState = {
          accessToken: res.accessToken,
          expiredAt: res.expiredAt,
          user: buildUser(res.accessToken),
        };
        setState(next);

        // Ask notification permission & register FCM token right after login.
        // Runs in background; does not block login UX.
        tryRegisterWebPush();

        return next;
      },
      logout: () => {
        authApi.logout();
        clearStorage();
        setState({ accessToken: null, expiredAt: null, user: null });
      },
      reloadFromStorage: () => {
        const s = readStorage();
        if (!s.accessToken || isExpired(s.accessToken, s.expiredAt)) {
          clearStorage();
          setState({ accessToken: null, expiredAt: null, user: null });
          return;
        }
        setState({ accessToken: s.accessToken, expiredAt: s.expiredAt, user: buildUser(s.accessToken) });
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
