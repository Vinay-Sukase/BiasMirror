import type { AuthResponse } from "@/types/api";

const STORAGE_KEY = "biasmirror-auth";

export function getStoredAuth(): AuthResponse | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    if (parsed?.user && !parsed.user.role) {
      parsed.user.role = "user";
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredAuth(value: AuthResponse | null) {
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
