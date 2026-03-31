import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthResponse } from "@/types/api";
import { getStoredAuth, setStoredAuth } from "@/lib/auth";
import * as api from "@/lib/api";

interface AuthContextValue {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: { email: string; password: string }) => Promise<AuthResponse>;
  register: (payload: { name: string; email: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      isAdmin: auth?.user.role === "admin",
      async login(payload) {
        const response = await api.login(payload);
        setStoredAuth(response);
        setAuth(response);
        return response;
      },
      async register(payload) {
        const response = await api.register(payload);
        setStoredAuth(response);
        setAuth(response);
        return response;
      },
      async logout() {
        await api.logout();
        setAuth(null);
      }
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
