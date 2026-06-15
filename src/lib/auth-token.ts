// Client-side fallback for session token (used when iframe blocks 3rd-party cookies).
const KEY = "pintos:auth_token";

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
